from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.Model.blocked_token import BlockedToken


# ── Strategy A: Database blocklist (simple, works out of the box) ─────────────

async def block_token_db(jti: str, expires_at: datetime, db: AsyncSession) -> None:
    """Add a jti to the blocked_tokens table."""
    db.add(BlockedToken(jti=jti, expires_at=expires_at))
    await db.commit()

async def is_token_blocked_db(jti: str, db: AsyncSession) -> bool:
    result = await db.execute(
        select(BlockedToken).where(BlockedToken.jti == jti)
    )
    return result.scalar_one_or_none() is not None

async def purge_expired_tokens_db(db: AsyncSession) -> None:
    """Call this periodically (cron/APScheduler) to keep the table lean."""
    await db.execute(
        delete(BlockedToken).where(BlockedToken.expires_at < datetime.now(timezone.utc))
    )
    await db.commit()


# ── Strategy B: Redis blocklist (recommended for production) ──────────────────
# pip install redis[asyncio]
#
# from redis.asyncio import Redis
# redis: Redis = Redis.from_url("redis://localhost:6379", decode_responses=True)
#
# async def block_token_redis(jti: str, expires_at: datetime) -> None:
#     ttl = int((expires_at - datetime.now(timezone.utc)).total_seconds())
#     if ttl > 0:
#         await redis.setex(f"blocked:{jti}", ttl, "1")
#         # Redis auto-deletes the key after TTL — no cleanup job needed
#
# async def is_token_blocked_redis(jti: str) -> bool:
#     return await redis.exists(f"blocked:{jti}") == 1