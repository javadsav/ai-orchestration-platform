"""Deterministic-ish fake work for a pipeline stage.

Each stage sleeps for a jittered duration and, at a configurable rate, raises
StageExecutionError to exercise the retry/backoff path end-to-end — this is a
showcase project, so failures need to be reproducible enough to demonstrate
the retry UI, not purely random noise.
"""

import random
import time
from typing import Any


class StageExecutionError(Exception):
    def __init__(self, stage_key: str, attempt: int):
        super().__init__(f"Simulated failure in stage '{stage_key}' (attempt {attempt})")
        self.stage_key = stage_key
        self.attempt = attempt


def simulate(
    stage_key: str,
    *,
    attempt: int,
    failure_rate: float = 0.0,
    min_duration_ms: int = 300,
    max_duration_ms: int = 1200,
) -> dict[str, Any]:
    duration_s = random.uniform(min_duration_ms, max_duration_ms) / 1000
    time.sleep(duration_s)

    # Failure odds drop on retries so an execution isn't stuck failing forever.
    effective_rate = failure_rate / attempt
    if random.random() < effective_rate:
        raise StageExecutionError(stage_key, attempt)

    return {
        "stage": stage_key,
        "duration_ms": round(duration_s * 1000),
        "attempt": attempt,
    }
