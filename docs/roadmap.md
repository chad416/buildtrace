# BuildTrace Roadmap

## Product

BuildTrace Beta is a secure, multilingual machine handover and service portal for SME machine builders, automation integrators, and OEMs.

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

Status: in progress.

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

### Phase 1 — Industrial UI shell + multilingual UI skeleton

Completion: 12% of beta.

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

### Phase 2 — Database + auth + tenancy

Completion: 22% of beta.

Scope:

- Supabase Auth
- PostgreSQL
- Prisma schema
- organization workspace logic
- tenant isolation
- RBAC foundation
- activity log foundation

### Phase 3 — Machine records

Completion: 32% of beta.

Scope:

- customers CRUD
- machine models CRUD
- machines CRUD
- machine detail page
- machine create/edit logging

### Phase 4 — Document dump upload

Completion: 45% of beta.

Scope:

- private file upload
- document metadata
- manual category assignment
- document language metadata
- signed download URLs
- customer visibility controls

### Phase 5 — Document classification

Completion: 55% of beta.

Scope:

- filename/type classifier
- confidence score
- manual correction
- needs-review state
- security defaults preserved

### Phase 6 — Handover completeness + export

Completion: 65% of beta.

Scope:

- required checklist
- completeness percentage
- missing document list
- ZIP export
- PDF summary export
- expiring export links
- sensitive-file warning

### Phase 7 — QR customer portal

Completion: 73% of beta.

Scope:

- QR token
- customer portal
- customer-visible documents only
- browser language detection
- language switcher
- portal access logs
- optional PIN/password

### Phase 8 — Service tickets + support session

Completion: 81% of beta.

Scope:

- ticket creation from QR portal
- builder ticket dashboard
- comments
- attachments
- support meeting link
- internal notes hidden from customer

### Phase 9 — Software version timeline

Completion: 88% of beta.

Scope:

- PLC/HMI/software version upload
- delivered version marker
- current known version marker
- checksum
- no silent overwrite
- sensitive-engineering default

### Phase 10 — Spare parts intelligence + quote tracking

Completion: 95% of beta.

Scope:

- manual spare parts list
- basic extraction from BOM/manual text where possible
- critical/recommended/optional
- quote request
- quote sent
- approval/rejection
- internal cost hidden from customer

### Phase 11 — Feedback, audit log, polish, deployment

Completion: 100% of beta.

Scope:

- private feedback
- activity log dashboard
- demo data
- production deployment
- monitoring
- backup/export plan
- security polish
- final access-control checklist

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
