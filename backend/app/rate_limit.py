"""A minimal fixed-window rate limiter backed by the same Redis instance used for pub/sub."""

from fastapi import HTTPException

from app.services.progress_broadcaster import get_async_redis


async def enforce_rate_limit(key: str, *, limit: int, window_seconds: int) -> None:
    client = get_async_redis()
    current = await client.incr(key)
    if current == 1:
        await client.expire(key, window_seconds)
    if current > limit:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
