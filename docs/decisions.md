# BuildTrace Decisions

## Current phase

Phase 0 - Professional project foundation + security docs is complete.

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Phase 2 - Database + auth + tenancy is complete.

Phase 3 - Machine/customer records foundation is in progress.

Current full beta roadmap completion:

- 22%

Next phase:

- Phase 3 - Machine/customer records foundation

Phase 2 project-state closeout commit:

- `85533c8 docs: update phase 2 project state`

Latest completed Phase 2 implementation commit:

- `ec2b2f1 test(db): add activity log smoke check`

## Architectural decisions

### Monorepo

Use a pnpm workspace monorepo.

Reason:

- keeps web, API, worker, shared code, i18n, database package, and UI package separated
- avoids putting the full product inside one Next.js app
- supports production-grade scaling later

### Turborepo

Use Turborepo for workspace task orchestration.

Reason:

- consistent build, lint, typecheck, and dev commands across apps/packages
- suitable for a multi-app SaaS structure

### Web app

Use Next.js App Router.

Reason:

- supports route-based app structure
- works well with locale routes
- suitable for Vercel deployment later

### API

Use NestJS with Fastify.

Reason:

- structured backend architecture
- good module/controller/service pattern for future phases
- Fastify gives strong runtime performance

### Worker

Create a separate worker app.

Reason:

- later background jobs should not run inside the web app
- future exports, classification, emails, and async processing need isolation

### Shared package

Use `packages/shared` for common constants and enums.

Reason:

- document visibility levels, categories, and locale constants must be consistent across apps

### I18N package

Use `packages/i18n` for locale constants and base messages.

Reason:

- multilingual support is required from day one
- all future UI should use translation keys instead of hardcoded user-facing text

### App messages export

Use `appMessages` as the main exported app message object from `packages/i18n`.

Reason:

- `phaseZeroMessages` became misleading once Phase 1 UI messages were added
- `appMessages` better describes the long-term role of the exported message bundle

### App shell server/client boundary

Keep `AppShell` server-side.

Use a small client component, `AppNav`, only where route-aware active navigation is needed.

Reason:

- avoids making the entire layout client-side unnecessarily
- keeps the shell simple and predictable
- supports active navigation without over-expanding client component scope

### Phase 1 machine detail route

Add `/[locale]/machines/[machineId]` as a placeholder-only translated shell route during Phase 1.

Reason:

- the Phase 1 roadmap requires a machine detail shell
- the route supports serious industrial UI click-through
- real machine records belong to Phase 3
- no database, API, CRUD, QR, document download, or real machine data should be added in Phase 1

### Tailwind/PostCSS CSS pipeline

Use a real Tailwind/PostCSS CSS pipeline for the web shell.

Reason:

- Phase 1 UI uses Tailwind utility classes
- browser testing showed plain HTML-looking output because the CSS pipeline was missing or incomplete
- adding `apps/web/src/app/globals.css`, `apps/web/postcss.config.mjs`, Tailwind/PostCSS dependencies, and importing global CSS from the localized layout fixed the root cause

Quality note:

- styling failures must be root-caused
- do not treat missing CSS output as a cosmetic issue if Tailwind classes are present but no compiled CSS reaches the browser

## Product decisions

### Scope discipline

Phase 0 only created the professional foundation.

Phase 1 created the industrial UI shell and multilingual UI skeleton.

Phase 2 created the database, auth, and tenancy trust foundation.

Phase 3 begins machine and customer records.

No database, auth, storage, QR portal, tickets backend, CRUD, or real dashboard data were part of Phase 1.

No machine records, customer records, document storage, QR portal, tickets, spare parts, quotes, feedback, or real operational workflows were part of Phase 2.

### Phase 1 closure

Phase 1 is formally complete.

Reason:

The roadmap defined Phase 1 exit conditions as:

- user can click through serious industrial UI
- language switching works
- product already communicates secure-by-default positioning

The completed Phase 1 shell satisfies those conditions.

Result:

- full beta roadmap completion moved from 5% to 12%
- next phase became Phase 2 - Database + auth + tenancy

### Phase 2 closure

Phase 2 is formally complete.

Reason:

The roadmap defined Phase 2 as the database, auth, and tenancy trust foundation.

The completed Phase 2 foundation includes:

- Prisma tooling foundation
- PostgreSQL schema for organizations, app users, organization memberships, and activity logs
- migration tested from zero against disposable PostgreSQL
- Prisma client factory
- Supabase auth config boundary
- Supabase bearer-token verifier
- bearer authorization-header parser
- current-user resolution foundation
- tenant access guard foundation
- authenticated tenant-context composition
- activity-log helper
- smoke checks for auth, tenant access, and activity logging

Result:

- full beta roadmap completion moved from 12% to 22%
- next phase is Phase 3 - Machine/customer records foundation

### Phase 3 Step 0 decision lock

Phase 3 targets 32% of the full beta roadmap.

Phase 3 is not allowed to silently shrink into only one thin vertical slice.

The roadmap scope for Phase 3 remains:

- customers CRUD
- machine models CRUD
- machines CRUD
- machine detail backed by real organization-scoped data
- localized machine status labels
- locale-aware date and number formatting
- real tenant isolation proof for product records

Thin vertical slices are the execution method, not the final Phase 3 scope.

Phase 3 implementation must proceed in loops:

1. Machine create path.
2. Machine read/list/detail path.
3. Customer CRUD path.
4. Machine model CRUD path.
5. UI connection after backend tenant proof.
6. Localization and formatting for machine/customer record surfaces.

