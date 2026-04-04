import asyncio
from typing import Sequence

from google import genai
from google.genai import types
from app.Core.config import settings


def _build_prompt(query: str, chunks: Sequence[str], history: Sequence[tuple[str, str]]) -> str:
    context = "\n\n".join(f"Chunk {index + 1}:\n{chunk}" for index, chunk in enumerate(chunks))
    history_text = "\n".join(
        f"{'Assistant' if role == 'assistant' else 'User'}: {text}"
        for role, text in history
    ).strip()

    if not history_text:
        history_text = "No previous chat history."

    return (
        "Conversation history:\n"
        f"{history_text}\n\n"
        "Retrieved context for this turn:\n"
        f"{context}\n\n"
        f"User question:\n{query}\n\n"
        "Answer the user's question based on the information above."
    )


def _generate_answer_sync(query: str, chunks: Sequence[str], history: Sequence[tuple[str, str]]) -> str:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        config=types.GenerateContentConfig(
            system_instruction=settings.GEMINI_SYSTEM_INSTRUCTION,
        ),
        contents=_build_prompt(query, chunks, history),
    )
    answer = (response.text or "").strip()
    if not answer:
        raise ValueError("Gemini returned an empty response.")
    return answer


async def generate_answer(query: str, chunks: Sequence[str], history: Sequence[tuple[str, str]] | None = None) -> str:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    if not chunks:
        return "I could not find relevant context for this question in the current research session."

    return await asyncio.to_thread(_generate_answer_sync, query, chunks, history or [])
