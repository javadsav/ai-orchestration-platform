"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-16

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


execution_status = postgresql.ENUM(
    "pending",
    "queued",
    "running",
    "succeeded",
    "failed",
    "retrying",
    "cancelled",
    name="execution_status",
)
step_status = postgresql.ENUM(
    "pending",
    "running",
    "succeeded",
    "failed",
    "retrying",
    "skipped",
    name="step_status",
)
log_level = postgresql.ENUM("debug", "info", "warning", "error", name="log_level")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    bind = op.get_bind()
    execution_status.create(bind, checkfirst=True)
    step_status.create(bind, checkfirst=True)
    log_level.create(bind, checkfirst=True)

    op.create_table(
        "workflows",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("stage_definitions", postgresql.JSONB(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    op.create_table(
        "executions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "workflow_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workflows.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", execution_status, nullable=False, server_default="pending"),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("input_payload", postgresql.JSONB(), nullable=True),
        sa.Column("result_payload", postgresql.JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_executions_workflow_id", "executions", ["workflow_id"])
    op.create_index("ix_executions_status", "executions", ["status"])
    op.create_index(
        "ix_executions_workflow_status_created",
        "executions",
        ["workflow_id", "status", "created_at"],
    )

    op.create_table(
        "execution_steps",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "execution_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("executions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("stage_key", sa.String(100), nullable=False),
        sa.Column("stage_order", sa.Integer(), nullable=False),
        sa.Column("status", step_status, nullable=False, server_default="pending"),
        sa.Column("attempt", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("output_payload", postgresql.JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.UniqueConstraint(
            "execution_id", "stage_key", "attempt", name="uq_execution_step_attempt"
        ),
    )
    op.create_index("ix_execution_steps_execution_id", "execution_steps", ["execution_id"])
    op.create_index(
        "ix_execution_steps_execution_order", "execution_steps", ["execution_id", "stage_order"]
    )

    op.create_table(
        "execution_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "execution_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("executions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "execution_step_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("execution_steps.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("level", log_level, nullable=False, server_default="info"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_execution_logs_execution_id", "execution_logs", ["execution_id"])
    op.create_index(
        "ix_execution_logs_execution_created", "execution_logs", ["execution_id", "created_at"]
    )

    op.create_table(
        "job_queue_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "execution_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("executions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("queue_name", sa.String(100), nullable=True),
        sa.Column("worker_hostname", sa.String(255), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_job_queue_events_execution_id", "job_queue_events", ["execution_id"])
    op.create_index("ix_job_queue_events_created_at", "job_queue_events", ["created_at"])


def downgrade() -> None:
    op.drop_table("job_queue_events")
    op.drop_table("execution_logs")
    op.drop_table("execution_steps")
    op.drop_table("executions")
    op.drop_table("workflows")

    bind = op.get_bind()
    log_level.drop(bind, checkfirst=True)
    step_status.drop(bind, checkfirst=True)
    execution_status.drop(bind, checkfirst=True)
