# AGENTS.md Ã¢â‚¬â€ BuildTrace

> Instructions for any AI coding agent working in this repo.
> Read this first. The closest AGENTS.md to the file you edit wins; an explicit user prompt overrides everything here.

## Project overview

BuildTrace is a multi-tenant industrial SaaS platform for machine documentation and
service management, with an EU-first data-protection posture. Tenants manage machines,
upload and classify documents, raise service tickets, and expose a public QR portal per
machine. The product is in **Beta** (about 55% complete; Phases 0-5 done, Phase 6 in progress).

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** Next.js (App Router), `next-intl` i18n, Tailwind CSS, Zod
- **API:** NestJS
- **Worker:** background job processor (`apps/worker`)
- **DB:** Prisma + PostgreSQL on Supabase, multi-tenant with Row-Level Security (RLS)
- **Auth:** Supabase auth. Anon key in web Ã¢â€ â€™ JWT sent to NestJS Ã¢â€ â€™ **service-role key only in `apps/api`**, never in web
- **Tests:** Jest + per-package smoke scripts (e.g. `document-records:smoke`)
- **OS:** developed on Windows / PowerShell Ã¢â‚¬â€ package commands use `pnpm.cmd` locally, `pnpm` in CI/Unix

## Layout

```
apps/
  web/        Next.js front end (next-intl, Tailwind)
  api/        NestJS API (holds service-role key)
  worker/     background jobs
packages/
  db/         Prisma schema, migrations, RLS policies, tenant scoping
  shared/     shared types / utilities
  i18n/        translation messages and locale config
  ui/         shared UI components
docs/         project docs (do not edit unless asked)
```

Workspace package names: `@buildtrace/web`, `@buildtrace/api`, `@buildtrace/worker`,
`@buildtrace/db`, `@buildtrace/shared`, `@buildtrace/i18n`, `@buildtrace/ui`.

## Locales

`en` (default), `cs`, `sk`, `pl`, `de`, `fr`, `es`.
All user-facing text comes from translation keys. **No hardcoded visible UI strings.**

## Commands (verification gates)

Run these after any change and before declaring work done. On Windows use `pnpm.cmd`.

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm format:check     # if it fails: run `pnpm format`, then re-run all gates
pnpm dev:preflight    # combined pre-dev check
```

Targeted per-package (faster while iterating):

```bash
pnpm --filter @buildtrace/web typecheck
pnpm --filter @buildtrace/web run document-records:smoke
pnpm --filter @buildtrace/api run document-records:smoke
git diff --check      # catch whitespace / conflict markers
```

## Conventions

- Strict TypeScript. No `any` escape hatches to make types pass.
- Make the **smallest correct change** for the task. No drive-by refactors.
- **Root-cause fixes, not workarounds.** Do not patch files with brittle regex/text-anchor
  surgery Ã¢â‚¬â€ edit the actual source cleanly. If an edit doesn't apply, re-read the file and
  fix the real cause.
- Tenant isolation is non-negotiable: every data path must respect RLS / tenant scoping.
- Use translation keys for all user-facing copy.
- Keep changes scoped to the current phase; do not jump ahead into future work.

## Do not touch / do not add (unless the task explicitly says so)

- The Supabase **service-role key** anywhere outside `apps/api`.
- Auth, RLS, or tenant-scoping logic as a side effect of an unrelated task.
- `packages/db` schema or migrations without an explicit migration task.
- `docs/**`, generated files, build caches, `node_modules`.
- New heavy deps (e.g. `shadcn/ui`, `lucide-react`) unless the task asks for them.
- Do not commit or push unless explicitly told to.

## Definition of done

1. Files changed (list them)
2. Commands run
3. Gate results (typecheck / lint / build / format:check)
4. Any warnings or errors and how they were handled
5. Confirmation that no out-of-scope work (auth/db/storage/tenant/etc.) was added

## Phase 6 Current State

Phase 6 - Handover completeness + export is active.
Phase 5 is complete and closed.

As of the last verified commit, Phase 6 is approximately 65% complete.

Completed Phase 6 pieces:

- shared completeness evaluator (`packages/shared/src/customer-handover.ts`)
- shared export manifest builder (`packages/shared/src/customer-handover-export.ts`)
- shared ZIP entry builder (`packages/shared/src/customer-handover-zip.ts`)
- centralized i18n document labels for all 7 locales (`packages/i18n/src/document-labels.ts`)
- centralized i18n handover completeness copy for all 7 locales (`packages/i18n/src/handover-completeness-copy.ts`)
- DB data_exports schema, migrations, and CHECK constraints
- DB export creation, revalidation, finalization, and schema drift/isolation checks
- API handover completeness endpoint: GET /document-records/machines/:machineId/handover-completeness
- API export create endpoint: POST /document-records/machines/:machineId/customer-handover-exports
- API export download-url endpoint: POST /document-records/machines/:machineId/customer-handover-exports/:exportId/download-url
- API ZIP archive builder with deterministic checksum (apps/api/src/customer-handover-zip-archive.ts)
- API export storage upload/remove/signed-url via Supabase (apps/api/src/customer-handover-export-storage.ts)
- API recovery path (mark failed + remove orphaned artifact on export error)
- web handover completeness API client (apps/web/src/handover-completeness-api.ts)
- handover completeness widget rendered in machine detail page
- smoke checks for completeness controller, completeness API client, ZIP archive, and export controller

Still required before Phase 6 can be closed:

1. Web export API client (apps/web/src/customer-handover-export-api.ts) — Slice B
2. Export trigger UI + server action in machine detail — Slice C
3. Export history list endpoint (API GET) + web client function — Slice D
4. Sensitive-file inclusion warning in export API response — Slice E
5. Localized PDF summary (Playwright HTML-to-PDF) — Slice F
6. Browser verification of completeness widget, full export flow, and PDF download — Slice G
7. Phase 6 docs closeout (PROGRESS_1.md, AGENTS.md, phase-log.md, roadmap.md) — Slice G

## Hard Warning For Future AI Agents

Do not reopen Phase 5 unless a real defect is found.

Do not implement AI/OCR/vector search/worker queues for Phase 5.

Do not let classification change visibility or customer exposure automatically.

Do not apply suggested category without explicit builder action.

Do not do brittle workaround edits. Re-read files and make root-cause fixes.

Never commit secrets, Supabase service-role keys, access tokens, refresh tokens, database URLs, passwords, or private keys.
