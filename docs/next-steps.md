# BuildTrace Next Steps

## Current status

Phase 0 - Professional project foundation + security docs is complete.

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Phase 2 - Database + auth + tenancy is complete.

Phase 2 review hardening is complete.

Phase 3 - Machine/customer records is complete.

Phase 4 - Document dump upload is complete.

Phase 5 - Document classification is complete.

Current full beta roadmap completion:

- about 55%

Current active phase:

- Phase 6 - Handover completeness + export

## Immediate next step

Start the smallest safe Phase 6 handover-completeness foundation slice.

Reason:

- Phase 5 classification is browser-verified end to end.
- Classification suggestions are explicit builder-confirm only.
- Classification does not change visibility or customer exposure.
- `document.classification_confirmed` activity logging exists.
- Dev preflight and dev browser-session bootstrap now reduce browser-verification token errors.
- Phase 6 can start from a clean DB -> API -> web document foundation.

Current focus:

- keep Phase 5 closed at about 55% full beta completion
- list Phase 6 as the active next phase
- keep private document storage and signed download URL boundaries intact
- keep classification suggestion-only; do not add AI/OCR/vector search in Phase 6
- build handover completeness from existing machine/document metadata
- keep all product records organization-scoped
- keep web data access through the API boundary
- keep browser token travel through the approved dev browser-session flow
- keep activity-log actions typed
- keep status labels and user-facing copy localized

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

## Phase 3 implementation status

Phase 3 is Machine/customer records foundation.

Phase 3 target after full completion:

- 32% of full beta roadmap

Current full beta roadmap completion:

- about 32%

Expected Phase 3 scope:

- customers CRUD
- machine models CRUD
- machines CRUD
- machine detail page connected to real data
- machine create/edit logging
- localized status labels
- locale date/number formatting
- machine tenant checks

Completed Phase 3 scope so far:

- Phase 3 decision preflight completed
- web data-access path selected: web calls the NestJS API boundary
- direct Next.js database access deferred
- bearer-token travel path selected: server-rendered web pages read session cookies and forward bearer token to the API client
- development provisioning path selected: explicit `dev:bootstrap` tooling for real Supabase auth user, app user, organization, and membership
- Prisma owns `MachineStatus`
- app-facing machine statuses are mirrored in shared constants
- machine status drift check exists
- typed activity-log action constants exist
- customers, machine models, and machines added to Prisma schema
- schema field names aligned to accepted roadmap wording
- migrations generated and reviewed
- Prisma schema validates
- generated Prisma client remains ignored/generated
- real PostgreSQL tenant-isolation check added
- DB helpers added for customer create/read paths
- DB helpers added for machine model create/read paths
- DB helpers added for machine create/read/detail paths
- API endpoints added for customer create/read paths
- API endpoints added for machine model create/read paths
- API endpoints added for machine create/read/detail paths
- API route registration smoke check added
- web API client added for customer, machine model, and machine calls
- cookie-backed web session boundary added
- machines page connected to real API-backed counts
- customer create form added
- machine model create form added
- machine create form added
- machine list connected to real data
- machine detail page connected to real data
- browser verification passed with one real customer, one real model, and one real machine
- machine list rendering stabilized with a stable React key

Final Phase 3 exit-condition status:

- builder can create machine record securely: met for the verified dev Supabase/app-user/org path
- machine/customer records are organization-scoped: met for current create/read paths
- activity log records machine creation/edit: met for shipped Phase 3 create and update paths
- user cannot access another organization's machine/customer records: met for shipped helper/API read and mutation paths

Remaining Phase 3 scope before complete:

- none; Phase 3 is implementation-complete and runtime-verified
- delete workflows remain intentionally out of the shipped Phase 3 slice unless a later phase explicitly adds them

## Locked Phase 3 decisions

These decisions are now implemented and should not be reopened unless a real defect requires it.

### Web data-access path

Selected path:

- Option B - the web app calls `apps/api` over HTTP with a bearer token, and the NestJS API remains the only runtime that touches the database.

Deferred path:

- Option A - Next.js server components or route handlers importing `@buildtrace/db` directly.

Reason:

- Phase 2 auth, current-user, tenant-access, and authenticated-tenant-context helpers live in the API boundary.
- Keeping database access behind one API enforcement point reduces duplicated tenant-check logic.
- Direct web database access would create a second runtime that must independently enforce organization access.
- The verified Phase 3 browser flow proved DB -> API -> web without bypassing the API boundary.

Bearer-token travel result:

- Web session values are read from cookies.
- Server-rendered machine pages use the web API client.
- API calls receive the bearer token through the approved API client path.
- Browser verification confirmed the token and organization cookies unlock the real machine records page.

### Authenticated-builder and development provisioning

Selected path:

- use a documented development bootstrap path for organization, app user, and membership records
- require a real Supabase auth user UUID
- keep bootstrap data clearly labeled as development tooling
- do not present bootstrap data as product demo data
- do not add fake production-looking customers or machines

Verified result:

- development org/user/membership bootstrap succeeded
- real Supabase token cookie and organization cookie unlocked the machine records UI
- builder create/list/detail flow worked through the API boundary

Important boundary:

- Phase 3 still does not claim a finished frontend login flow.
- Browser login UI remains outside this verified slice unless separately implemented and tested.

### Enum ownership and drift checks

Selected path:

- Prisma owns `MachineStatus`.
- `packages/shared` mirrors app-facing status constants.
- API drift check verifies Prisma enum values and shared constants stay aligned.
- Localized labels remain labels, not source-of-truth status values.