Phase 3 is only complete when the roadmap scope above is covered, or when a deliberate roadmap update explicitly moves remaining scope to a named later phase.

### Phase 3 scope reconciliation after machine-create slice

The secure machine-create vertical slice is accepted as the load-bearing Phase 3 proof path, not as the entire Phase 3 closeout by itself.

Current accepted interpretation:

- the machine-create path proves the core product boundary from web to API to database
- the web app uses session-derived bearer access through the API boundary
- the API owns authentication, tenant checks, product-record mutation, and activity logging
- the database owns organization-scoped customer, machine-model, and machine records
- the UI shows real API data or honest prerequisite/auth/error states only

This does not silently satisfy broad roadmap CRUD for every Phase 3 record type.

Still-open Phase 3 scope:

- customer update path
- customer delete/archive decision
- machine-model update path
- machine-model delete/archive decision
- machine update path
- machine delete/archive decision
- final decision whether full customer and machine-model CRUD UI ships in Phase 3 or moves to a named later slice
- final docs alignment before Phase 3 closeout

Decision:

- do not mark Phase 3 complete only because machine creation works
- do not claim full CRUD until create, read/list/detail, update, and delete/archive posture are handled or explicitly moved
- continue Phase 3 in small loops unless a roadmap update deliberately moves remaining breadth to a named later phase
- keep the machine-create slice as the quality benchmark for the remaining loops

Reason:

The roadmap promises broad customer, machine-model, and machine record capability. The Lean implementation path is allowed to be vertical and incremental, but the closeout must stay honest against the roadmap.

### Phase 3 web data-access path

Use Option B as the default Phase 3 data-access path.

Decision:

- the web app calls the NestJS API
- the API owns database access
- the API owns tenant enforcement
- the API owns authenticated current-user resolution
- the API owns organization access checks
- the API owns activity logging for mutations

The web app must not import `@buildtrace/db` for Phase 3 product-record access.

Reason:

Phase 2 built and tested the API auth and tenant boundary. Reusing that boundary keeps one enforcement point and avoids duplicating tenant checks across web and API runtimes.

Consequence:

Machine, customer, and machine-model data reaches the web app through API calls, not direct Prisma queries from the web package.

### Phase 3 bearer-token travel

Phase 3 must explicitly decide how the Supabase bearer token travels from browser session to API calls before machine pages load real data.

Accepted starting approach for the first Phase 3 UI connection:

- authenticated browser session owns the Supabase access token
- client-side API calls send `Authorization: Bearer <access_token>` to the NestJS API
- the API verifies the bearer token using the Phase 2 auth verifier
- the API resolves the current app user
- the API checks organization access before returning or mutating product records

Reason:

This is the leanest honest path for the first real product-record UI connection because it avoids inventing server-side session forwarding before the product-record boundary exists.

Constraint:

If Phase 3 later needs server-rendered protected machine data, a separate decision must define cookie/session handling and server-side token forwarding. That must not be improvised inside a feature slice.

### Phase 3 authenticated-builder provisioning

Phase 3 needs a real authenticated builder for secure create flows.

Development provisioning is allowed only as clearly labeled dev tooling.

Accepted approach:

- create a dev bootstrap/seed utility for local development
- the utility may create a development organization, app user, membership, and starter records required to exercise the secure create path
- the utility must be clearly named as development tooling
- the utility must never be imported by product runtime code
- the utility must not be described as demo production data

Preferred home:

- `packages/db/src/dev-seed.ts` or an equivalent clearly labeled db-package dev script

Reason:

Phase 3 needs a repeatable way to test real authenticated create flows without pretending that fake demo data is product behavior.

### Phase 3 product-record ownership

All Phase 3 product records must be organization-scoped.

Required records:

- customer records belong to an organization
- machine model records belong to an organization unless a later decision explicitly introduces global/shared catalog behavior
- machine records belong to an organization
- machine records link to customer and machine model records according to the schema chosen in Phase 3

No product-record query may rely only on record ID.

Every read or mutation path must include tenant scope through `organizationId` or an equivalent enforced organization relation.

### Phase 3 machine create path

The first meaningful Phase 3 backend endpoint must include the secure machine create path.

A GET-only endpoint cannot close Phase 3.

Reason:

The Phase 3 exit condition requires that a builder can create a machine record securely.

Therefore, the machine create path must prove:

- bearer auth works
- current-user resolution works
- organization access check works
- organization-scoped insert works
- activity logging works for the create mutation
- unauthorized cross-tenant access fails

A read endpoint may ship before create as a small proving step, but POST machine create remains mandatory for Phase 3 completion.

### Phase 3 real two-organization isolation proof

Phase 3 must introduce a real tenant isolation test for product records.

Fake Prisma smoke checks are not sufficient once real customer, machine, and machine-model records exist.

Required proof:

- use disposable PostgreSQL or an equivalent real database test path
- seed organization A and organization B
- seed product records for both organizations
- authenticate or simulate an authorized user for organization A through the real helper/API path
- assert organization B records are not visible or mutable from organization A

Reason:

A fake smoke test can prove a guard rejects an obvious wrong organization. It cannot prove that real queries include `organizationId` scoping. The Phase 3 product-record boundary must prove this at the query/API level.

### Phase 3 machine status enum ownership

Phase 3 may introduce a machine status enum.

If a Prisma enum is mirrored into application constants or i18n labels, the same slice must include a drift check.

Required rule:

