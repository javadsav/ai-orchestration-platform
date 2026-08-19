# Contributing

This is currently a single-maintainer project, but it follows a PR-based
workflow rather than pushing directly to `main`.

## Workflow

1. Branch off `main`.
2. Open a pull request. Every PR must pass CI before it can merge:
   - `backend-lint` — ruff, black, mypy
   - `backend-test` — pytest against real Postgres/RabbitMQ/Redis
   - `frontend-lint-typecheck` — eslint, `tsc --noEmit`
   - `frontend-test` — vitest
3. `main` is protected: no direct pushes, no force-pushes, no branch
   deletion, and the rule applies to everyone including admins — there is
   no bypass, even for the maintainer. Approving reviews are not required
   (single maintainer), but the PR and green CI are mandatory.
4. Merge once CI is green.

## Local checks

Run the same checks CI runs before opening a PR:

```bash
# backend
cd backend
ruff check .
black --check .
mypy app
pytest

# frontend
cd frontend
npm run lint
npx tsc --noEmit
npm run test -- --run
```

## Issues

Issues are grouped into milestones tracking the project roadmap. Use the
bug report or feature request template when opening one.
