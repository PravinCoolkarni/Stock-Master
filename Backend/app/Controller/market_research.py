from fastapi import APIRouter, HTTPException, Depends
from app.Schemas.research_response import ResearchResponse
from app.Services.scrapper import get_context_from_url as get_context_from_url_service
from app.Services.scrapper import get_context_from_doc as get_context_from_doc_service
from app.Services.scrapper import get_context_from_raw_text as get_context_from_raw_text_service
from app.Schemas.research_request import ResearchRequest
from app.Enum.content_type import ContentType
from app.Services.embedder import chunk_text as chunk_text_service
from app.Services.embedder import store_embeddings as store_embeddings_service
from app.Services.embedder import query_context as query_context_service
from app.Schemas.embed_context_request import EmbedContextRequest
from app.Core.dependencies import get_current_user

router = APIRouter(prefix="/research", tags=["research"])


@router.post("/get_research_context", dependencies=[Depends(get_current_user)])
def get_research_context(request: ResearchRequest):
    print("Received form data:", request)
    response: ResearchResponse = ResearchResponse(sourceType=request.sourceType, context="")

    if request.sourceType == ContentType.URL:
        if not request.urls or len(request.urls) == 0:
            raise HTTPException(status_code=400, detail="No URL provided for sourceType 'url'.")
        for index, url in enumerate(request.urls, start=1):
            context = get_context_from_url_service(url)
            if context:
                response.context += f'{index}] => ' 
                response.context += context
                response.context += '\n\n'    
        if response.context:
            return response
        raise HTTPException(status_code=404, detail=f"Could not extract context from any provided URLs.")
    elif request.sourceType == ContentType.DOCS:
        if not request.docs:
            raise HTTPException(status_code=400, detail="No documents provided for sourceType 'Docs'.")
        context = get_context_from_doc_service(request.docs)
        if context:
            response.context = context
            return response
        raise HTTPException(status_code=404, detail=f"Could not extract context from documents.")
    elif request.sourceType == ContentType.RAW_TEXT:
        if not request.rawText:
            raise HTTPException(status_code=400, detail="No raw text provided for sourceType 'Raw Text'.")
        context = get_context_from_raw_text_service(request.rawText)
        if context:
            response.context = context
            return response
        raise HTTPException(status_code=404, detail=f"Could not extract context from raw text.")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported sourceType '{request.sourceType}'.")


@router.post("/embed_context", dependencies=[Depends(get_current_user)])
def embed_context(request: EmbedContextRequest):
    print(request.context)
    chunks = chunk_text_service(request.context)
    store_result = store_embeddings_service(chunks)
    return store_result

@router.get("/query_context", dependencies=[Depends(get_current_user)])
def query_context(query: str):
    results = query_context_service(query)
    return results