- no Prisma enum mirror without a test/check proving the app-facing constants and Prisma enum remain aligned
- localized status labels must be derived from the accepted status source
- status labels must not be hardcoded independently in scattered UI code

Reason:

Phase 2 avoided enum drift because roles lived only in Prisma. Phase 3 localized machine statuses create the first real enum mirror risk.

### Phase 3 activity-log action constants

Before the first real product-record mutation, activity-log action names must move from loose strings to typed constants.

Required rule:

- machine, customer, and machine-model create/update activity actions must be defined as constants
- product code must call the helper with constants, not ad hoc string literals
- action naming must be consistent and reviewable

Reason:

Audit-log strings become product evidence. Typos must be type-level failures where practical, not silent inconsistencies in the activity log.

### Phase 3 CRUD loop alignment

Phase 3 helpers, endpoints, and activity logs must stay aligned.

If a slice only implements create/read, it must only claim create/read.

If update is implemented, update activity logging must be included.

If delete is considered, Phase 3 must decide whether delete means hard delete, soft delete, archive, or out of scope.

No docs or code may claim full CRUD until create, read/list/detail, update, and the delete/archive decision are all handled for that record type.

### Phase 3 UI connection order

The web UI must not connect to real product-record data before backend tenant boundaries are proven.

Required order:

1. decisions
2. schema
3. backend helpers
4. authenticated API endpoint
5. real tenant isolation proof
6. UI connection

The UI may keep placeholder and empty-state screens during backend foundation work.

When connected, the UI must show real API data or honest empty states only.

Fake production records, fake metrics, and fake dashboards remain out of scope.

### Phase 3 non-goals

Phase 3 must not add:

- document upload
- file storage
- signed URLs
- QR codes
- ticket workflows
- spare-parts workflows
- quote workflows
- customer public portals
- analytics dashboards
- fake demo production data
- regulatory compliance claims
- CE, CRA, MDR, or machine-safety certification claims

### Phase 3 closeout gates

Phase 3 closeout requires:

- formatting check
- Prisma validation
- package typechecks
- package lint
- package builds
- Turbo typecheck
- Turbo lint
- Turbo build
- smoke checks
- real two-organization product-record isolation test
- docs updated honestly
- clean git status before push

### Phase 3 Lean/no-compromise rule

Phase 3 follows the same rule that closed Phase 2:

- decide before implementing
- schema before endpoint
- endpoint before UI
- root-cause fixes before workaround patches
- no silent roadmap drift
- no fake production behavior
- no tenant boundary assumptions without proof

### Placeholder-only pages

Phase 1 pages are intentionally placeholder-only.

Reason:

- the roadmap requires the shell routes to exist
- real product workflows belong to later phases
- placeholder pages prevent accidental fake data, fake metrics, or fake security behavior

### Compliance wording

BuildTrace must be framed as evidence readiness and documentation organization.

It must not claim to guarantee:

- legal compliance
- CE compliance
- Machinery Regulation compliance
- CRA compliance
- safety compliance
- safety certification
- regulatory approval

Allowed safer wording includes:

- evidence readiness
- documentation organization
- secure-by-default direction
- customer-visible files
- private engineering docs
- regulatory outcomes
- review outcomes
- approval outcomes

## Security decisions

### Secrets

No hardcoded secrets.

Use `.env.example` placeholders only.

Real `.env` files stay ignored by Git.

### File defaults

Uploaded documents are private by default in the product design.

PLC, HMI, CAD, and electrical files default to sensitive-engineering.

Customer-visible access must be explicitly selected.

### Storage

Future storage buckets must not be public.

Downloads must use signed temporary URLs.

### storagePath never returned to web clients for software versions

Decision:

- Software version API responses must never return raw `storagePath` values to web clients.
- The API returns `hasFile: boolean` instead.
- Signed URLs are issued on demand through a separate authenticated endpoint.

Reason:

- Raw storage paths expose internal bucket structure and could be used to construct unauthorized access attempts.
- The signed URL flow follows the same pattern as document downloads.

### Phase 1 security boundary

Phase 1 added visible secure-by-default positioning, but no real enforcement.

Reason:

- auth, tenant isolation, RBAC, storage, signed URLs, QR access, and audit logs belong to later phases
- visible security positioning should not be confused with implemented backend security controls

### Phase 2 security priority

Phase 2 must start the real security foundation.

Priority:

- authentication
- organization boundary
- tenant isolation
- role foundation
- activity log foundation
- secure environment variable setup

Reason:

- future machine, document, QR, ticket, and export workflows depend on correct tenant/security foundations

### Phase 2 trust-foundation slice

Phase 2 must start with the smallest load-bearing database, auth, and tenancy foundation.

The first implementation slice should focus on:

- organizations
- users
- activity log

Reason:

- tenant isolation must exist before machine, document, ticket, QR, export, or customer workflows
- authentication must map to an internal app user before product data is connected
- activity logging must exist before sensitive workflows are introduced
- building every future product table in Phase 2 would violate phase ownership and create inventory waste

Deferred to owning roadmap phases:

- machine records belong to Phase 3
- customer records belong to Phase 3
- document upload and storage belong to Phase 4
- document classification belongs to Phase 5
- handover completeness and export belong to Phase 6
- QR customer portal belongs to Phase 7
- tickets belong to Phase 8
- software timeline belongs to Phase 9
- spare parts and quotes belong to Phase 10
- feedback belongs to Phase 11

### Phase 2 tenant isolation model

Use application-layer tenant guards as the first implemented enforcement layer.

