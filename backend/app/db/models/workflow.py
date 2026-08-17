from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.execution import Execution


class Workflow(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A reusable, ordered pipeline definition (e.g. preprocessing -> ... -> post-processing)."""

    __tablename__ = "workflows"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Ordered list of stages: [{"key": "preprocessing", "label": "Preprocessing",
    # "failure_rate": 0.1, ...}]
    stage_definitions: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    executions: Mapped[list["Execution"]] = relationship(
        back_populates="workflow", cascade="all, delete-orphan"
    )

    __mapper_args__ = {"eager_defaults": True}

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Workflow id={self.id} name={self.name!r}>"
