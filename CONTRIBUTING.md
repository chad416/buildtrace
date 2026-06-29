# Contributing to BuildTrace

BuildTrace is a multi-tenant industrial SaaS beta. Keep changes narrow, preserve tenant and storage boundaries, and avoid claiming controls or features that the repository does not implement.

## Prerequisites

- Node.js 22 or newer
- pnpm 10.12.4 or newer
- PostgreSQL (the intended development setup is Supabase)
- A private Supabase Storage bucket

On Windows PowerShell, invoke pnpm through `pnpm.cmd`. On Unix-like systems and in CI, use `pnpm`.

## Workspace setup

```powershell
pnpm.cmd install
Copy-Item .env.example .env
pnpm.cmd --filter @buildtrace/db exec prisma migrate deploy
pnpm.cmd --filter @buildtrace/db run dev:bootstrap
pnpm.cmd dev:preflight
```

Populate `.env` before running migrations or preflight. The service-role key is server-side only and must never be placed in browser code or a `NEXT_PUBLIC_*` variable.

The workspace package names are:

- `@buildtrace/web`
- `@buildtrace/api`
- `@buildtrace/worker`
- `@buildtrace/db`
- `@buildtrace/shared`
- `@buildtrace/i18n`
- `@buildtrace/ui`

## Development commands

```powershell
pnpm.cmd dev
pnpm.cmd --filter @buildtrace/web dev
pnpm.cmd --filter @buildtrace/api dev
pnpm.cmd --filter @buildtrace/worker dev
```

Package-specific smoke checks are listed in the corresponding `package.json`. Use the narrowest relevant checks while iterating, then run the repository gates before committing.

## Required gates

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd build
pnpm.cmd format:check
git diff --check
```

Every workspace exposes consistent `build`, `lint`, and `typecheck` scripts. Formatting is intentionally checked once at the root so the same Prettier configuration covers source, documentation, manifests, and configuration files.

## Engineering boundaries

- Preserve strict TypeScript; do not use `any` as a shortcut around a real type problem.
- Keep service-role credentials in server-side API/development code only.
- Every tenant-owned read or write must include authenticated organization context and an organization predicate.
- Keep Supabase Storage private and return temporary signed download URLs rather than public object URLs.
- Classification suggestions must never make a document customer-visible automatically.
- Use translation catalogs or the typed locale copy modules for user-facing text.
- Schema changes require a Prisma migration and focused isolation/drift checks.
- Do not describe the product as certified, compliant, production-ready, or complete without evidence.

## Pull-request notes

Summarize the user-visible outcome, list the verification commands run, call out security or migration implications, and identify known limitations. Never include tokens, signed URLs, database credentials, private file contents, or customer data in logs, fixtures, screenshots, or review notes.