Target defense-in-depth may include database row-level security later, but BuildTrace must not claim RLS is implemented until it is actually configured and tested with the chosen Prisma/Supabase setup.

Reason:

- the API must reliably resolve the current authenticated user
- every organization-scoped query must be constrained by organization ID
- future data workflows depend on this boundary being correct
- claiming untested RLS would weaken product trust

### Phase 2 auth-to-user mapping

Use an internal BuildTrace user ID and store the external Supabase identity as a unique `auth_user_id`.

Reason:

- internal app records should not be tightly coupled to Supabase internal auth table structure
- migrations can run against disposable PostgreSQL without depending on Supabase auth schema
- provider-independent migrations are easier to test from zero
- `auth_user_id` still allows reliable mapping from authenticated JWT identity to app user

### Phase 2 auth boundary

The approved auth boundary is:

- web app uses the Supabase anon key for login
- web app receives a user JWT
- web app sends the JWT to the API
- API verifies the JWT
- API maps `auth_user_id` to the internal user record
- API resolves the user organization
- API applies tenant guards before returning organization-scoped data

Service-role secrets must live only in the server/API boundary.

Service-role secrets must never be exposed in `apps/web`.

Reason:

- frontend code must not contain privileged backend credentials
- the API must own trusted tenant resolution
- secrets-boundary checks need a clear expected architecture

### Phase 2 Prisma and Turbo pipeline

When Prisma is added, Prisma client generation must be wired into the workspace task pipeline.

The generated Prisma client must exist before any package that imports database types or client code runs typecheck or build.

Reason:

- cold clones must pass gates
- CI must not depend on a warm local generated client
- Turbo caching must not hide missing generation steps

Decision:

- configure Prisma generation as part of the database package workflow
- ensure dependent typecheck/build tasks run after the required database generation step
- do not commit generated Prisma client output unless a separate documented decision approves it

### Phase 2 enum drift prevention

If Prisma schema enums mirror constants from `packages/shared`, add an immediate drift check when the mirror is introduced.

Reason:

- duplicated enum declarations can drift
- locale drift was already removed by making `packages/shared` the canonical locale source
- database enum mirrors should not recreate the same two-source-of-truth problem

Decision:

- shared TypeScript constants remain the app-facing source where possible
- Prisma may mirror database-required enums
- mirrored enum values must be checked by an automated test or script in the same implementation slice that creates the mirror

### Phase 2 migration-from-zero rule

Database migrations must be tested from zero against a disposable PostgreSQL database before being treated as valid.

Do not use the live Supabase project as the only migration validation target.

Reason:

- migration correctness should be reproducible
- CI and local validation should not require production-like Supabase credentials
- Supabase is PostgreSQL, so provider-independent migrations should apply cleanly to disposable PostgreSQL first

### Phase 2 activity log model

Activity logs should be append-only.

Activity log records should not be silently edited after creation.

Activity logs must not store:

- secrets
- passwords
- tokens
- signed URLs
- uploaded file contents
- sensitive engineering file contents
- unnecessary personal data

Initial activity logging may include security-relevant request metadata only when justified.

If IP address or user agent is stored, data-protection docs must define the reason and retention expectation.

Reason:

- audit history must be trustworthy
- logs must support security review without becoming a sensitive data dump
- BuildTrace's EU/data-protection positioning requires discipline around personal data

### Phase 2 membership-scoped organization roles

Use an `OrganizationMembership` join table with membership-scoped `OWNER`, `ADMIN`, and `MEMBER` roles for the Phase 2 trust foundation.

This replaces the earlier sketch of a single `users.organization_id` relationship and global user role.

Reason:

- organization access is scoped to the user's membership in a specific organization
- the model avoids a future schema redesign if an operator belongs to more than one organization
- Phase 2 needs a small, durable authorization foundation, not product-workflow-specific RBAC
- product-specific roles such as engineer, service manager, sales, and customer viewer should be introduced or mapped when their owning workflows exist
- adding detailed product roles before the workflows exist would create fake precision and inventory waste

Decision:

- Phase 2 uses generic organization roles: `OWNER`, `ADMIN`, and `MEMBER`
- detailed product permissions are deferred to the phases that introduce the workflows they protect
- future RBAC work must document how product permissions map to organization membership roles

### Phase 2 activity-log actor typing

Phase 2 activity logs use nullable `actor_user_id` for authenticated internal app users.

The earlier Step 0 sketch included `actor_type`, but Phase 2 does not add an `actor_type` column yet.

Reason:

- the only implemented actor in Phase 2 is an authenticated internal app user
- QR portal actors, customer-viewer actors, and system/worker actors do not have real logging call sites yet
- adding actor typing before those actors exist would create unused schema surface
- unused schema surface is inventory waste under the Lean quality rule

Decision:

- do not fake non-user actors as `AppUser` records
- do not claim system, QR, or customer-portal actor attribution until the schema supports it
- add a documented `ActorType` enum and migration when the first non-`AppUser` activity-log producer is implemented
- likely trigger phases include QR customer portal, worker/system events, and customer-visible access workflows

### Phase 2 audit-log deletion posture

Activity logs are tenant-owned records.

In Phase 2, deleting an organization cascades to its activity logs.

Reason:

- the beta foundation does not yet include legal hold, retention overrides, or anonymized audit retention workflows
- organization deletion should remove tenant-owned personal and operational metadata unless a later retention policy says otherwise
- keeping orphaned audit logs without a designed retention policy would weaken data-minimization discipline

Decision:

