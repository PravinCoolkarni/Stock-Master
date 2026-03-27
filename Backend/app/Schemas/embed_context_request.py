import pydantic

class EmbedContextRequest(pydantic.BaseModel):
    context: str
    session_id: str