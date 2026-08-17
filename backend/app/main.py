from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import executions, health, queue, workflows, ws
from app.logging_config import configure_logging
from app.settings import settings


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(title="AI Orchestration Platform API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(workflows.router)
    app.include_router(executions.router)
    app.include_router(queue.router)
    app.include_router(ws.router)

    return app


app = create_app()
