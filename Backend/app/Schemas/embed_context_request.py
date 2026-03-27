import pydantic

class EmbedContextRequest(pydantic.BaseModel):
    context: str