# BuildTrace Next Steps

## Current status

Phase 0 - Professional project foundation + security docs is complete.

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Phase 2 - Database + auth + tenancy is complete.

Current full beta roadmap completion:

- 22%

Current next phase:

- Phase 3 - Machine/customer records foundation

Latest pushed commits:

- `c58db3f docs: update phase 2 roadmap state`
- `9d53700 docs: update phase 2 security and data protection state`
- `d011307 docs: record phase 2 decision reconciliation`
- `85533c8 docs: update phase 2 project state`
- `ec2b2f1 test(db): add activity log smoke check`

## Immediate next step

Finish the Phase 2 review-hardening closeout before starting Phase 3 implementation.

Reason:

- Claude's Phase 2 review found no critical code issue
- the remaining concerns are documentation/state alignment and small consistency fixes
- Phase 3 should not start while docs or code still describe Phase 2 as future work
- BuildTrace's quality rule requires concerns to be fixed or explicitly documented before moving forward

Current hardening focus:

- keep docs aligned with Phase 2 completion
- keep Phase 2 completion at 22%
- keep Phase 3 listed as the next phase
- document intentional Phase 2 decisions clearly
- avoid starting Phase 3 product code until hardening and final gates are clean

## Phase 2 review-hardening checklist

### Completed hardening items

- `docs/project-state.md` updated for Phase 2 completion
- `docs/decisions.md` updated with Phase 2 decision reconciliation
- `docs/security.md` updated from future-tense Phase 2 plan to implemented Phase 2 state
- `docs/data-protection.md` updated with Phase 2 activity-log and data-handling state
- `docs/roadmap.md` updated to show Phase 2 complete and Phase 3 next

### Remaining hardening items

- update `docs/phase-log.md` with Phase 2 implementation and hardening entries
- run final full verification gates
- confirm working tree is clean
- optionally request a final Claude review after the hardening commits are pushed

## Phase 2 completed scope

Phase 2 completed the database, auth, and tenancy trust foundation.

Completed implementation includes:

- Prisma tooling foundation
- PostgreSQL schema foundation
- organization table
- app-user table
- organization membership table
- activity-log table
- `OrganizationRole` enum with `OWNER`, `ADMIN`, and `MEMBER`
- initial Prisma migration
- migration-from-zero validation against disposable PostgreSQL
- Prisma client factory
- generated Prisma client ignore/regeneration workflow
- Supabase auth config boundary
- Supabase bearer-token verifier
- bearer authorization-header parser
- auth smoke check
- API dependency on `@buildtrace/db`
- current-user resolution foundation
- tenant access guard foundation
- tenant access smoke check
- authenticated tenant-context composition helper
- activity-log helper
- activity-log smoke check
- Phase 2 documentation closeout
- Phase 2 review-hardening documentation updates

## Phase 2 intentional non-scope

Phase 2 intentionally did not add:

- real frontend login flow
- mounted protected API endpoints
- machine records
- customer records
- document upload
- private storage buckets
- signed download URLs
- QR portal access control
- tickets backend
- spare parts or quote workflows
- feedback workflows
- product-specific RBAC
- database row-level security claims
- production rate limiting
- deployment

These belong to later roadmap phases unless explicitly re-scoped.

## Phase 2 decision reminders

### Membership model

Phase 2 uses `OrganizationMembership` with membership-scoped roles.

Roles currently are:

- `OWNER`
- `ADMIN`
- `MEMBER`

Reason:

- organization access belongs to a user's membership in a specific organization
- the model avoids redesign if one user belongs to more than one organization
- product-specific roles should be introduced when their owning workflows exist

### Actor typing

Phase 2 activity logs use nullable `actor_user_id` for authenticated internal app users.

Phase 2 does not add `actor_type` yet.

Reason:

- non-user actors do not have real logging call sites yet
- QR portal actors, customer-viewer actors, and system/worker actors belong to later phases
- unused actor typing would create schema surface before the product needs it

Future trigger:

- add a documented `ActorType` enum and migration when the first non-`AppUser` activity-log producer is implemented

### Audit-log deletion posture

Activity logs are tenant-owned records.

In Phase 2, deleting an organization cascades to its activity logs.

Reason:

- the beta foundation does not yet include legal hold, retention overrides, or anonymized audit retention workflows
- organization deletion should remove tenant-owned personal and operational metadata unless a later retention policy says otherwise
- retention must be revisited before production organization deletion workflows

### RLS wording

BuildTrace must not claim database row-level security is implemented.

Current tenant isolation foundation is API-layer only.

RLS may be considered later only after it is configured and tested with the chosen Prisma/Supabase setup.

## Phase 3 next phase

Phase 3 is Machine/customer records foundation.

Phase 3 target after completion:

- 32% of full beta roadmap

Expected Phase 3 scope:

- customers CRUD
- machine models CRUD
- machines CRUD
- machine detail page connected to real data
- machine create/edit logging
- localized status labels
- locale date/number formatting
- machine tenant checks

Phase 3 exit condition:

- builder can create machine record securely
- machine/customer records are organization-scoped
- activity log records machine creation/edit
- user cannot access another organization's machine/customer records

## Recommended Phase 3 baby-step sequence

### Step 0 - Phase 3 decision preflight

Goal:

- lock the smallest safe machine/customer records slice before adding product tables

Expected output:

- confirmed Phase 3 schema ownership
- confirmed customer/machine relationship model
- confirmed tenant-check pattern for machine/customer records
- confirmed activity-log action naming convention
- confirmed files allowed to change
- no code changes unless explicitly approved

Quality checks:

- no machine/customer schema added before relationship decisions are clear
- no fake customer or machine data
- no dashboard metrics
- no frontend redesign
- no broad backend scope

### Step 1 - Phase 3 schema foundation

Goal:

- add only the minimum machine/customer schema needed for Phase 3

Expected tables may include:

- customers
- machine_models
- machines

Expected behavior:

- every product record must be organization-scoped
- no cross-organization access path
- no document/storage/QR/ticket fields unless explicitly needed for Phase 3

Quality checks:

- Prisma schema validates
- migration generated and reviewed
- migration tested from zero against disposable PostgreSQL
- generated client policy remains intact
- no generated Prisma client output committed

### Step 2 - API service foundation

Goal:

- add server-side machine/customer access helpers without fake endpoints

Expected output:

- tenant-scoped query helpers or services
- create/update helper shape
- activity-log call points for create/edit
- clear error behavior for unauthorized organization access

Do not add:

- unguarded product queries
- public machine access
- customer portal access
- document upload
- storage
- tickets
- fake dashboard data

### Step 3 - Minimal UI connection

Goal:

- connect the existing machine shell to real organization-scoped data only after the backend boundary exists

Expected output:

- real empty states
- no fake metrics
- no fake machine records
- translated labels
- tenant-safe data loading

Do not add:

- fake seeded production-looking data
- broad dashboard analytics
- document workflows
- QR portal workflows

## Current frontend shell status

The frontend shell is complete for Phase 1 and should not be redesigned during Phase 3 foundation work.

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

Frontend changes during Phase 3 should be limited to what is necessary for machine/customer records and should preserve the existing shell quality.

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

`apps/web/next-env.d.ts` is currently tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Before committing:

- run `pnpm.cmd build`
- check `git status --short`
- do not commit `apps/web/next-env.d.ts` dev-server drift

## Quality rules

Use Lean discipline.

Before implementing each baby step:

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
- no row-level security claims until RLS is configured and tested

## Commands to run after each implementation slice

Run from:

```powershell
C:\Users\chand\buildtrace
```

Use:

```powershell
pnpm.cmd format:check
pnpm.cmd turbo typecheck --force
pnpm.cmd turbo lint --force
pnpm.cmd turbo build --force
git diff --check
git diff --stat
git diff --name-status
git ls-files --others --exclude-standard
git status --short
```

For database changes, also run:

```powershell
pnpm.cmd --filter @buildtrace/db run prisma:validate
```

For auth/tenant/activity helpers, run the relevant smoke checks:

```powershell
pnpm.cmd --filter @buildtrace/api run auth:smoke
pnpm.cmd --filter @buildtrace/api run tenant:smoke
pnpm.cmd --filter @buildtrace/db run activity:smoke
```

If `format:check` fails, format only the changed human-authored files first, then rerun all gates.

## Manual browser checks for frontend-affecting changes

If a slice changes the web app, run:

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

Use this for the next implementation chat after Phase 2 review hardening is fully complete:

```text
You are working on BuildTrace Beta.

Repository path:
C:\Users\chand\buildtrace

Current state:
- Phase 0 is complete.
- Phase 1 is complete.
- Phase 2 is complete.
- Current full beta roadmap completion is 22%.
- Current next phase is Phase 3 - Machine/customer records foundation.
- Working tree should be clean before this step.

Task:
Inspect the repo and docs, then propose the smallest safe Phase 3 decision preflight step.

Scope:
- Do not edit files yet.
- Do not apply patches.
- Do not commit.
- Inspect current repo structure and current docs.
- Identify the minimal first machine/customer records foundation slice.
- Keep the proposal Lean and root-cause oriented.
- Do not jump into document upload, QR portal, tickets, storage workflows, spare parts, quote flow, feedback, deployment, or dashboard metrics.

Output:
1. What is already done.
2. What Phase 3 requires.
3. Recommended first baby step.
4. Files likely involved.
5. What must not be touched.
6. Gates to run after implementation.
7. Risks and quality checks.
```
