"""Redis pub/sub glue connecting Celery worker progress events to FastAPI WebSocket clients.

Postgres remains the durable source of truth for every stage transition; Redis pub/sub is
purely the low-latency delta transport used to push updates to already-connected clients.
"""

import json
import uuid
from collections.abc import AsyncIterator

import redis as redis_sync
import redis.asyncio as redis_async

from app.settings import settings

_async_redis: redis_async.Redis | None = None
_sync_redis: redis_sync.Redis | None = None


def channel_name(execution_id: uuid.UUID | str) -> str:
    return f"execution:{execution_id}"


def get_async_redis() -> redis_async.Redis:
    global _async_redis
    if _async_redis is None:
        _async_redis = redis_async.from_url(settings.redis_url, decode_responses=True)
    return _async_redis


def get_sync_redis() -> redis_sync.Redis:
    """Used by the Celery worker process (sync execution model)."""
    global _sync_redis
    if _sync_redis is None:
        _sync_redis = redis_sync.from_url(settings.redis_url, decode_responses=True)
    return _sync_redis


def publish_event(execution_id: uuid.UUID | str, event: dict) -> None:
    client = get_sync_redis()
    client.publish(channel_name(execution_id), json.dumps(event, default=str))


async def subscribe(execution_id: uuid.UUID | str) -> AsyncIterator[dict]:
    client = get_async_redis()
    pubsub = client.pubsub()
    await pubsub.subscribe(channel_name(execution_id))
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            yield json.loads(message["data"])
    finally:
        await pubsub.unsubscribe(channel_name(execution_id))
        await pubsub.aclose()