- organization deletion cascades to activity logs for the current beta foundation
- before adding production organization deletion workflows, revisit whether audit logs should be retained, anonymized, exported, or deleted
- if retention requirements are introduced, update the schema, deletion workflow, and data-protection documentation in the same implementation slice

## I18N decisions

Supported locales from day one:

- en
- cs
- sk
- pl
- de
- fr
- es

Root route redirects to `/en`.

Unsupported locale routes should return not found.

Language switcher labels must come from translation messages, not hardcoded component text.

Current Phase 1 i18n shell uses:

- shared `locales`
- translated labels in all 7 message JSON files
- `appMessages` export from `packages/i18n`
- translated navigation
- translated footer links
- translated landing copy
- translated page-shell copy
- translated dashboard/login/settings placeholder copy
- translated machine detail shell copy

Uploaded technical documents are not automatically translated in beta.

## Workflow decisions

### Manual-review workflow

Use manual-review workflow by default for implementation work.

Default process:

1. Generate proposed code or patch.
2. Review the proposal before applying.
3. Apply approved code manually in VS Code.
4. Run verification gates in PowerShell.
5. Inspect changed files.
6. Commit only after clean verification.

Reason:

- prevents agent-driven edits from bypassing review
- keeps quality control with the project owner
- reduces risk of accidental scope expansion

Agent direct-edit mode can be used only when explicitly approved for that step.

### Conversation versus engineering step size

Conversation steps should remain one action at a time.

Engineering steps should be meaningful small slices, not microscopic changes that create excessive documentation and commit overhead.

Reason:

- keeps the user workflow manageable
- avoids wasting time on tiny commits
- preserves quality without slowing the project unnecessarily

## Quality decisions

### Stop-the-line quality rule

Do not ignore warnings or errors.

Every warning or error must have one of these outcomes:

1. fixed in code/config/docs
2. documented as intentional generated-file/tooling behavior
3. blocked until understood

No moving forward while an unexplained warning remains.

### Root-cause rule

Prefer root-cause fixes over workarounds.

Reason:

- the product quality bar is production-grade
- temporary fixes create future rework
- tooling, build, CSS, type, and route problems should be understood before moving forward

### Stable React keys

Do not use translated visible UI text as React keys.

Use stable internal IDs instead.

Reason:

- translations can change
- translations can collide across languages
- React keys are technical identifiers, not display labels

### Formatting rule for manual doc edits

Manual Markdown edits often need Prettier formatting.

After manually editing a doc, run:

- `pnpm.cmd exec prettier --write <changed-doc-file>`
- `pnpm.cmd format:check`

Reason:

- avoids committing documentation that fails formatting gates
- prevents repeating the `docs/project-state.md` formatting mistake

### next-env.d.ts policy

`apps/web/next-env.d.ts` is currently tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Decision:

- do not remove `apps/web/next-env.d.ts` from Git tracking without a separate documented decision
- do not commit dev-server drift in `apps/web/next-env.d.ts`
- before committing, run `pnpm.cmd build`
- verify `git status --short` does not show `apps/web/next-env.d.ts`

Reason:

- the dev/build toggle is generated framework behavior
- the tracked build-safe state is restored by `pnpm.cmd build`
- we should not hide this by blindly removing the file from Git tracking

### Generated framework files

Generated framework/build outputs are excluded from formatting and linting checks where appropriate.

This includes:

- `.next` output
- `dist` output
- `.turbo` output
- coverage output
- TypeScript build info files

Reason:

- these files are generated or rewritten by tools such as Next.js, Turbo, and test/build systems
- they are not hand-authored product source code
- repeatedly formatting generated files creates rework without improving product quality

Quality rule:

- human-authored source, config, docs, and package files must pass formatting, linting, typecheck, and build verification
- generated framework/build artifacts must not be used to hide real source-code defects

## Rejected alternatives

### Single Next.js app only

Rejected.

Reason:

- would mix web, API, jobs, database, and shared logic too early
- not suitable for the planned SaaS architecture

### Public storage buckets

Rejected.

Reason:

- conflicts with secure-by-default product positioning

### Hardcoded UI text

Rejected.

Reason:

- multilingual support is a beta requirement from day one

### Building product features in Phase 0

Rejected.

Reason:

- Phase 0 had to stay focused on foundation and security docs

### Building backend product features in Phase 1

Rejected.

Reason:

- Phase 1 was scoped to industrial UI shell and multilingual UI skeleton
- backend/auth/database/storage/QR/ticket/CRUD work belongs to later phases

### Fake dashboard data or fake operational metrics

Rejected.

Reason:

- placeholder UI must not imply real data exists
- fake metrics weaken product trust
- real data starts after database/auth/workflow phases are implemented

### Removing next-env.d.ts from Git without investigation

Rejected for now.

Reason:

- the dev/build drift was investigated
- `pnpm.cmd build` restores the tracked state
- removing it from Git tracking is a separate project policy decision, not an automatic fix

### Treating missing CSS as a cosmetic issue

Rejected.

Reason:

- the plain HTML browser result was caused by missing/incomplete Tailwind/PostCSS wiring
- the correct fix was to wire the CSS pipeline, not ignore the visual failure

### Single main landmark ownership

Keep `AppShell` as the single owner of the rendered page `<main>` landmark.

Child page components and shared page-shell components should use non-landmark wrappers such as `<div>`.

Reason:

- prevents invalid nested `<main>` landmarks
- improves accessibility semantics
- gives screen readers a single main page landmark
- keeps layout ownership clear

### Next.js App Router lint boundary

Disable `@next/next/no-html-link-for-pages`.

