import pydantic
from app.Enum.content_type import ContentType

class ResearchResponse(pydantic.BaseModel):
    sourceType: ContentType
    context: str