from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Request, Response

from app.api.deps import CurrentUser, DbSession
from app.rate_limit import enforce_rate_limit
from app.schemas.auth import LoginRequest, UserCreate, UserRead
from app.services import auth_service
from app.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _set_auth_cookies(response: Response, *, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        ACCESS_COOKIE,
        access_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        # Scoped to /auth so it's only ever sent to the refresh/logout endpoints that need it.
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/auth",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/auth")


@router.post("/register", response_model=UserRead, status_code=201)
async def register(payload: UserCreate, db: DbSession):
    try:
        return await auth_service.register_user(db, email=payload.email, password=payload.password)
    except auth_service.EmailAlreadyRegisteredError:
        raise HTTPException(status_code=409, detail="Email already registered") from None


@router.post("/login", response_model=UserRead)
async def login(payload: LoginRequest, db: DbSession, response: Response, request: Request):
    await enforce_rate_limit(
        f"rate_limit:login:{payload.email}:{request.client.host if request.client else 'unknown'}",
        limit=5,
        window_seconds=60,
    )
    try:
        user = await auth_service.authenticate(db, email=payload.email, password=payload.password)
    except auth_service.InvalidCredentialsError:
        raise HTTPException(status_code=401, detail="Invalid email or password") from None
    access_token, refresh_token = await auth_service.issue_tokens(db, user)
    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
    return user


@router.post("/refresh", response_model=UserRead)
async def refresh(
    db: DbSession,
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
):
    if refresh_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user, access_token, new_refresh_token = await auth_service.rotate_refresh_token(
            db, refresh_token
        )
    except auth_service.InvalidRefreshTokenError:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Not authenticated") from None
    _set_auth_cookies(response, access_token=access_token, refresh_token=new_refresh_token)
    return user


@router.post("/logout", status_code=204)
async def logout(
    db: DbSession,
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
):
    if refresh_token is not None:
        await auth_service.revoke_refresh_token(db, refresh_token)
    _clear_auth_cookies(response)


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser):
    return current_user
