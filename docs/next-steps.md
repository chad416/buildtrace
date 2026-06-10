# BuildTrace Next Steps

## Phase 2 Step 0 - Decision preflight

Before adding Prisma, Supabase Auth, database schema, or tenant logic, complete the Phase 2 decision preflight.

Step 0 locks:

- minimal Phase 2 trust-foundation slice
- schema ownership by roadmap phase
- tenant isolation model
- auth-to-user mapping
- web/API auth boundary
- Prisma generate and Turbo pipeline rule
- enum drift prevention rule
- migration-from-zero rule
- append-only activity log rule
- IP address and user agent data-handling expectation

Implementation must not start until these decisions are reviewed.

Next implementation slice after Step 0:

- add Prisma tooling in `packages/db`
- add Prisma generation workflow
- wire generation into Turbo task dependencies
- validate cold-clone behavior
- do not add product tables beyond the approved Phase 2 trust foundation

Do not start:

- machine CRUD
- customer CRUD
- document upload
- storage
- QR portal
- tickets backend
- software timeline
- spare parts logic
- quote flow
- feedback collection
- dashboard data

## Current status

Phase 0 - Professional project foundation + security docs is complete.

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Current full beta roadmap completion:

- 12%

Latest feature commit:

- `92a1585 feat(web): complete phase 1 shell foundation`

Phase 1 was formally closed because the documented exit conditions were met:

- serious industrial UI click-through works
- language switching works
- secure-by-default positioning is visible

## Current phase transition

BuildTrace is ready to move from Phase 1 to Phase 2.

Next phase:

- Phase 2 - Database + auth + tenancy

Phase 2 target after full completion:

- 22% of full beta roadmap

## Immediate next baby step

Start Phase 2 with a controlled planning and foundation slice.

Recommended next task:

- inspect the current repo and docs
- confirm the Phase 2 data/auth boundaries
- define the first minimal database/auth/tenancy implementation step
- avoid adding broad backend scope before the first Phase 2 slice is clearly approved

The first Phase 2 implementation should be small enough to verify cleanly and should not attempt to build the full backend in one jump.

## Phase 2 scope from roadmap

Phase 2 is expected to introduce:

- Supabase Auth
- PostgreSQL
- Prisma schema
- organization workspace logic
- user preferred language
- organization default language
- customer preferred language
- organization-level tenant isolation
- API-level tenant checks
- RBAC foundation
- activity log table
- login event logging
- secure environment variable setup

Phase 2 exit condition:

- logged-in builder sees only their own organization data
- core activity logging works
- unauthorized access is blocked

## Recommended Phase 2 baby-step sequence

### Step 1 - Phase 2 architecture confirmation

Goal:

- decide the safest exact starting point for database/auth/tenancy

Expected output:

- confirmed Phase 2 implementation plan
- confirmed files allowed to change
- confirmed environment variable names
- confirmed security boundaries
- no code changes unless explicitly approved

Quality checks:

- no secrets in code
- no broad schema drift
- no accidental frontend rewrite
- no generated files committed accidentally

### Step 2 - Database package and Prisma foundation

Goal:

- introduce the Prisma/database foundation without real product workflows yet

Expected output:

- Prisma configuration
- initial schema structure
- database package exports
- safe placeholder or generated client flow if appropriate
- no production data
- no real customer/machine CRUD yet

Quality checks:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- `git status --short`

### Step 3 - Core schema draft for Phase 2

Goal:

- add only the Phase 2 core tables needed for auth/tenancy foundation

Expected tables may include:

- organizations
- users
- activity_log

Possible supporting enums:

- user role
- locale
- activity action type

Do not add full later-phase workflow tables unless the approved Phase 2 slice requires them.

Quality checks:

- schema validates
- generated artifacts are understood before committing
- no unrelated lockfile or generated drift is committed without review

### Step 4 - Auth environment and Supabase boundary

Goal:

- prepare authentication integration safely

Expected output:

- documented environment variable names
- no hardcoded secrets
- no committed real credentials
- clear distinction between local/dev placeholders and production secrets

Do not add:

- unsafe public keys beyond intended client-side public config
- service-role secrets in frontend
- bypassed auth checks
- fake authentication that looks real

### Step 5 - Tenant isolation foundation

Goal:

- establish the organization boundary before real business records are added

Expected output:

- organization-scoped access pattern
- no cross-organization data access
- clear server-side guard pattern
- activity logging direction

Do not add:

- machine CRUD
- document upload
- QR portal
- ticket workflows
- customer-facing portal data

## Current frontend shell status

