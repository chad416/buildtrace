# BuildTrace Next Steps

## Current status

Phase 0 - Professional project foundation + security docs is complete.

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Phase 2 - Database + auth + tenancy is complete.

Phase 2 review hardening is complete.

Current full beta roadmap completion:

- 22%

Current next phase:

- Phase 3 - Machine/customer records foundation

## Immediate next step

Start Phase 3 Step 0 - decision preflight.

Reason:

- Claude's final Phase 2 re-review passed
- Phase 2 implementation is complete
- Phase 2 review hardening is complete
- final Phase 2 gates passed cleanly
- rolling current commit lists are stale-by-construction and should not be maintained in current-state docs
- Phase 3 should start from clean, current docs
- Phase 3 introduces the first real product records
- BuildTrace's quality rule requires decisions before schema, endpoint, and UI implementation

Current focus:

- keep Phase 2 completion at 22%
- keep Phase 3 listed as the next phase
- lock the Phase 3 web data-access architecture before any product endpoint or UI data work
- lock how the bearer token travels from browser session to API calls
- lock the authenticated-builder and development provisioning path before claiming secure machine creation
- lock enum ownership and drift-check policy before adding app-facing status labels
- lock activity-log action constants before adding first real activity-log call sites
- then begin Phase 3 decision preflight before product code

## Phase 2 review-hardening checklist

### Completed hardening items

- `docs/project-state.md` updated for Phase 2 completion
- `docs/decisions.md` updated with Phase 2 decision reconciliation
- `docs/security.md` updated from future-tense Phase 2 plan to implemented Phase 2 state
- `docs/data-protection.md` updated with Phase 2 activity-log and data-handling state
- `docs/roadmap.md` updated to show Phase 2 complete and Phase 3 next
- `docs/next-steps.md` updated to point to Phase 3
- `docs/phase-log.md` updated with Phase 2 implementation and hardening entries
- `packages/db/prisma.config.ts` updated to fail clearly when `DATABASE_URL` is missing
- `apps/api/src/main.ts` updated so `/health` reports the Phase 2 trust foundation
- `turbo.json` updated so Turbo passes `DATABASE_URL` into Prisma tasks
- final full verification gates passed
- final external re-review cleared Phase 2 for Phase 3

No Phase 2 hardening items remain before Phase 3.

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
- Prisma config that fails clearly when `DATABASE_URL` is missing
- Turbo `DATABASE_URL` pass-through for Prisma generate/build/typecheck tasks
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
- API health label updated to Phase 2 trust foundation
- Phase 2 documentation closeout
- Phase 2 review-hardening documentation updates
- final Phase 2 re-review clearance

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

These are forward-looking reminders only.

`docs/decisions.md` remains the canonical source for active architectural decisions.

Historical phase-log entries should not be rewritten when a later decision changes; new decisions should be recorded in `docs/decisions.md` and reflected only in forward-looking docs.

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

### Turbo and DATABASE_URL

Prisma config requires `DATABASE_URL`.

Turbo uses strict environment mode.

`DATABASE_URL` is passed into Turbo tasks through `globalPassThroughEnv`.

Reason:

- Prisma config should fail clearly when configuration is missing
- Turbo task isolation should not be disabled
- the secret value must not be committed
- the machine-specific URL should not invalidate caches across machines or CI environments

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

## Required Phase 3 Step 0 decisions

Phase 3 Step 0 must decide these before schema, endpoint, or UI implementation begins.

### Web data-access path

Phase 3 must choose one primary data-access path before connecting the machine shell to real data.

Allowed options:

- Option A - Next.js server components or route handlers import `@buildtrace/db` directly and enforce tenant checks in the web runtime.
- Option B - the web app calls `apps/api` over HTTP with a bearer token, and the NestJS API remains the only runtime that touches the database.

Preferred default:

- Option B, unless a documented reason says otherwise.

Reason:

- Phase 2 auth, current-user, tenant-access, and authenticated-tenant-context helpers live in the API boundary.
- Keeping database access behind one API enforcement point reduces duplicated tenant-check logic.
- Direct web database access would create a second runtime that must independently enforce organization access.

Step 0 output must record:

- selected data-access path
- why the other option is deferred
- which package owns machine/customer reads and writes
- how tenant checks are enforced
- how the web app receives data without bypassing the API boundary
- how the bearer token travels from browser session to API calls:
  - client-side fetch using the browser-held token
  - or server-side forwarding after reading session state from cookies

### Authenticated-builder and development provisioning

Phase 3 must define how a real builder exists before claiming secure machine creation.

The decision must answer:

- how an `Organization` is created for development
- how an `AppUser` is created for development
- how an `OrganizationMembership` is created for development
- whether Phase 3 includes minimal real login or only API-layer validation with a real token
- whether a clearly labeled bootstrap/seed script is needed

Lean default:

