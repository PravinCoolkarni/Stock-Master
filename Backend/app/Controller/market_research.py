from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.Schemas.research_response import ResearchResponse
from app.Services.scrapper import get_context_from_url as get_context_from_url_service
from app.Services.scrapper import get_context_from_doc as get_context_from_doc_service
from app.Services.scrapper import get_context_from_raw_text as get_context_from_raw_text_service
from app.Schemas.research_request import ResearchRequest
from app.Enum.content_type import ContentType
from app.Services.embedder import chunk_text as chunk_text_service
from app.Services.embedder import store_embeddings as store_embeddings_service
from app.Services.embedder import query_context as query_context_service
from app.Services.gemini import generate_answer as generate_answer_service
from app.Schemas.embed_context_request import EmbedContextRequest
from app.Core.dependencies import get_current_user
from app.DB.database import get_db
from app.Model.research_message import MessageRole, ResearchMessage
from app.Model.research_session import ResearchSession
from app.Model.user import User
from app.Schemas.research_session import (
    ResearchMessageOut,
    ResearchQuestionResponse,
    ResearchQuestionCreate,
    ResearchSessionDetail,
    ResearchSessionSeedResponse,
    ResearchSessionSummary,
)

router = APIRouter(prefix="/research", tags=["research"])


def _extract_context(request: ResearchRequest) -> ResearchResponse:
    response: ResearchResponse = ResearchResponse(sourceType=request.sourceType, context="")

    if request.sourceType == ContentType.URL:
        if not request.urls or len(request.urls) == 0:
            raise HTTPException(status_code=400, detail="No URL provided for sourceType 'url'.")
        for index, url in enumerate(request.urls, start=1):
            context = get_context_from_url_service(url)
            if context:
                response.context += f"{index}] => "
                response.context += context
                response.context += "\n\n"
        if response.context:
            return response
        raise HTTPException(status_code=404, detail="Could not extract context from any provided URLs.")
    if request.sourceType == ContentType.DOCS:
        if not request.docs:
            raise HTTPException(status_code=400, detail="No documents provided for sourceType 'Docs'.")
        context = get_context_from_doc_service(request.docs)
        if context:
            response.context = context
            return response
        raise HTTPException(status_code=404, detail="Could not extract context from documents.")
    if request.sourceType == ContentType.RAW_TEXT:
        if not request.rawText:
            raise HTTPException(status_code=400, detail="No raw text provided for sourceType 'Raw Text'.")
        context = get_context_from_raw_text_service(request.rawText)
        if context:
            response.context = context
            return response
        raise HTTPException(status_code=404, detail="Could not extract context from raw text.")

    raise HTTPException(status_code=400, detail=f"Unsupported sourceType '{request.sourceType}'.")


def _build_session_title(request: ResearchRequest) -> str:
    if request.sourceType == ContentType.URL and request.urls:
        return request.urls[0][:80]
    if request.sourceType == ContentType.DOCS and request.docs and request.docs.docName:
        return request.docs.docName[:80]
    if request.sourceType == ContentType.RAW_TEXT and request.rawText:
        return request.rawText[:80]
    return "New research chat"


def _build_source_summary(request: ResearchRequest) -> str:
    if request.sourceType == ContentType.URL:
        return ", ".join(request.urls[:3])
    if request.sourceType == ContentType.DOCS and request.docs:
        return request.docs.docName
    if request.sourceType == ContentType.RAW_TEXT:
        return request.rawText[:120]
    return "New source"


def _extract_retrieved_chunks(results: dict) -> list[str]:
    documents = results.get("documents") if isinstance(results, dict) else None
    if not documents:
        return []

    first_batch = documents[0] if documents and isinstance(documents[0], list) else documents
    return [chunk.strip() for chunk in first_batch if isinstance(chunk, str) and chunk.strip()]


@router.post("/get_research_context", dependencies=[Depends(get_current_user)])
def get_research_context(request: ResearchRequest):
    return _extract_context(request)


@router.get("/sessions", response_model=list[ResearchSessionSummary])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.user_id == current_user.id)
        .order_by(ResearchSession.updated_at.desc())
    )
    return list(result.scalars().all())


@router.get("/sessions/{session_id}", response_model=ResearchSessionDetail)
async def get_session_detail(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == current_user.id,
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found.")

    messages_result = await db.execute(
        select(ResearchMessage)
        .where(ResearchMessage.session_id == session_id, ResearchMessage.user_id == current_user.id)
        .order_by(ResearchMessage.created_at.asc())
    )
    messages = list(messages_result.scalars().all())
    return ResearchSessionDetail(session=session, messages=messages)


@router.post("/sessions/seed", response_model=ResearchSessionSeedResponse)
async def create_seeded_session(
    request: ResearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reviewed_context = (request.context or "").strip()
    response = (
        ResearchResponse(sourceType=request.sourceType, context=reviewed_context)
        if reviewed_context
        else _extract_context(request)
    )
    session = ResearchSession(
        user_id=current_user.id,
        title=_build_session_title(request),
        source_type=str(request.sourceType.name if hasattr(request.sourceType, "name") else request.sourceType),
        source_summary=_build_source_summary(request),
        embedded_context=response.context,
    )
    db.add(session)
    await db.flush()

    chunks = chunk_text_service(response.context)
    stored = store_embeddings_service(chunks, session.id)
    if not stored:
        raise HTTPException(status_code=500, detail="Failed to store research context for this session.")

    await db.commit()
    await db.refresh(session)
    return ResearchSessionSeedResponse(session=session)


@router.post("/sessions/{session_id}/messages", response_model=ResearchQuestionResponse)
async def create_message(
    session_id: str,
    request: ResearchQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == current_user.id,
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found.")

    history_result = await db.execute(
        select(ResearchMessage)
        .where(ResearchMessage.session_id == session_id, ResearchMessage.user_id == current_user.id)
        .order_by(ResearchMessage.created_at.asc())
    )
    existing_messages = list(history_result.scalars().all())

    user_message = ResearchMessage(
        session_id=session.id,
        user_id=current_user.id,
        role=MessageRole.user,
        content=request.content,
    )
    db.add(user_message)
    await db.flush()

    retrieval_results = query_context_service(request.content, session.id)
    retrieved_chunks = _extract_retrieved_chunks(retrieval_results)
    chat_history = [(message.role.value, message.content) for message in existing_messages]

    try:
        answer = await generate_answer_service(request.content, retrieved_chunks, chat_history)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not get a response from Gemini.") from exc

    assistant_message = ResearchMessage(
        session_id=session.id,
        user_id=current_user.id,
        role=MessageRole.assistant,
        content=answer,
    )
    db.add(assistant_message)
    session.message_count += 2
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    return ResearchQuestionResponse(
        user_message=user_message,
        assistant_message=assistant_message,
        retrieved_chunks=retrieved_chunks,
    )


@router.post("/embed_context", dependencies=[Depends(get_current_user)])
def embed_context(request: EmbedContextRequest):
    chunks = chunk_text_service(request.context)
    store_result = store_embeddings_service(chunks, request.session_id)
    return store_result

@router.get("/query_context", dependencies=[Depends(get_current_user)])
def query_context(query: str, session_id: str):
    results = query_context_service(query, session_id)
    return results
