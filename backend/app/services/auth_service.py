from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.repositories import refresh_token_repo, user_repo
from app.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass


async def register_user(db: AsyncSession, *, email: str, password: str) -> User:
    if await user_repo.get_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(email)
    return await user_repo.create_user(db, email=email, hashed_password=hash_password(password))


async def authenticate(db: AsyncSession, *, email: str, password: str) -> User:
    user = await user_repo.get_by_email(db, email)
    if user is None or not user.is_active or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError()
    return user


async def issue_tokens(db: AsyncSession, user: User) -> tuple[str, str]:
    """Returns (access_token, raw_refresh_token)."""
    access_token = create_access_token(user.id)
    raw_refresh_token, token_hash, expires_at = generate_refresh_token()
    await refresh_token_repo.create(
        db, user_id=user.id, token_hash=token_hash, expires_at=expires_at
    )
    return access_token, raw_refresh_token


async def rotate_refresh_token(db: AsyncSession, raw_refresh_token: str) -> tuple[User, str, str]:
    """Validates + revokes the given refresh token and issues a fresh pair.

    Rotation means a stolen-and-replayed refresh token becomes unusable as soon as its
    legitimate owner uses theirs, which at least bounds the damage of a leaked cookie.
    """
    stored = await refresh_token_repo.get_valid_by_hash(db, hash_refresh_token(raw_refresh_token))
    if stored is None:
        raise InvalidRefreshTokenError()
    user = await user_repo.get_user(db, stored.user_id)
    if user is None or not user.is_active:
        raise InvalidRefreshTokenError()
    await refresh_token_repo.revoke(db, stored)
    access_token, new_raw_refresh_token = await issue_tokens(db, user)
    return user, access_token, new_raw_refresh_token


async def revoke_refresh_token(db: AsyncSession, raw_refresh_token: str) -> None:
    stored = await refresh_token_repo.get_valid_by_hash(db, hash_refresh_token(raw_refresh_token))
    if stored is not None:
        await refresh_token_repo.revoke(db, stored)
