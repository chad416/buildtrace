# BuildTrace Data Protection

## Phase

Phase 0 — Professional project foundation + security docs.

## EU hosting intent

BuildTrace Beta targets EU-hosted infrastructure where possible.

Target services:

- Supabase EU region for database, auth, and private storage
- EU-friendly hosting for API and worker
- EU-friendly monitoring and analytics setup where possible

## Data ownership

Customer data belongs to the builder organization using BuildTrace.

BuildTrace should store and organize machine records, uploaded documents, tickets, quotes, software-version metadata, spare-part metadata, feedback, exports, and activity logs.

## Privacy-by-design rules

BuildTrace should collect only data needed for machine handover, service, documentation organization, and version traceability.

Uploaded technical files are not public by default.

Customer portal users should only access explicitly customer-visible files.

Internal notes must stay hidden from customers.

## AI data handling rule

Uploaded documents must not be used for external AI model training.

Any future AI classification must not override security defaults.

AI suggestions must require builder review when confidence is low.

## Export and delete policy target

Later phases must support:

- machine record export
- handover package export
- expiring export links
- archive/delete workflow
- data portability for builder-owned records

## Logging rules

Analytics must not capture uploaded document contents.

Error logs must not expose file contents, secrets, signed URLs, or sensitive engineering data.

Activity logs should track major actions without storing unnecessary personal data.

## Known Phase 0 gaps

Phase 0 does not yet include:

- database
- real data storage
- auth
- customer data export
- deletion workflow
- audit log table
- production privacy policy

These are planned for later phases.