- use a documented development bootstrap/seed path for organization, app user, and membership records
- keep it clearly labeled as development tooling
- do not present bootstrap data as product demo data
- do not add fake production-looking customers or machines
- do not claim browser login is complete unless Supabase browser session flow is actually implemented and verified

Reason:

- Phase 2 intentionally deferred frontend login and browser session management.
- Phase 3 cannot honestly claim builder can create machine record securely without a defined authenticated-builder path.
- Development provisioning is tooling, not fake product data, when it is explicit, minimal, and not customer-facing.

### Enum ownership and drift checks

Phase 3 localized status labels imply a machine status enum.

Before adding machine status, Step 0 must decide:

- whether `MachineStatus` is owned by Prisma first
- whether app-facing status constants are derived or mirrored
- where localized labels live
- what drift check prevents Prisma enum values and app-facing status values from diverging

Quality rule:

- if a Prisma enum is mirrored in `packages/shared`, `packages/i18n`, or app UI code, a drift check must ship in the same slice
- no manual enum mirror should be added without a check
- translated labels must not become the source of truth for status values

Reason:

- status values affect database integrity, API behavior, i18n labels, and UI filtering
- enum drift creates subtle product bugs
- Phase 2 avoided this because organization roles were not mirrored into app-facing i18n labels

### Activity-log action constants

Phase 3 must turn activity-log action naming from a docs convention into typed code before first real call sites.

Required decision:

- where activity action constants live
- naming shape for machine/customer actions
- whether actions are grouped by domain
- how helpers consume action constants

Lean default:

- define action constants in code before machine/customer create/edit logging
- use typed constants instead of repeated string literals
- keep the first action set minimal

Expected early actions may include:

- machine create
- machine update
- customer create
- customer update

Reason:

- activity logs are only useful if action names are consistent
- typo-prone string literals create silent audit-log inconsistency
- the first real call sites are the right time to introduce the small abstraction

## Recommended Phase 3 baby-step sequence

### Step 0 - Phase 3 decision preflight

Goal:

- lock the smallest safe machine/customer records slice before adding product tables

Expected output:

- confirmed Phase 3 schema ownership
- confirmed customer/machine relationship model
- confirmed tenant-check pattern for machine/customer records
- confirmed web data-access path
- confirmed bearer-token travel path from browser session to API call
- confirmed authenticated-builder and development provisioning approach
- confirmed enum ownership and drift-check policy
- confirmed activity-log action naming convention and constants location
- confirmed first guarded API endpoint shape
- confirmed files allowed to change
- no product code changes unless explicitly approved

Quality checks:

- no machine/customer schema added before relationship decisions are clear
- no web data access before the API/direct-db architecture choice is recorded
- no bearer-token/session plumbing before client-side versus server-side data loading is recorded
- no secure-builder claim before auth/provisioning path is recorded
- no machine status enum mirror without a drift check
- no activity-log action string literals before action constants are defined
- no fake customer or machine data
- no dashboard metrics
- no frontend redesign
- no broad backend scope
- no document, QR, ticket, storage, spare-parts, quote, or feedback work

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
- enum drift check added in the same slice if machine status is mirrored outside Prisma

### Step 2 - API service foundation

Goal:

- add server-side machine/customer access helpers without fake endpoints

Expected output:

- tenant-scoped query helpers or services
- create/update helper shape
- activity-log call points for create/edit
- clear error behavior for unauthorized organization access
- typed activity action constants used by first real log call sites

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
- tenant-safe data loading through the Step 0-approved data-access path
- bearer-token/session handling through the Step 0-approved token travel path

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
- do not maintain rolling current commit lists in current-state or forward-looking docs
- use `git log` as the source of truth for current commit history
- keep commit hashes only where they are historical evidence, such as phase-log entries or decision records

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

Confirm `DATABASE_URL` is set before Prisma or Turbo gates:

```powershell
if ($env:DATABASE_URL) { "DATABASE_URL is set" } else { "DATABASE_URL is missing" }
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

Use this for Phase 3 Step 0:

```text
You are working on BuildTrace Beta.

Repository path:
C:\Users\chand\buildtrace

Current state:
- Phase 0 is complete.
- Phase 1 is complete.
- Phase 2 is complete.
- Phase 2 review hardening is complete.
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

Step 0 must include decisions for:
- web data-access path
- bearer-token travel path from browser session to API calls
- authenticated-builder and development provisioning path
- machine/customer schema ownership
- customer/machine relationship model
- tenant-check pattern for machine/customer records
- enum ownership and drift-check policy for status labels
- activity-log action constants and naming convention
- first guarded API endpoint shape
- files allowed to change

Output:
1. What is already done.
2. What Phase 3 requires.
3. Recommended first baby step.
4. Required Step 0 decisions.
5. Files likely involved.
6. What must not be touched.
7. Gates to run after implementation.
8. Risks and quality checks.
```
