# BuildTrace Roadmap

## Product

BuildTrace Beta is a secure, multilingual machine handover and service portal for SME machine builders, automation integrators, and OEMs.

## Current roadmap status

Phase 0 is complete.

Phase 1 is complete.

Current full beta roadmap completion:

- 12%

Current next phase:

- Phase 2 - Database + auth + tenancy

Latest feature commit:

- `92a1585 feat(web): complete phase 1 shell foundation`

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

### Phase 0 — Professional project foundation + security docs

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

### Phase 1 — Industrial UI shell + multilingual UI skeleton

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

### Phase 2 — Database + auth + tenancy

Completion: 22% of beta.

Status: next.

Scope:

- Supabase Auth
- PostgreSQL
- Prisma schema
- organization workspace logic
- tenant isolation
- RBAC foundation
- activity log foundation
- user preferred language
- organization default language
- customer preferred language
- login event logging
- secure environment variable setup

Exit condition:

- logged-in builder sees only their own organization data
- core activity logging works
- unauthorized access is blocked

### Phase 3 — Machine records

Completion: 32% of beta.

Status: not started.

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
- activity log records machine creation/edit

### Phase 4 — Document dump upload

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

### Phase 5 — Document classification

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

### Phase 6 — Handover completeness + export

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

### Phase 7 — QR customer portal

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

### Phase 8 — Service tickets + support session

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

### Phase 9 — Software version timeline

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

### Phase 10 — Spare parts intelligence + quote tracking

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

### Phase 11 — Feedback, audit log, polish, deployment

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
