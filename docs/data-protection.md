# BuildTrace Data Protection

## Current phase

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Current full beta roadmap completion:

- 12%

Next phase:

- Phase 2 - Database + auth + tenancy

## EU hosting intent

BuildTrace Beta targets EU-hosted infrastructure where possible.

Target services:

- Supabase EU region for database, auth, and private storage
- EU-friendly hosting for API and worker
- EU-friendly monitoring and analytics setup where possible

No production hosting has been implemented yet.

## Data ownership

Customer data belongs to the builder organization using BuildTrace.

BuildTrace should store and organize machine records, uploaded documents, tickets, quotes, software-version metadata, spare-part metadata, feedback, exports, and activity logs.

Current implementation does not yet store real customer, machine, document, ticket, quote, feedback, or activity-log data.

## Current implementation status

Phase 0 created the data-protection documentation foundation.

Phase 1 added visible data-protection and secure-by-default positioning in the translated UI shell.

Phase 1 added:

- translated privacy/security/data-protection landing sections
- translated footer links to privacy/security/data-protection sections
- translated settings placeholders for future role, language, MFA, data export, and security logs
- translated wording around evidence readiness, documentation organization, customer-visible files, and private engineering docs

Phase 1 did not add:

- database
- auth
- real data storage
- customer accounts
- customer records
- machine records
- document upload
- private storage
- QR portal
- tickets backend
- export/delete workflows
- audit log table
- analytics
- production privacy policy

## Privacy-by-design rules

BuildTrace should collect only data needed for machine handover, service, documentation organization, and version traceability.

Uploaded technical files are not public by default.

Customer portal users should only access explicitly customer-visible files.

Internal notes must stay hidden from customers.

Sensitive engineering files must not be exposed through QR by default.

## AI data handling rule

Uploaded documents must not be used for external AI model training.

Any future AI classification must not override security defaults.

AI suggestions must require builder review when confidence is low.

AI suggestions must not automatically make files customer-visible.

## Export and delete policy target

Later phases must support:

- machine record export
- handover package export
- expiring export links
- archive/delete workflow
- data portability for builder-owned records

These are not implemented yet.

## Logging rules

Analytics must not capture uploaded document contents.

Error logs must not expose file contents, secrets, signed URLs, or sensitive engineering data.

Activity logs should track major actions without storing unnecessary personal data.

Activity logging is not implemented yet.

## Phase 2 data-protection focus

Phase 2 should begin the real data-protection foundation through:

- Supabase Auth
- PostgreSQL
- Prisma schema
- organization workspace logic
- tenant isolation
- RBAC foundation
- activity log table
- login event logging
- secure environment variable setup

Phase 2 should not start document storage, QR portal access, ticket workflows, or machine CRUD unless explicitly scoped.

## Known current gaps

Current implementation does not yet include:

- database
- real data storage
- auth
- tenant isolation
- RBAC
- customer data export
- deletion workflow
- audit log table
- private storage
- signed URLs
- production privacy policy
- monitoring/analytics privacy configuration

These are planned for later phases.

They are known roadmap boundaries, not hidden defects.

## Compliance and privacy wording boundary

BuildTrace should be described as supporting evidence readiness and documentation organization.

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
