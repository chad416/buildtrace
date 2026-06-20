# BuildTrace Data Protection

## Current phase

Phase 5 - Document classification is complete.

Current full beta roadmap completion:

- about 55%

Next phase:

- Phase 6 - Handover completeness + export

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

Current Phase 4 implementation stores the trust-foundation schema, organization-scoped customer and machine records, document metadata, private uploaded document files, signed temporary document download URLs, and activity logs:

- organizations
- app users
- organization memberships
- activity logs

Current implementation now stores real customer records, machine records, uploaded document metadata, private uploaded document files, and signed document download activity. It does not yet store tickets, quotes, spare parts, feedback, handover exports, QR portal access, or software-version records.

## Current implementation status

Phase 0 created the data-protection documentation foundation.

Phase 1 added visible data-protection and secure-by-default positioning in the translated UI shell.

Phase 1 added:

- translated privacy/security/data-protection landing sections
- translated footer links to privacy/security/data-protection sections
- translated settings placeholders for future role, language, MFA, data export, and security logs
- translated wording around evidence readiness, documentation organization, customer-visible files, and private engineering docs

Phase 2 added:

- PostgreSQL and Prisma database foundation
- organization records
- internal app-user records
- organization membership records
- generic organization roles: `OWNER`, `ADMIN`, and `MEMBER`
- activity-log records
- migration tested from zero against disposable PostgreSQL
- API-side auth config boundary
- API-side bearer-token verification helper
- current-user resolution foundation
- tenant access guard foundation
- activity-log helper
- smoke checks for auth, tenant access, and activity logging

Phase 2 did not add:

- real frontend login flow
- mounted protected API endpoints
- real customer records
- real machine records
- document upload
- private file storage
- QR portal
- tickets backend
- export/delete workflows
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

Activity logging is implemented as a Phase 2 foundation.

The current activity-log schema can store:

- organization ID
- optional internal actor user ID
- action name
- optional target type
- optional target ID
- optional IP address
- optional user agent
- creation timestamp

Activity logs must not store:

- passwords
- secrets
- tokens
- signed URLs
- uploaded file contents
- sensitive engineering file contents
- unnecessary personal data

## Phase 2 data-protection foundation

Phase 2 began the real data-protection foundation through:

- PostgreSQL
- Prisma schema
- organization workspace foundation
- internal app-user mapping
- organization membership model
- membership-scoped organization roles
- tenant access guard foundation
- activity log table
- activity log helper
- secure environment variable boundary

Phase 2 did not start document storage, QR portal access, ticket workflows, or machine/customer CRUD.

Reason:

- tenant isolation must exist before real machine, customer, document, QR, ticket, and export workflows
- activity logging must exist before sensitive workflows are introduced
- product-specific workflows should not be created before their owning phase

## Phase 2 activity-log data handling

Phase 2 introduced activity logging for security and auditability.

Activity logs should collect only what is needed to understand important security and product actions.

Activity logs must not store:

- passwords
- secrets
- tokens
- signed URLs
- uploaded file contents
- sensitive engineering file contents
- unnecessary personal data

Security-relevant request metadata may include IP address and user agent only when justified for security review and abuse investigation.

Beta retention expectation:

- retain security audit metadata only for the beta period unless a shorter retention period is defined before production deployment
- review and formalize production retention before deployment
- do not use activity logs as a general analytics dump

Reason:

- IP address and user agent can be personal data
- BuildTrace's EU/data-protection positioning requires a written reason for storing security metadata
- logs should support auditability without becoming a sensitive data store

## Phase 2 activity-log deletion posture

Activity logs are tenant-owned records.

In Phase 2, deleting an organization cascades to its activity logs.

Reason:

- the beta foundation does not yet include legal hold, retention overrides, or anonymized audit retention workflows
- organization deletion should remove tenant-owned personal and operational metadata unless a later retention policy says otherwise
- keeping orphaned audit logs without a designed retention policy would weaken data-minimization discipline

Before adding production organization deletion workflows, revisit whether audit logs should be retained, anonymized, exported, or deleted.

If retention requirements are introduced, update the schema, deletion workflow, and data-protection documentation in the same implementation slice.

## Known current gaps

Current implementation does not yet include:

- real frontend login flow
- mounted protected API routes
- QR portal
- ticket workflows
- customer data export
- deletion workflow
- production audit-retention policy
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