The frontend shell is complete for Phase 1 and should not be redesigned during the first Phase 2 baby step.

Current shell includes:

- translated app shell
- translated header
- translated footer
- language switcher
- active navigation
- localized landing page
- localized dashboard placeholder
- localized login placeholder
- localized settings placeholder
- localized machine detail placeholder
- translated placeholder routes for all Phase 1 shell pages

Frontend changes during early Phase 2 should be limited to what is necessary for auth/database integration.

## CSS quality note

A Phase 1 browser issue showed the app rendering as plain HTML without real styling.

Root cause:

- Tailwind utility classes existed in JSX
- Tailwind/PostCSS CSS pipeline was missing or incomplete
- global CSS was not wired into the localized layout

Resolved by adding:

- `apps/web/src/app/globals.css`
- `apps/web/postcss.config.mjs`
- required Tailwind/PostCSS dependencies in `apps/web/package.json`
- `pnpm-lock.yaml` updates
- global CSS import from the localized layout

Manual verification confirmed:

- Next dev served a real CSS asset
- Tailwind utility output was present
- pages rendered as styled shell pages, not plain HTML

Future rule:

- do not treat styling failures as cosmetic if Tailwind classes are present but CSS is missing
- verify the CSS pipeline as part of frontend quality gates

## Known generated-file caution

`apps/web/next-env.d.ts` is tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Before committing:

- run `pnpm.cmd build`
- check `git status --short`
- do not commit `apps/web/next-env.d.ts` dev-server drift

## Phase 2 quality rules

Use Lean discipline.

Before implementing each Phase 2 baby step:

- confirm exact scope
- inspect current files first
- avoid assumptions
- change only the approved files
- keep the implementation small enough to verify fully
- run all gates before commit
- review untracked files before staging
- avoid generated/cache file commits
- do not hide root causes with workarounds

React/TypeScript quality rules:

- use stable internal IDs for React keys
- do not use translated visible text as React keys
- keep TypeScript strict-safe
- derive shared message/data types from source of truth where practical
- avoid duplicated manual contracts that can drift

Security quality rules:

- no hardcoded secrets
- no public storage buckets
- no private file URLs exposed
- no auth bypasses
- no tenant isolation shortcuts
- no customer-visible access before authorization rules exist
- no service-role secrets in frontend code
- no fake security behavior that appears production-ready

## Commands to run after each implementation slice

Run from:

```powershell
C:\Users\chand\buildtrace
```

Use:

```powershell
pnpm.cmd format:check
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd build
git diff --check
git diff --stat
git diff --name-status
git ls-files --others --exclude-standard
git status --short
```

If `format:check` fails, run:

```powershell
pnpm.cmd format
```

Then rerun all gates.

## Manual browser checks for frontend-affecting changes

If a Phase 2 slice changes the web app, run:

```powershell
pnpm.cmd --filter @buildtrace/web dev
```

Then check:

- `/en`
- `/en/dashboard`
- `/en/login`
- `/en/settings`
- `/en/machines/example-machine`
- one non-English route such as `/cs/dashboard`

If auth redirects are added later, update the browser checks to match the approved auth behavior.

## What should not be started accidentally

Do not start these until their roadmap phase or an explicitly approved baby step:

- machine CRUD
- customer CRUD
- document upload
- Supabase Storage
- QR portal
- ticket backend
- software timeline
- spare parts logic
- quote flow
- feedback collection
- handover export
- PDF export
- ZIP export
- production deployment
- Sentry
- PostHog

## Next recommended prompt

Use this for the next implementation chat:

```text
You are working on BuildTrace Beta.

Repository path:
C:\Users\chand\buildtrace

Current state:
- Phase 0 is complete.
- Phase 1 is formally complete.
- Current full beta roadmap completion is 12%.
- Latest feature commit: 92a1585 feat(web): complete phase 1 shell foundation.
- Phase 2 is starting: Database + auth + tenancy.
- Working tree should be clean before this step.

Task:
Inspect the repo and docs, then propose the smallest safe first Phase 2 baby step.

Scope:
- Do not edit files yet.
- Do not apply patches.
- Do not commit.
- Inspect current repo structure and current docs.
- Identify the minimal first database/auth/tenancy foundation slice.
- Keep the proposal Lean and root-cause oriented.
- Do not jump into machine CRUD, document upload, QR portal, tickets, storage workflows, or dashboard data.

Output:
1. What is already done.
2. What Phase 2 requires.
3. Recommended first baby step.
4. Files likely involved.
5. What must not be touched.
6. Gates to run after implementation.
7. Risks and quality checks.
```

```

```
