import pydantic 


class Document(pydantic.BaseModel):
    docName: str
    docData: str 
    docType: str