Reason:

- BuildTrace uses the Next.js App Router, not the legacy Pages Router
- the rule expects a `pages` directory and can emit irrelevant warnings for App Router projects
- route links still use Next.js `Link` where appropriate
- the rest of the Next.js lint rules remain enabled

### Native dependency build approvals

Record trusted native dependency build approvals in `pnpm-workspace.yaml`.

Approved native build dependencies:

- `esbuild`
- `sharp`

Reason:

- pnpm blocks dependency build scripts unless approved
- `esbuild` is part of the JavaScript tooling chain
- `sharp` is a normal native dependency used by Next.js image tooling
- approvals should be explicit and source-controlled instead of relying on local machine state

### Canonical locale source

Use `packages/shared` as the canonical owner of supported locale constants.

`packages/i18n` should import and re-export the shared locale source instead of duplicating its own locale array.

Reason:

- prevents locale-list drift
- gives shared constants a real cross-package role
- keeps locale support consistent across app, i18n, and future backend code

### next-intl dependency

Remove `next-intl` until BuildTrace intentionally adopts it.

Reason:

- Phase 1 currently uses a simple internal `appMessages` i18n foundation
- `next-intl` was installed but unused
- unused dependencies are inventory waste
- keeping an unused i18n dependency implies an architecture the app has not implemented

Decision:

- remove `next-intl` for now
- re-add it later only if a future i18n implementation step intentionally adopts it

### Phase 3 typed machine-record copy modules

Approved with guardrails.

Decision:

- Phase 3 machine-record page/form copy may remain in typed web-local copy modules for now.
- This is not approval to spread arbitrary product copy across app files.
- The approved modules are:
  - `apps/web/src/machine-records-page-copy.ts`
  - `apps/web/src/machine-records-create-copy.ts`
- The pattern must stay narrow until the project intentionally adopts a broader i18n architecture.

Reason:

- Phase 3 needed structured, typed copy for machine-record readiness, create forms, status labels, field labels, and action messages.
- The copy is already translated across the supported locales.
- Moving it into JSON message files during closeout would be a larger migration than the cleanup slice needs.
- Leaving it undocumented would create a second silent i18n system.

Guardrail:

- `apps/web/src/machine-records-copy-smoke-check.ts` verifies every supported locale exists and the copy object shape stays aligned across locales.
- `@buildtrace/web` exposes this as `pnpm.cmd --filter @buildtrace/web run machine-records:copy-smoke`.
- Future Phase 4 screens must not copy this pattern by default.
- A later i18n consolidation may move this copy into `packages/i18n/messages/*.json` if that becomes the canonical product-copy mechanism.

Rejected alternatives:

- leaving the typed copy modules undocumented
- adding more web-local copy modules without a decision
- pretending typed copy modules are the same as the existing JSON message-file system

### Phase 4 document upload security boundary

Approved.

Decision:

- Phase 4 document uploads must use private Supabase Storage only.
- BuildTrace must not create or depend on public storage buckets.
- Document storage buckets must remain private.
- Raw private storage paths must not be exposed as public browser URLs.
- Downloads must be served through signed temporary URLs.
- Signed URL lifetime must use `SIGNED_URL_TTL_SECONDS`.
- The API must log signed URL issuance honestly as `document.download_url_issued`.
- Phase 4 must not claim that a browser download happened unless the file bytes are proxied through the API.
- `lastDownloadedAt` may only mean the last signed URL issue time unless a later phase adds observable download proxying.
- Every document metadata row must belong to exactly one `organizationId`.
- Every document metadata row must be tied to a machine inside the same organization.
- Document helpers and API endpoints must reject cross-organization machine/document access.
- The first implementation test for documents must prove two-organization isolation for both database document access and signed URL issuance.
- Organization B must not be able to list, read, update, or mint a signed URL for Organization A's document or storage path.
- Uploaded documents default to `visible_to_customer = false`.
- Uploaded documents default to `visibility_level = internal`.
- Phase 4 document visibility values are limited to:
  - `customer-visible`
  - `internal`
  - `sensitive-engineering`
  - `restricted`
- The shared `public` visibility value must not be selectable for Phase 4 documents.
- If `public` remains in shared constants for future non-document product areas, document-specific code must explicitly exclude it.
- Prisma document visibility enums may use SCREAMING_SNAKE values, but they must map to shared kebab-case product values through a deliberate mapping.
- The schema/constants slice must include a drift check that proves shared document visibility/category values and Prisma enum values stay aligned after normalization.
- PLC, HMI, CAD, electrical drawings, software/project files, and other engineering-sensitive files must not become customer-visible by default.
- Phase 4 manual category assignment must apply the conservative default:
  - PLC documents default to `sensitive-engineering`
  - HMI documents default to `sensitive-engineering`
  - CAD documents default to `sensitive-engineering`
  - electrical drawing documents default to `sensitive-engineering`
  - other documents default to `internal`
- Customer-visible access must be an explicit builder action after upload.
- Document upload, category change, visibility change, and signed URL issuance must be activity-logged.
- Document rows must store language metadata separately from UI locale.
- Document category names are product enums and must be displayed through localized labels.
- Phase 4 uploads must stream through the NestJS API before reaching Supabase Storage.
- The API must enforce file validation before storage write:
  - maximum file size
  - allowed MIME/extension list
  - safe filename normalization
  - no path traversal
  - no empty filenames
- Storage paths must embed the tenant and machine boundary:
  - `organizations/{organizationId}/machines/{machineId}/documents/{documentId}/{safeFileName}`
