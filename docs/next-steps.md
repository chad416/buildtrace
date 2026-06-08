# BuildTrace Next Steps

## Current position

Phase 0 is complete.

Phase 1 has started, but Phase 1 is not complete.

Current full beta roadmap completion remains 5%.

Latest completed Phase 1 baby step:

- multilingual language switcher foundation

Latest relevant commits:

- `951e43e feat(web): add multilingual language switcher`
- `8071f60 docs: update project state after language switcher step`
- `56798b0 docs: format project state`
- `b3f55d4 docs: update phase log for language switcher step`
- `6a38f8d docs: update i18n notes for language switcher step`

## Immediate next baby step

Continue Phase 1 with the next small UI foundation step.

Recommended next implementation step:

- create a translated app shell/header foundation

This should include only:

- basic header structure
- translated product name area
- placeholder navigation labels from translation keys
- language switcher placement in the header
- no real auth
- no dashboard data
- no database
- no storage
- no QR portal
- no tickets
- no CRUD

## Required workflow for next implementation step

Use manual-review workflow unless explicitly approved otherwise:

1. Generate proposed code only.
2. Review the code before applying.
3. Paste approved code manually in VS Code.
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

After every stable baby step, update only the affected docs.

Likely docs for the next app-shell step:

- `docs/project-state.md`
- `docs/phase-log.md`
- `docs/i18n.md`
- `docs/next-steps.md`

Run Prettier immediately after manual doc edits:

- `pnpm.cmd exec prettier --write <changed-doc-file>`

Then run:

- `pnpm.cmd format:check`

## Prerequisites already completed

- web app builds
- API builds
- worker builds
- web locale routes exist
- root route redirects to `/en`
- language switcher foundation exists
- language switcher uses translation labels
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
- Manual Markdown replacement may fail Prettier formatting until `prettier --write` is run.
- `next dev` may temporarily modify `apps/web/next-env.d.ts`.
- Agent-driven edits can bypass review if not restricted.
- Phase 1 scope can expand too easily; keep each step small.

## Not next

Do not start these yet:

- authentication
- database
- Supabase
- storage
- QR portal
- ticket backend
- machine CRUD
- document upload
- spare parts
- quote flow
- feedback
- deployment
