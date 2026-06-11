# BuildTrace Roadmap

## Product

BuildTrace Beta is a secure, multilingual machine handover and service portal for SME machine builders, automation integrators, and OEMs.

## Current roadmap status

Phase 0 is complete.

Phase 1 is complete.

Phase 2 is complete.

Current full beta roadmap completion:

- 22%

Current next phase:

- Phase 3 - Machine/customer records foundation

Latest completed Phase 2 implementation commit:

- `ec2b2f1 test(db): add activity log smoke check`

## Beta scope

The beta must cover:

- builder workspace
- machine records
- customer records
- machine model records
- document upload and categorization
- handover completeness
- secure export
- QR customer portal
- service tickets
- support session helper
- software version timeline
- spare parts intelligence
- quote/request/approval tracking
- private feedback
- activity log
- demo data

## Phase roadmap

### Phase 0 - Professional project foundation + security docs

Completion: 5% of beta.

Status: complete.

Scope:

- pnpm monorepo
- Turborepo
- apps/web
- apps/api
- apps/worker
- packages/db
- packages/shared
- packages/i18n
- packages/ui
- TypeScript strict mode
- ESLint
- Prettier
- README
- .env.example
- multilingual base
- security docs
- data-protection docs
- data-classification docs

Exit condition:

- web app runs
- API runs
- worker placeholder runs
- locale routes exist
- security documents exist

Result:

- passed

### Phase 1 - Industrial UI shell + multilingual UI skeleton

Completion: 12% of beta.

Status: complete.

Scope:

- landing page
- login page shell
- dashboard shell
- machines page shell
- machine detail shell
- documents page shell
- tickets page shell
- spare parts page shell
- feedback page shell
- settings page shell
- translated navigation
- language switcher
- no hardcoded user-facing text
- Security & Data Protection landing page section
- privacy/security footer links
- settings placeholders for:
  - user role
  - preferred language
  - future MFA
  - data export
  - security logs

Exit condition:

- user can click through serious industrial UI
- language switching works
- product already communicates secure-by-default positioning

Result:

- passed

Phase 1 completed:

- translated app shell/header/footer
- language switcher for en, cs, sk, pl, de, fr, es
- active navigation with `aria-current="page"`
- translated landing page polish
- translated placeholder pages
- translated dashboard placeholder cards
- translated login placeholder shell
- translated settings placeholder sections
- translated machine detail placeholder route
- Tailwind/PostCSS CSS pipeline fix so the app renders as styled UI, not plain HTML

Phase 1 intentionally did not add:

- auth
- database
- storage
- QR portal
- ticket backend
- CRUD
- real dashboard data
- real machine data
- document upload
- deployment

### Phase 2 - Database + auth + tenancy

Completion: 22% of beta.

Status: complete.

Scope:

- Prisma tooling foundation
- PostgreSQL schema foundation
- organization workspace foundation
- internal app-user mapping
- membership-scoped organization roles
- API-layer tenant isolation foundation
- Supabase auth config boundary
- bearer-token verification helper
- authorization-header parser
- current-user context resolution
- authenticated tenant-context composition
- activity log foundation
- secure environment variable setup
- migration-from-zero validation
- smoke checks for auth, tenant access, and activity logging

Exit condition:

- database trust schema exists for organizations, app users, organization memberships, and activity logs
- migration applies cleanly from zero against disposable PostgreSQL
- Prisma client can be generated from a cold clone workflow
- API-side auth boundary can verify bearer tokens
- authenticated Supabase user IDs can map to internal app users
- organization-scoped tenant guards can allow/deny access by membership and role
- activity logging helper creates append-only activity records without storing secrets or file contents
- frontend service-role secret exposure is avoided
- Phase 2 does not claim RLS, protected product endpoints, or real frontend login until those are implemented

Result:

- passed

Phase 2 completed:

- Prisma tooling foundation
- Prisma schema for organizations, app users, organization memberships, and activity logs
- `OrganizationRole` enum with `OWNER`, `ADMIN`, and `MEMBER`
- initial Prisma migration committed
- migration tested from zero against disposable PostgreSQL
- generated Prisma client output ignored and regenerated through scripts
- Prisma client factory
- Supabase auth config boundary
- Supabase bearer-token verifier
- bearer authorization-header parser
- auth boundary smoke check
- API dependency on `@buildtrace/db`
- current-user resolution foundation
- tenant access guard foundation
- tenant access smoke check
- authenticated tenant-context composition helper
- activity-log helper
- activity-log smoke check
- Phase 2 project-state docs closeout
- Phase 2 decision reconciliation for membership roles, actor typing, and audit-log deletion posture
- Phase 2 security and data-protection docs update

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

Important Phase 2 decisions:

- organization access uses `OrganizationMembership`
- Phase 2 roles are `OWNER`, `ADMIN`, and `MEMBER`
- product-specific roles are deferred to the phases that introduce the workflows they protect
- activity logs use nullable `actor_user_id` for internal app users
- `actor_type` is deferred until the first non-`AppUser` actor is implemented
- organization deletion cascades to activity logs for the beta foundation
- audit-log retention must be revisited before production organization deletion workflows
- BuildTrace does not claim RLS until RLS is configured and tested

### Phase 3 - Machine/customer records foundation

Completion: 32% of beta.

Status: next.

Scope:

- customers CRUD
- machine models CRUD
- machines CRUD
- machine detail page connected to real data
- machine create/edit logging
- localized status labels
- locale date/number formatting
- machine tenant checks

Exit condition:

- builder can create machine record securely
- machine/customer records are organization-scoped
- activity log records machine creation/edit
- user cannot access another organization's machine/customer records

### Phase 4 - Document dump upload

Completion: 45% of beta.

Status: not started.

Scope:

- private file upload
- document metadata
- manual category assignment
- document language metadata
- signed download URLs
- customer visibility controls
- default visible_to_customer = false
- default visibility_level = internal
- document upload/category/visibility logs

Exit condition:

- builder uploads files securely
- files remain private unless explicitly customer-visible
- downloads use signed URLs

### Phase 5 - Document classification

Completion: 55% of beta.

Status: not started.

Scope:

- filename/type classifier
- optional AI classifier later
- confidence score
- manual correction
- needs-review state
- localized category display
- security defaults preserved
- manual override logging

Exit condition:

- document dump becomes organized
- sensitive files remain protected
- AI suggestions never override security defaults

### Phase 6 - Handover completeness + export

Completion: 65% of beta.

Status: not started.

Scope:

- required checklist
- completeness percentage
- missing document list
- ZIP export
- PDF summary export
- expiring export links
- sensitive-file warning
- export history
- private export storage
- machine-record export for data portability

Exit condition:

- builder can generate secure handover package
- sensitive exports are controlled and logged

### Phase 7 - QR customer portal

Completion: 73% of beta.

Status: not started.

Scope:

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

Exit condition:

- buyer can scan QR safely
- QR exposes only allowed files
- builder can control and audit portal access

### Phase 8 - Service tickets + support session

Completion: 81% of beta.

Status: not started.

Scope:

- ticket creation from QR portal
- builder ticket dashboard
- comments
- attachments
- support meeting link
- internal notes hidden from customer
- localized ticket statuses
- localized ticket emails
- rate-limited public ticket creation

Exit condition:

- buyer can raise ticket securely
- builder can manage ticket without exposing internal notes/files

### Phase 9 - Software version timeline

Completion: 88% of beta.

Status: not started.

Scope:

- PLC/HMI/software version upload
- delivered version marker
- current known version marker
- checksum
- no silent overwrite
- sensitive-engineering default
- localized status labels
- upload logging
- current-version change logging

Exit condition:

- builder can track delivered vs current known version securely
- sensitive software files remain protected

### Phase 10 - Spare parts intelligence + quote tracking

Completion: 95% of beta.

Status: not started.

Scope:

- manual spare parts list
- basic extraction from BOM/manual text where possible
- critical/recommended/optional
- quote request
- quote sent
- approval/rejection
- localized part categories
- localized quote statuses
- currency formatting by locale
- internal cost hidden from customer

Exit condition:

- customer can request spare/service quote securely
- builder can track approval without exposing internal pricing data

### Phase 11 - Feedback, audit log, polish, deployment

Completion: 100% of beta.

Status: not started.

Scope:

- private feedback
- activity log dashboard
- demo data
- empty states
- loading states
- error states
- production deployment
- monitoring
- backup/export plan
- security polish
- final access-control checklist

Exit condition:

- beta is professionally demoable
- secure-by-default positioning is real, not just marketing
- all core flows are protected by access control and audit logging

## Not in beta

Do not build these in beta unless explicitly re-scoped:

- predictive maintenance
- live machine data / IIoT
- supplier marketplace
- live spare-part availability
- component radar APIs
- public builder portfolio
- ROI calculator
- PLC reusable code library
- legal compliance authoring
- semantic PLC diff parser
- remote monitoring
- full billing/accounting/invoicing

## Compliance and positioning boundary

BuildTrace must be framed as evidence readiness and documentation organization.

Do not claim that BuildTrace guarantees:

- legal compliance
- CE compliance
- Machinery Regulation compliance
- CRA compliance
- safety compliance
- safety certification
- regulatory approval

Use safer wording such as:

- evidence readiness
- documentation organization
- secure-by-default direction
- customer-visible files
- private engineering docs
- regulatory outcomes
- review outcomes
- approval outcomes
