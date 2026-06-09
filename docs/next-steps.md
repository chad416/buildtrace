# BuildTrace Next Steps

## Current position

Phase 0 is complete.

Phase 1 has started, but Phase 1 is not complete.

Current full beta roadmap completion remains 5%.

Practical Phase 1 progress is approximately 60-65%.

Latest completed Phase 1 implementation chunk:

- translated application page-shell skeletons

Latest relevant commits:

- `951e43e feat(web): add multilingual language switcher`
- `3997c99 feat(web): add translated app shell foundation`
- `91166dd feat(web): add translated page shell skeletons`

## Immediate next documentation step

Finish and commit the documentation update for the completed page-shell skeleton chunk.

Affected docs:

- docs/project-state.md
- docs/phase-log.md
- docs/i18n.md
- docs/next-steps.md

This docs update should record:

- latest feature commit `91166dd`
- practical Phase 1 progress around 60-65%
- new translated page-shell skeletons
- new route-based navigation
- new `PageShell` component
- updated i18n `pages` message structure
- remaining Phase 1 scope

## Immediate next implementation chunk

Continue Phase 1 with a controlled industrial UI polish slice.

Recommended next implementation chunk:

- industrial UI polish for existing shell pages

This should include only:

- stronger dashboard placeholder structure
- stronger login page visual shell
- stronger settings placeholder sections
- active/current navigation indication
- mobile/layout refinement if needed
- translated labels and empty states from existing or new translation keys

Do not include:

- real auth
- Supabase Auth
- dashboard data
- database
- storage
- QR portal
- tickets backend
- CRUD
- document upload
- customer data
- deployment

## Existing Phase 1 shell pages

Already created placeholder routes:

- `/[locale]/login`
- `/[locale]/dashboard`
- `/[locale]/machines`
- `/[locale]/documents`
- `/[locale]/tickets`
- `/[locale]/spare-parts`
- `/[locale]/feedback`
- `/[locale]/settings`

These are placeholder page shells only.

They do not contain real data flows.

## Required workflow for next implementation chunk

Use manual-review workflow unless explicitly approved otherwise:

1. Generate proposed code only.
2. Review the code before applying.
3. Apply approved code manually in VS Code.
4. Save files with Prettier formatting in VS Code when available.
5. Run gates in PowerShell.
6. Inspect changed files.
7. Commit only after clean verification.

Do not let an agent directly edit the codebase unless that is explicitly approved for that step.

## VS Code and PowerShell split

Use VS Code for:

- file editing
- file creation
- file moves
- saving files
- Prettier format-on-save where available

Use PowerShell for:

- typecheck
- lint
- build
- format verification
- Git status/diff/staging/commit/push
- targeted inspection commands when needed

Avoid using PowerShell to write or replace file contents unless there is a clear reason.

## Required quality gates before implementation commit

Run:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- `git diff --cached --check`

Also run:

- `git status --short`
- `git diff --stat`
- `git diff --name-status`
- `git diff --cached --stat`
- `git diff --cached --name-status`

Confirm no generated/cache files are staged.

## Required quality gates before documentation commit

For documentation-only commits, run:

- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`

Also run:

- `git status --short`
- `git diff --stat`
- `git diff --name-status`
- `git diff --cached --stat`
- `git diff --cached --name-status`

Confirm only intended docs are staged.

## Known quality note: next-env.d.ts

`apps/web/next-env.d.ts` is tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Current policy:

- do not commit dev-server drift in `apps/web/next-env.d.ts`
- before committing implementation work, run `pnpm.cmd build`
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
- route-based app shell navigation exists
- translated landing starter exists
- privacy/security/data-protection placeholder sections exist
- reusable `PageShell` component exists
- translated login page shell exists
- translated dashboard page shell exists
- translated machines page shell exists
- translated documents page shell exists
- translated tickets page shell exists
- translated spare-parts page shell exists
- translated feedback page shell exists
- translated settings page shell exists
- language switcher uses translation labels
- language switcher is placed in the header
- language route switching works
- all current shell/page text comes from translation keys
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
- VS Code can show stale problems from deleted, moved, or half-applied file states.
- Agent-driven edits can bypass review if not restricted.
- Phase 1 scope can expand too easily; keep each implementation chunk meaningful but controlled.
- Placeholder pages can create a false sense of product completion; real auth, data, storage, and business workflows are still not started.

## Not next

Do not start these yet:

- real authentication
- Supabase Auth
- database
- Prisma schema
- tenant isolation
- RBAC
- Supabase Storage
- document upload
- QR portal
- ticket backend
- machine CRUD
- customer CRUD
- document CRUD
- spare parts logic
- quote flow
- feedback logic
- deployment

## Next recommended baby step after docs commit

Start Phase 1 industrial polish chunk:

- active/current navigation indication
- stronger dashboard placeholder layout
- stronger login shell layout
- settings placeholder sections for user role, preferred language, future MFA, data export, and security logs

This should still remain frontend-only and translated.
