from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.DB.database import Base

class BlockedToken(Base):
    __tablename__ = "blocked_tokens"

    id:         Mapped[int]      = mapped_column(primary_key=True)
    jti:        Mapped[str]      = mapped_column(String, unique=True, index=True)
    # store expiry so a cleanup job can prune expired rows
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    blocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )