from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import httpx
from jose import JWTError
from urllib.parse import urlencode

from app.Core.config import settings
from app.Core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.Core.dependencies import get_current_user
from app.Core.blocklist import block_token_db
from app.DB.database import get_db
from app.Model.user import User
from app.Schemas.auth import (
    RegisterRequest, LoginRequest,
    TokenResponse, RefreshRequest, UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL      = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL     = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL  = "https://www.googleapis.com/oauth2/v3/userinfo"


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        # role defaults to Role.user — assign Role.admin manually in DB for admins
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or \
       not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id, user.role),
    )


# ── Logout (revoke current access token) ──────────────────────────────────────

@router.post("/logout", status_code=204)
async def logout(
    current_user: User = Depends(get_current_user),
    # We need the raw token to extract jti — use Request instead of the dep
    db: AsyncSession = Depends(get_db),
    credentials = Depends(__import__('fastapi.security', fromlist=['HTTPBearer']).HTTPBearer()),
):
    payload = decode_token(credentials.credentials)
    jti        = payload["jti"]
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    await block_token_db(jti, expires_at, db)
    return  # 204 No Content


# ── Refresh ────────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = int(payload["sub"])
        jti     = payload["jti"]
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Check blocklist for refresh token too
    from app.Core.blocklist import is_token_blocked_db
    if await is_token_blocked_db(jti, db):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    # Rotate: blocklist old refresh token, issue new pair
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    await block_token_db(jti, expires_at, db)

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id, user.role),
    )


# ── Google OAuth ───────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login():
    params = {
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
        "prompt":        "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback", response_model=TokenResponse)
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code":          code,
            "client_id":     settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
            "grant_type":    "authorization_code",
        })
        token_data = token_resp.json()
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data["error"])

        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        userinfo = userinfo_resp.json()

    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google did not return email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            full_name=userinfo.get("name"),
            picture=userinfo.get("picture"),
            is_google_user=True,
            # Google users default to Role.user
        )
        db.add(user)
    else:
        user.picture = userinfo.get("picture", user.picture)

    await db.commit()
    await db.refresh(user)

    app_tokens = TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id, user.role),
    )

    FRONTEND_GOOGLE_CALLBACK = settings.FRONTEND_GOOGLE_CALLBACK

    query = urlencode({
        "access_token": app_tokens.access_token,
        "refresh_token": app_tokens.refresh_token,
        "token_type": app_tokens.token_type,
    })

    return RedirectResponse(url=f"{FRONTEND_GOOGLE_CALLBACK}?{query}", status_code=302)


# ── Me ─────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user