from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
import enum
from app.DB.database import Base

class Role(str, enum.Enum):
    admin     = "admin"
    moderator = "moderator"
    user      = "user"

class User(Base):
    __tablename__ = "users"

    id:              Mapped[int]      = mapped_column(primary_key=True)
    email:           Mapped[str]      = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str|None] = mapped_column(String, nullable=True)
    full_name:       Mapped[str|None] = mapped_column(String, nullable=True)
    picture:         Mapped[str|None] = mapped_column(String, nullable=True)
    role:            Mapped[Role]     = mapped_column(SAEnum(Role), default=Role.user)
    is_active:       Mapped[bool]     = mapped_column(Boolean, default=True)
    is_google_user:  Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at:      Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )