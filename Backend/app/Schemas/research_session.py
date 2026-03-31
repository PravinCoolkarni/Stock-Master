from datetime import datetime

import pydantic

from app.Model.research_message import MessageRole


class ResearchSessionSummary(pydantic.BaseModel):
    id: str
    title: str
    source_type: str
    source_summary: str
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResearchMessageOut(pydantic.BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ResearchSessionDetail(pydantic.BaseModel):
    session: ResearchSessionSummary
    messages: list[ResearchMessageOut]


class ResearchSessionSeedResponse(pydantic.BaseModel):
    session: ResearchSessionSummary


class ResearchQuestionCreate(pydantic.BaseModel):
    content: str = pydantic.Field(min_length=2)
