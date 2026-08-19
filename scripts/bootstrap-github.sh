#!/usr/bin/env bash
# One-time GitHub repo bootstrap: labels, milestones, issues, branch protection.
#
# Run this from a machine with the GitHub CLI installed and authenticated
# against this repo. It is idempotent-ish (labels use --force, milestone/issue
# creation may print a harmless warning if re-run), but it's meant to be run
# once against a fresh repo.
#
# Install gh:
#   Windows:  winget install --id GitHub.cli
#   macOS:    brew install gh
#   Linux:    https://github.com/cli/cli/blob/trunk/docs/install_linux.md
# Then:
#   gh auth login
#
# Usage:
#   ./scripts/bootstrap-github.sh

set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Bootstrapping $REPO"

# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------
echo "Creating labels..."

# "name:color" pairs — plain array instead of an associative array so this
# also runs under bash 3.2 (the default on macOS).
LABELS=(
  "type:feature:1f77b4"
  "type:bug:d73a4a"
  "type:chore:8899a6"
  "type:docs:0e8a16"
  "type:ci:5319e7"
  "type:testing:0052cc"
  "area:api:c2e0c6"
  "area:db:c2e0c6"
  "area:queue:fbca04"
  "area:redis:fbca04"
  "area:realtime:fbca04"
  "area:frontend:bfd4f2"
  "area:testing:bfd4f2"
  "area:auth:d93f0b"
  "area:observability:d93f0b"
  "area:infra:e99695"
  "area:cicd:e99695"
  "area:architecture:5319e7"
)

for entry in "${LABELS[@]}"; do
  color="${entry##*:}"
  name="${entry%:*}"
  gh label create "$name" --color "$color" --repo "$REPO" --force
done

# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------
echo "Creating milestones..."

MILESTONES=(
  "M1 — API & Data Layer"
  "M2 — Queue & Real-Time Reliability"
  "M3 — Auth & Security"
  "M4 — Observability & Ops"
  "M5 — Frontend Experience & Testing"
  "M6 — Containerization & Delivery"
)

for m in "${MILESTONES[@]}"; do
  gh api "repos/$REPO/milestones" -f title="$m" >/dev/null 2>&1 \
    || echo "  (milestone '$m' may already exist, skipping)"
done

# ---------------------------------------------------------------------------
# Issues
# ---------------------------------------------------------------------------
echo "Creating issues..."

issue() {
  local title="$1" body="$2" milestone="$3"; shift 3
  local label_args=()
  for l in "$@"; do label_args+=(--label "$l"); done
  gh issue create --repo "$REPO" --title "$title" --body "$body" \
    --milestone "$milestone" "${label_args[@]}" >/dev/null
  echo "  + $title"
}

M1="M1 — API & Data Layer"
issue "Add structured problem-details error responses" \
  "Return RFC 7807-style error bodies from a global exception handler instead of ad-hoc error shapes." \
  "$M1" type:feature area:api
issue "Add request-ID middleware correlated into logs" \
  "Generate/propagate a request ID per HTTP request and thread it into structured log lines." \
  "$M1" type:feature area:api
issue "Add PATCH/DELETE endpoints for workflows" \
  "Workflows currently only support create/list/get. Add update and delete endpoints." \
  "$M1" type:feature area:api
issue "Add cursor-based pagination to list endpoints" \
  "Replace offset pagination with a cursor-based scheme for the executions/workflows list endpoints." \
  "$M1" type:feature area:api
issue "Add GIN index and filtered query on stage_definitions JSONB" \
  "Index the JSONB column and add a repository method that filters workflows by a stage key/value." \
  "$M1" type:feature area:db
issue "Partition execution_logs by time" \
  "Explore range partitioning execution_logs to keep the hot table small as log volume grows." \
  "$M1" type:chore area:db
issue "Add a migration exercising upgrade and downgrade in CI" \
  "Add a CI step that runs 'alembic upgrade head', 'alembic downgrade -1', then upgrade again to catch broken downgrades." \
  "$M1" type:ci area:db
issue "Evaluate pgvector for a future embeddings table" \
  "Spike: add the pgvector extension and a throwaway table to confirm the migration/tooling story works end to end." \
  "$M1" type:chore area:db

M2="M2 — Queue & Real-Time Reliability"
issue "Implement execution cancellation" \
  "Add an endpoint that revokes the Celery task and marks the execution 'cancelled' — the status enum already has this value but nothing sets it." \
  "$M2" type:feature area:queue
issue "Add scheduled workflow runs via Celery Beat" \
  "Support a cron-like trigger on a workflow that enqueues an execution automatically." \
  "$M2" type:feature area:queue
issue "Add dead-letter handling for exhausted retries" \
  "When a task exhausts its retry budget, route it to a dead-letter queue/table instead of silently marking it failed." \
  "$M2" type:feature area:queue
issue "Add Flower dashboard to docker-compose" \
  "Wire up Flower as a compose service for visual Celery task/worker monitoring." \
  "$M2" type:chore area:queue
issue "Migrate progress pub/sub to Redis Streams" \
  "Swap the ephemeral pub/sub channel for a Stream so a client reconnecting after a drop can replay missed events." \
  "$M2" type:feature area:redis
