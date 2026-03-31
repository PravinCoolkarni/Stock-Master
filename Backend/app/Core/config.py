from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = "558427169397-e04u8lmi59u38fafmsck0ic6t12d6rjg.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = "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"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # DB
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    FRONTEND_GOOGLE_CALLBACK: str = "http://localhost:4200/auth/google/callback"

    class Config:
        model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
