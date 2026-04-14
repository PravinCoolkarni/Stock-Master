from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 0
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 0

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = ""
    GEMINI_SYSTEM_INSTRUCTION: str = (
        "You are a market research assistant. Use the retrieved context as the primary grounding source. "
        "Use prior chat history only as supporting conversational context. If the retrieved context is insufficient, "
        "say so clearly. Do not provide responses that are outside the retrieved context or outside the current topic. "
        "If the user asks something off-topic or unsupported by the retrieved context, politely say that you can only "
        "answer based on the current research context. Give direct, concise, helpful answers."
    )

    # DB
    DATABASE_URL: str = ""
    VECTOR_DB_PATH: str = ""

    FRONTEND_GOOGLE_CALLBACK: str = ""

settings = Settings()