issue "Add Redis-backed idempotency key on execution trigger" \
  "Prevent duplicate executions from a retried/double-submitted trigger request using a short-lived Redis key." \
  "$M2" type:feature area:redis
issue "Add cached workflow listing with explicit invalidation" \
  "Cache the workflow list response in Redis and invalidate it on create/update/delete." \
  "$M2" type:feature area:redis
issue "Add last-event-id resume support to the WebSocket endpoint" \
  "Let a reconnecting client pass the last event id it saw and receive only what it missed." \
  "$M2" type:feature area:realtime
issue "Load test concurrent WebSocket clients across replicas" \
  "Scale the backend to N replicas and confirm Redis pub/sub fanout delivers live progress to all connected clients." \
  "$M2" type:testing area:realtime

M3="M3 — Auth & Security"
issue "Add JWT authentication to the API" \
  "Introduce a minimal user/credential model and require a bearer token on mutating routes." \
  "$M3" type:feature area:auth
issue "Require auth on the WebSocket handshake" \
  "Validate the same JWT on WS connect instead of leaving the socket open to anyone." \
  "$M3" type:feature area:auth
issue "Add a viewer/operator role model" \
  "Distinguish read-only viewers from operators who can trigger/cancel executions." \
  "$M3" type:feature area:auth
issue "Move secrets out of plain env vars" \
  "Use Docker secrets (or a lightweight secrets manager) instead of plaintext values in .env for anything credential-shaped." \
  "$M3" type:chore area:auth

M4="M4 — Observability & Ops"
issue "Add structured, correlated logging across services" \
  "Ensure backend, worker, and frontend logs share a common format and correlation id." \
  "$M4" type:feature area:observability
issue "Add an OpenTelemetry trace spanning API to Celery to DB" \
  "Instrument one full request path so a single trace shows the HTTP call, the Celery task, and the DB write it triggers." \
  "$M4" type:feature area:observability
issue "Add a /metrics endpoint and Grafana dashboard" \
  "Expose Prometheus metrics for queue depth and execution latency, and build a small Grafana dashboard on top." \
  "$M4" type:feature area:observability

M5="M5 — Frontend Experience & Testing"
issue "Add client-side caching and optimistic updates" \
  "Introduce React Query (or SWR) for the executions/workflows views and optimistically update the UI on trigger." \
  "$M5" type:feature area:frontend
issue "Build a visual workflow stage-definition builder" \
  "Replace hand-written JSON stage definitions with a form-based builder in the UI." \
  "$M5" type:feature area:frontend
issue "Add a Playwright e2e suite" \
  "Cover the full path: create a workflow, trigger an execution, watch live progress, see completion." \
  "$M5" type:testing area:testing
issue "Add a Locust load-test script for the execution queue" \
  "Script a burst of concurrent execution triggers and observe queue/worker behavior under load." \
  "$M5" type:testing area:testing
issue "Add frontend component tests" \
  "Cover the key presentational components (execution detail view, queue status) with component-level tests." \
  "$M5" type:testing area:frontend

M6="M6 — Containerization & Delivery"
issue "Convert Dockerfiles to multi-stage builds" \
  "Shrink the backend/frontend/worker images by separating build and runtime stages." \
  "$M6" type:chore area:infra
issue "Run containers as non-root" \
  "Add a dedicated non-root user in each Dockerfile instead of running as root." \
  "$M6" type:chore area:infra
issue "Add a docker-compose.prod.yml overlay" \
  "Provide a production-shaped compose file without dev bind mounts and with resource limits." \
  "$M6" type:feature area:infra
issue "Add image build and push to CI" \
  "Build and push backend/frontend/worker images to a registry on merge to main." \
  "$M6" type:ci area:cicd
issue "Add automated deploy on merge to main" \
  "Deploy the compose stack to a small VM or a platform like Fly.io/Railway as part of the pipeline." \
  "$M6" type:ci area:cicd
issue "Write ARCHITECTURE.md" \
  "Document the execution state machine, the retry/resume design, and the key trade-offs made so far." \
  "$M6" type:docs area:architecture
issue "Diagram the execution state machine" \
  "Produce a diagram of execution/step status transitions and link it from ARCHITECTURE.md." \
  "$M6" type:docs area:architecture
issue "Add 'replay execution from event log' feature" \
  "Use job_queue_events as a real event log to reconstruct/replay a past execution." \
  "$M6" type:feature area:architecture

echo "Labels, milestones, and issues created."

# ---------------------------------------------------------------------------
# Branch protection (Ruleset — applies to everyone, including admins)
# ---------------------------------------------------------------------------
echo "Applying branch protection ruleset to main..."

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPO/rulesets" \
  --input - <<'JSON'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["refs/heads/main"], "exclude": [] }
  },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "backend-lint" },
          { "context": "backend-test" },
          { "context": "frontend-lint-typecheck" },
          { "context": "frontend-test" }
        ]
      }
    }
  ]
}
JSON

echo "Done. main now requires a PR with all 4 CI jobs green; no bypass for anyone, including admins."
