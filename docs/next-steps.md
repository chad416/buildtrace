# BuildTrace Next Steps

## Current position

Phase 0 is complete.

Phase 1 has started, but Phase 1 is not complete.

Current full beta roadmap completion remains 5%.

Latest completed Phase 1 implementation chunk:

- translated app shell/header/footer foundation

Latest relevant commits:

- `951e43e feat(web): add multilingual language switcher`
- `3997c99 feat(web): add translated app shell foundation`

## Immediate next implementation chunk

Continue Phase 1 with the next meaningful UI shell slice.

Recommended next implementation chunk:

- translated application page-shell skeletons

This should include only:

- route/page placeholders for key beta areas
- translated page titles and descriptions
- empty-state placeholders from translation keys
- shell navigation updated to point to the new placeholder routes if needed
- no real auth
- no dashboard data
- no database
- no storage
- no QR portal
- no tickets backend
- no CRUD

Possible placeholder pages:

- login
- dashboard
- machines
- documents
- tickets
- spare parts
- feedback
- settings

## Required workflow for next implementation chunk

Use manual-review workflow unless explicitly approved otherwise:

1. Generate proposed code only.
2. Review the code before applying.
3. Apply approved code manually in VS Code.
4. Run gates in PowerShell.
5. Inspect changed files.
6. Commit only after clean verification.

Do not let an agent directly edit the codebase unless that is explicitly approved for that step.

## Required quality gates before commit

Run:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`

Also run:

- `git status --short`

Confirm no generated/cache files are staged.

## Known quality note: next-env.d.ts

`apps/web/next-env.d.ts` is tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Current policy:

- do not commit dev-server drift in `apps/web/next-env.d.ts`
- before committing, run `pnpm.cmd build`
- verify `git status --short` does not show `apps/web/next-env.d.ts`

## Documentation update rule

After every stable meaningful implementation chunk, update only the affected docs.

For documentation updates:

- batch related docs together
- edit files in VS Code
- format in VS Code when Prettier is available
- use PowerShell only for verification and Git operations
- commit docs together, not one tiny docs commit per file

For verification, run:

- `pnpm.cmd format:check`
- `git diff --check`
- `git status --short`

## Prerequisites already completed

- web app builds
- API builds
- worker builds
- web locale routes exist
- root route redirects to `/en`
- language switcher foundation exists
- translated app shell exists
- translated header exists
- translated footer exists
- translated landing starter exists
- privacy/security/data-protection placeholder sections exist
- language switcher uses translation labels
- language switcher is placed in the header
- language route switching works
- API `/health` responds
- worker placeholder runs
- security docs exist
- data-protection docs exist
- data-classification docs exist
- i18n docs exist
- roadmap/project-state/phase-log/decisions/next-steps docs exist

## Risks

- PowerShell treats `[locale]` as a pattern unless `-LiteralPath` is used.
- Manual Markdown replacement may fail Prettier formatting until Prettier formats the file.
- `next dev` may temporarily modify `apps/web/next-env.d.ts`.
- VS Code can show stale problems from deleted or moved file tabs.
- Agent-driven edits can bypass review if not restricted.
- Phase 1 scope can expand too easily; keep each implementation chunk meaningful but controlled.

## Not next

Do not start these yet:

- real authentication
- database
- Supabase
- storage
- QR portal
- ticket backend
- machine CRUD
- document upload
- spare parts
- quote flow
- feedback logic
- deployment
