from pydantic import BaseModel, EmailStr, field_validator
from app.Model.user import Role

BCRYPT_MAX_PASSWORD_BYTES = 72


def validate_bcrypt_password_length(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
        raise ValueError(
            f"Password is too long for bcrypt. Use at most {BCRYPT_MAX_PASSWORD_BYTES} UTF-8 bytes."
        )
    return password

class RegisterRequest(BaseModel):
    email:     EmailStr
    password:  str
    full_name: str | None = None

    _validate_password = field_validator("password")(validate_bcrypt_password_length)

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

    _validate_password = field_validator("password")(validate_bcrypt_password_length)

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
