from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql+asyncpg://orchestrator:orchestrator@localhost:5432/orchestrator"
    database_url_sync: str = (
        "postgresql+psycopg://orchestrator:orchestrator@localhost:5432/orchestrator"
    )

    celery_broker_url: str = "amqp://orchestrator:orchestrator@localhost:5672//"
    celery_result_backend: str = "redis://localhost:6379/1"

    redis_url: str = "redis://localhost:6379/0"

    cors_origins: str = "http://localhost:3000"

    # --- Auth ---
    # Dev-only default; MUST be overridden with a long random value in any shared/production
    # environment (e.g. `openssl rand -hex 32`), otherwise anyone can forge access tokens.
    jwt_secret_key: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    # Requires HTTPS to actually be sent by the browser — keep False for local http:// dev,
    # set True in any environment served over TLS.
    auth_cookie_secure: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
