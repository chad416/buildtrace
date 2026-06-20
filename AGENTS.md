# AGENTS.md Ã¢â‚¬â€ BuildTrace

> Instructions for any AI coding agent working in this repo.
> Read this first. The closest AGENTS.md to the file you edit wins; an explicit user prompt overrides everything here.

## Project overview

BuildTrace is a multi-tenant industrial SaaS platform for machine documentation and
service management, with an EU-first data-protection posture. Tenants manage machines,
upload and classify documents, raise service tickets, and expose a public QR portal per
machine. The product is in **Beta** (about 65% complete; Phases 0-6 done, Phase 7 next).

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

Phase 6 - Handover completeness + export is complete and closed.
Phase 5 is complete and closed.

The full beta roadmap is about 65% complete.

Completed Phase 6 pieces:

- shared completeness evaluator and export manifest builder
- shared ZIP entry builder with traversal guards
- i18n document labels and handover completeness copy for all 7 locales
- i18n handover export copy for all 7 locales, including the sensitive warning
- DB data_exports schema, migrations, and CHECK constraints
- DB export creation, revalidation, finalization, and list helpers
- API completeness, export create/list, ZIP download URL, and PDF download URL endpoints
- API sensitive-file detection
- API ZIP archive builder with fflate and SHA-256 checksum
- API localized PDF summary generator with Playwright
- private Supabase storage upload/remove/signed URLs for ZIP and PDF artifacts
- API recovery path on export failure
- web completeness and export API clients
- handover completeness widget
- export trigger and customer-visible document selection
- export history with ZIP and PDF download actions
- sensitive-file warning banner
- localized private PDF summary

## Phase 7 Next

Phase 7 - QR customer portal scope:

- QR token
- customer portal
- customer-visible documents only
- browser language detection
- language switcher
- localized portal UI
- portal access logs
- optional PIN/password
- QR token rotation option
- portal disable option

## Hard Warning For Future AI Agents

Do not reopen Phase 6 unless a real defect is found.

Do not implement AI/OCR/vector search/worker queues for Phase 5.

Do not let classification change visibility or customer exposure automatically.

Do not apply suggested category without explicit builder action.

Do not do brittle workaround edits. Re-read files and make root-cause fixes.

Never commit secrets, Supabase service-role keys, access tokens, refresh tokens, database URLs, passwords, or private keys.
