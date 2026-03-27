from pydantic import BaseModel, EmailStr
from app.Model.user import Role

class RegisterRequest(BaseModel):
    email:     EmailStr
    password:  str
    full_name: str | None = None

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserOut(BaseModel):
    id:             int
    email:          str
    full_name:      str | None
    picture:        str | None
    role:           Role
    is_google_user: bool

    model_config = {"from_attributes": True}