- Phase 4 must use a file-then-row consistency rule:
  - write the private storage object first
  - write the document metadata row second
  - if metadata creation fails, delete the just-uploaded storage object
  - do not leave a metadata row pointing at a missing file
- AI document classification is not part of Phase 4.
- QR portal document access is not part of Phase 4.
- Handover completeness/export is not part of Phase 4.

Reason:

- Phase 4 is the first phase where BuildTrace stores the sensitive payload the product exists to protect.
- The roadmap requires private buckets, signed temporary URLs, internal-by-default visibility, document language metadata, localized categories, and audit logs.
- The instructions explicitly say uploaded files are private by default and customer-visible files must be selected intentionally.
- PLC, HMI, CAD, and electrical files can contain sensitive engineering data and must not leak through default behavior.
- The roadmap's Phase 4 document visibility scope does not include public document access.
- The existing shared `public` visibility value must not silently enter the Phase 4 document model.
- Organization-level tenant isolation from Phase 3 must carry forward into every document query, upload, metadata update, and signed URL request.
- Signed URLs shift file delivery to Supabase Storage, so the honest audit event is signed URL issuance, not confirmed file download.
- Storage and PostgreSQL are two systems, so Phase 4 needs an explicit cleanup rule for partial upload failures.
- API-mediated upload is the simplest secure Phase 4 path because the API can validate file type, file size, file name, organization access, and machine ownership before writing to private storage.

Rejected alternatives:

- public storage bucket with obscure file paths
- exposing Supabase storage paths directly to the browser
- making uploaded documents customer-visible by default
- silently allowing `public` as a Phase 4 document visibility level
- allowing document metadata without `organizationId`
- allowing a document to link to a machine from another organization
- allowing Organization B to mint signed URLs for Organization A storage paths
- claiming file downloads were observed when only signed URLs were issued
- direct browser-to-Supabase upload in Phase 4
- leaving uploaded objects orphaned when metadata creation fails
- adding upload UI before storage, metadata, tenant isolation, validation, consistency, and signed URL rules are locked
- adding AI classification in Phase 4
- adding QR document access in Phase 4

### Phase 5 document classification boundary

Approved.

Decision:

- Phase 5 document classification is suggestion-only.
- The classifier must never auto-apply a category.
- The classifier must never change `visibility_level`.
- The classifier must never change `visible_to_customer`.
- The classifier must never expose raw private storage paths.
- Phase 5 must not send uploaded files to external model-training paths.
- Phase 5 must not add AI classification, OCR, PDF text extraction, semantic PLC/HMI parsing, vector search, or worker-queue processing.
- Existing builder-controlled `category` remains the effective document category.
- New classification metadata is advisory:
  - `suggestedCategory`
  - `classificationConfidence`
  - `classificationStatus`
  - `classificationSource`
- `suggestedCategory` is nullable.
- `classificationConfidence` is nullable and uses an integer `0-100` scale.
- The needs-review threshold is a named shared constant.
- The initial needs-review threshold is `70`.
- Classification status values are:
  - `unclassified`
  - `classified`
  - `needs-review`
  - `manually-confirmed`
- Classification source values are:
  - `filename-type`
  - `manual`
- New classification status/source enums must ship with shared-vs-Prisma drift checks in the same implementation slice.

Backfill rule:

- Existing Phase 4 documents must not be classified inside a Prisma migration.
- Existing documents start as `unclassified`.
- Existing documents have `suggestedCategory = null`.
- Existing documents have `classificationConfidence = null`.
- Classification runs on new upload or through an explicit builder action.

Classifier rule:

- The first classifier is deterministic and filename/type based only.
- It may use:
  - normalized file name
  - extension
  - MIME type
  - small keyword sets across supported locales
- Matching must normalize casing.
- Matching must fold or strip diacritics before keyword comparison.
- The classifier may suggest only existing document categories.
- Exact high-signal keyword plus compatible extension/MIME should produce high confidence.
- Extension/MIME-only matches should produce medium confidence.
- Weak keyword-only matches should produce lower confidence.
- No useful match should produce `unclassified` or `needs-review`, depending on whether classification was attempted.
- Ambiguous matches must produce `needs-review` instead of guessing.
- Conservative handling is required for PLC, HMI, CAD, electrical drawings, and other sensitive engineering files.

Apply-suggestion rule:

- Applying a suggested category is an explicit builder action.
- Applying a suggested category is treated as a category update.
- Because category updates apply the category default visibility, the UI must warn or show that applying a suggestion may apply the category default visibility.
- Applying a suggestion must not create a customer-visible state without explicit builder confirmation.
- The classifier itself must never make that decision.

Status lifecycle:

- Legal lifecycle:
  - `unclassified` -> `classified`
  - `unclassified` -> `needs-review`
  - `classified` -> `manually-confirmed`
  - `needs-review` -> `manually-confirmed`
- Once a builder manually confirms or corrects a document category, classifier reruns must not downgrade `classificationStatus`.
- A later classifier rerun may update advisory suggestion metadata only if it does not replace the builder-controlled category and does not downgrade manual confirmation.

Audit rule:

- Accepting a suggested category must be activity-logged as `document.classification_confirmed`.
- Manually correcting a category away from the suggestion remains a document category change and must be activity-logged through the category-change path.
- Manual classification actions must remain organization-scoped and document-scoped.

UI rule:

- `unclassified` should be visually quiet.
- `needs-review` should be visibly actionable.
- UI must display internal category enums through localized labels.
- Uploaded document language metadata remains separate from UI locale.

