## What

<!-- One or two sentences: what does this change do? -->

## Why

<!-- Link the issue this closes, or explain the motivation if there isn't one. -->

Closes #

## How to verify

<!-- Steps to check this locally, if not obvious from CI. -->

## Checklist

- [ ] `ruff check .` / `black --check .` / `mypy app` pass locally (backend changes)
- [ ] `npm run lint` / `npx tsc --noEmit` pass locally (frontend changes)
- [ ] Tests added or updated for the behavior change
- [ ] Docs updated if behavior or setup changed
