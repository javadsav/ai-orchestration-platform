"""Creates a demo workflow so the UI has something to show on first boot.

Run with: python scripts/seed.py (inside the backend container/venv).
"""

import asyncio

from app.db.session import AsyncSessionLocal
from app.repositories import workflow_repo

DEMO_STAGES = [
    {
        "key": "preprocessing",
        "label": "Preprocessing",
        "order": 0,
        "failure_rate": 0.05,
        "min_duration_ms": 300,
        "max_duration_ms": 900,
    },
    {
        "key": "feature_extraction",
        "label": "Feature Extraction",
        "order": 1,
        "failure_rate": 0.1,
        "min_duration_ms": 500,
        "max_duration_ms": 1500,
    },
    {
        "key": "ai_analysis",
        "label": "AI Analysis",
        "order": 2,
        "failure_rate": 0.2,
        "min_duration_ms": 1000,
        "max_duration_ms": 2500,
    },
    {
        "key": "result_generation",
        "label": "Result Generation",
        "order": 3,
        "failure_rate": 0.05,
        "min_duration_ms": 300,
        "max_duration_ms": 800,
    },
    {
        "key": "post_processing",
        "label": "Post-processing",
        "order": 4,
        "failure_rate": 0.02,
        "min_duration_ms": 200,
        "max_duration_ms": 600,
    },
]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        existing, _ = await workflow_repo.list_workflows(db, limit=1, offset=0)
        if existing:
            print(f"Workflow already seeded: {existing[0].id} ({existing[0].name})")
            return

        workflow = await workflow_repo.create_workflow(
            db,
            name="Document Intelligence Pipeline",
            description=(
                "Simulated multi-stage AI pipeline: preprocessing, feature extraction, "
                "AI analysis, result generation, and post-processing."
            ),
            stage_definitions=DEMO_STAGES,
        )
        await db.commit()
        print(f"Seeded workflow: {workflow.id} ({workflow.name})")


if __name__ == "__main__":
    asyncio.run(main())