Reason:

- Phase 5 exists to organize document dumps without weakening Phase 4's private-by-default security boundary.
- The roadmap requires filename/type classification, confidence, manual correction, and needs-review state.
- The roadmap says AI is optional later, so Phase 5 must not introduce external model processing now.
- The instructions say uploaded files must not be used for external model training.
- BuildTrace is a multi-tenant document product; classification must never widen access, expose storage paths, or bypass organization checks.
- Suggestion-only preserves the builder as the decision-maker.
- Separating advisory classification metadata from the effective category keeps automation from silently changing customer exposure.
- `unclassified` and `needs-review` represent different builder states and must not be collapsed.
- A deterministic multilingual keyword set is lean enough to serve EU users without adding NLP or translation infrastructure.
- Drift checks keep shared constants, Prisma enums, and UI/API behavior aligned.

Rejected alternatives:

- auto-applying high-confidence categories
- letting classifier update document visibility
- treating old documents as `needs-review` without running classification
- running classifier logic inside a Prisma migration
- using AI, OCR, PDF text extraction, vector search, or worker queues in Phase 5
- exposing raw storage paths to classification UI or API clients
- English-only keyword matching without documenting the limitation
- guessing when multiple categories match
- letting classifier reruns downgrade manual builder decisions

### Phase 6 handover completeness and export boundary

Approved with mandatory preconditions after external plan review.

Decision:

- Phase 6 begins with customer-handover completeness, not export generation.
- Completeness is computed dynamically from current document metadata and is not persisted.
- The versioned beta checklist is `customer-handover-beta-v1`.
- Required categories are:
  - `manuals`
  - `safety-instructions`
  - `spare-parts-bom`
  - `certificates`
- Optional categories do not affect the beta-v1 percentage.
- Each required category counts at most once.
- Only the builder-controlled effective `category` counts.
- `suggestedCategory` never satisfies a checklist requirement.
- The checklist must never be empty.
- Percentage uses deterministic floor calculation and reaches 100 only when every requirement is satisfied.

Customer-export eligibility:

- A document is eligible only when `visibilityLevel === 'customer-visible'`.
- `visibleToCustomer` must also be `true` as an invariant guard.
- Any disagreement between those fields fails closed and excludes the document.
- `internal`, `sensitive-engineering`, and `restricted` documents are never customer-exportable.
- Eligibility is enforced server-side through authenticated organization and machine scope.
- Raw storage paths are never exposed through completeness/export responses.

Localization correction:

- Current document category, visibility, classification status, and classification source labels are hardcoded English in the machine-detail component.
- Existing docs must not claim these labels are already localized.
- Before Phase 6 UI work, labels must be centralized in `packages/i18n` for every supported locale.
- The machine-detail document UI must consume the centralized labels instead of component-local English maps.
- Phase 6 completeness UI must use the same localized labels.
- Phase 6 PDF summaries must be generated in an explicitly selected supported locale.
- Unsupported locales must fail validation or use the project-approved fallback.
- PDF headings, checklist labels, visibility labels, status labels, and warnings must be localized.

Export time-of-check/time-of-use rule:

- An export manifest is not sufficient authorization by itself.
- At ZIP/PDF packaging time, every included document must be re-read from current tenant-scoped database state.
- Category, visibility, customer exposure, storage reference, and checksum must be revalidated.
- If any document is missing, changed incompatibly, cross-tenant, or no longer eligible, export generation fails closed.
- No partially authorized customer package may be created.

Export boundary:

- Export artifacts remain private.
- Download links are temporary signed URLs.
- ZIP paths and filenames must prevent traversal and collisions.
- Export history records organization, machine, actor, audience, checklist version, manifest, creation time, and result.
- Export creation and signed URL issuance use typed activity-log actions.
- PDF and ZIP generation remain separate implementation slices.

Implementation order:

1. shared checklist constants and pure completeness evaluator
2. focused completeness/security tests
3. tenant-scoped DB and API boundary
4. centralized i18n document labels
5. machine-detail completeness UI and browser verification
6. export manifest/history boundary
7. ZIP export with packaging-time eligibility recheck
8. localized PDF summary
9. final browser, ZIP-content, PDF-visual, and docs verification

Rejected alternatives:

- counting suggested categories
- persisting a percentage that can become stale
- customer export based only on UI filtering
- trusting an old manifest without packaging-time revalidation
- exporting internal or sensitive-engineering documents
- duplicating English category labels in Phase 6 UI/PDF
- public export storage
- permanent download URLs
- combining ZIP/PDF/export-history work into the first slice

### MEMBER role used for QR token read/assign instead of ENGINEER

Decision:

- Use the existing `MEMBER` role for QR token read and assign endpoints.
- Keep QR token rotate and disable operations restricted to `OWNER` and `ADMIN`.

Reason:

- `ENGINEER` does not exist in the current schema.
- `MEMBER` is the closest available role.
- An `ENGINEER` role may be added in a future phase if the role model is extended.

### FileInterceptor replaced with Fastify native multipart for ticket attachments

Decision:

- Use Fastify native multipart handling for ticket comment attachments.
- Do not use NestJS `FileInterceptor` from `@nestjs/platform-express` while the API runs on `FastifyAdapter`.

Reason:

- NestJS `FileInterceptor` from `@nestjs/platform-express` is officially incompatible with `FastifyAdapter`.
- Fastify native multipart handling provides the required private attachment upload boundary without introducing an incompatible Express upload stack.
- This is consistent with the existing document upload implementation.
