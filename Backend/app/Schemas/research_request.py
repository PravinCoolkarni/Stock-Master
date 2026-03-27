import pydantic
from .document import Document
from app.Enum.content_type import ContentType

class ResearchRequest(pydantic.BaseModel):
    sourceType: ContentType
    urls: list[str]
    docs: Document
    rawText: str