Quality rule:

- no Prisma enum mirror without a drift check
- no translated status label used as a database/API value
- status values remain stable machine-readable constants

Verified result:

- machine status drift check passed
- web status labels render from the approved app-facing values

### Activity-log action constants

Selected path:

- activity-log action names live as typed constants in shared code
- DB and API helpers consume typed action values
- string literal drift is avoided for implemented call sites

Current action coverage:

- machine/customer/model create actions exist where implemented
- update/delete action coverage must be added in the same slice as update/delete behavior if those paths ship in Phase 3

Quality rule:

- no new activity-log action should be introduced as an untyped ad hoc string

## Recommended remaining Phase 3 baby-step sequence

### Step A - Customer update/delete closeout

Goal:

- complete or explicitly scope customer update/delete behavior before Phase 3 closeout

Expected output:

- customer update API path or explicit deferral decision
- customer delete API path or explicit no-delete decision
- tenant-scoped customer queries
- typed activity-log action coverage for shipped mutations
- web UI only if needed for the accepted Phase 3 exit condition
- smoke checks updated for new behavior

Quality checks:

- no cross-organization customer access
- no delete behavior that silently removes related production records without a documented posture
- no fake customers
- localized user-facing copy for any new UI/error state

### Step B - Machine model update/delete closeout

Goal:

- complete or explicitly scope machine model update/delete behavior before Phase 3 closeout

Expected output:

- machine model update API path or explicit deferral decision
- machine model delete API path or explicit no-delete decision
- tenant-scoped model queries
- typed activity-log action coverage for shipped mutations
- web UI only if needed for the accepted Phase 3 exit condition
- smoke checks updated for new behavior

Quality checks:

- no cross-organization model access
- no model delete that breaks existing machines without a documented posture
- no fake machine models
- localized user-facing copy for any new UI/error state

### Step C - Machine update/delete closeout

Goal:

- complete or explicitly scope machine update/delete behavior before Phase 3 closeout

Expected output:

- machine update API path or explicit deferral decision
- machine delete API path or explicit no-delete decision
- tenant-scoped machine queries
- typed activity-log action coverage for shipped mutations
- web UI only if needed for the accepted Phase 3 exit condition
- smoke checks updated for new behavior

Quality checks:

- no cross-organization machine access
- no machine delete that conflicts with future document/ticket/portal phases without a documented posture
- no fake machines
- localized user-facing copy for any new UI/error state

### Step D - Localization and formatting closeout

Goal:

- verify Phase 3 user-facing copy and formatting across supported locales

Expected output:

- all new Phase 3 copy covered across supported locale files or documented as shared internal-only copy
- status labels verified in supported locales
- date formatting verified through locale-aware formatting
- number/count formatting verified through locale-aware formatting
- no mojibake or corrupted characters
- no hardcoded user-facing English in UI paths

Quality checks:

- `pnpm.cmd format:check`
- relevant typecheck/lint/build gates
- manual browser checks for at least English and one non-English route
- search for corrupted encoding markers without keeping those marker characters in this doc

### Step E - Phase 3 closeout review

Goal:

- close Phase 3 honestly before Phase 4 document upload begins

Expected output:

- roadmap updated with final Phase 3 status
- next steps updated to point to Phase 4 only after Phase 3 is actually complete
- phase log appended with final Phase 3 closeout
- decisions updated only if new decisions were made
- external review prompt prepared
- no rolling current commit lists added to forward-looking docs

Quality checks:

- no claim of full CRUD unless update/delete or explicit deferral decisions are documented
- no claim of full login unless login is actually implemented and tested
- no document upload, QR portal, ticket, storage, spare-parts, quote, feedback, or deployment scope sneaks into Phase 3

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

Use this for the next Phase 3 slice:

```text
You are working on BuildTrace Beta.

Repository path:
C:\Users\chand\buildtrace

Current state:
- Phase 0 is complete.
- Phase 1 is complete.
- Phase 2 is complete.
- Phase 3 is complete.
- Phase 3 Step 0 decisions are locked.
- Phase 3 create/read/update vertical slice is implemented and browser-verified through DB -> API -> web.
- Current full beta roadmap completion is about 45%.
- Working tree should be clean before this step.

Task:
Inspect the repo and start the smallest safe Phase 4 document upload foundation slice.

Recommended next slice:
- Phase 4 document upload schema/API preflight, without weakening the Phase 3 machine-record boundary

Scope:
- Preserve the existing API-boundary architecture.
- Do not import `@buildtrace/db` directly into the web app.
- Do not add fake data.
- Do not add auth bypasses.
- Do not touch document upload, QR portal, tickets, storage workflows, spare parts, quote flow, feedback, deployment, or dashboard metrics.
- Do not redesign the existing shell.
- Do not reopen Phase 0, Phase 1, Phase 2, or completed Phase 3 Step 0 decisions unless a real defect requires it.

Quality bar:
- organization-scoped queries only
- typed activity-log actions for shipped mutations
- strict TypeScript
- localized user-facing copy
- no hardcoded secrets
- no stale rolling commit lists in forward-looking docs
- no compliance, safety, CE, Machinery Regulation, CRA, or approval guarantees

Output:
1. Exact slice selected.
2. Files likely involved.
3. What must not be touched.
4. Implementation.
5. Gates run.
6. Browser checks if UI changed.
7. Remaining Phase 3 work after the slice.

```
