# BuildTrace Security

## Current phase

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Current full beta roadmap completion:

- 12%

Next phase:

- Phase 2 - Database + auth + tenancy

## Security position

BuildTrace Beta is designed as a secure, EU-hosted machine handover and service portal.

Security is a product pillar from day one.

Security language must stay conservative.

BuildTrace may be described as supporting:

- evidence readiness
- documentation organization
- secure-by-default direction
- customer-visible files
- private engineering docs

BuildTrace must not be described as guaranteeing:

- legal compliance
- CE compliance
- Machinery Regulation compliance
- CRA compliance
- safety compliance
- safety certification
- regulatory approval

## Current security model

Current implementation includes:

- no real secrets committed to the repository
- `.env.example` contains placeholders only
- `.env` and `.env.*` are ignored by Git, except `.env.example`
- web, API, worker, shared code, database package, i18n package, and UI package are separated
- TypeScript strict mode is enabled
- file visibility levels are defined in shared code
- security and data-protection documentation exists
- translated secure-by-default positioning is visible in the Phase 1 shell
- translated privacy/security/data-protection landing sections exist
- translated footer links point to privacy/security/data-protection sections
- translated settings placeholders exist for role, preferred language, future MFA, data export, and security logs

## Phase 1 security status

Phase 1 completed the visible security-positioning layer only.

Phase 1 did not implement real security enforcement.

Phase 1 added:

- secure-by-default positioning in the localized shell
- privacy/security/data-protection sections on the landing page
- placeholder settings sections for future security/account controls
- translated wording around evidence readiness and documentation organization
- no hardcoded visible UI text for the shell

Phase 1 did not add:

- authentication
- Supabase Auth
- PostgreSQL
- Prisma
- tenant isolation
- RBAC
- private storage buckets
- signed download URLs
- QR portal access control
- real customer data
- real machine data
- document upload
- ticket backend
- audit log database table
- rate limiting

## File visibility levels

BuildTrace uses these levels:

1. public
2. customer-visible
3. internal
4. sensitive-engineering
5. restricted

## Default file rules

Uploaded documents must be private by default.

Uploaded documents default to internal.

PLC, HMI, CAD, and electrical files must default to sensitive-engineering unless the builder explicitly changes visibility.

Customer-visible access must be explicitly selected.

## Secrets

Secrets must never be hardcoded.

Credentials must only be loaded from environment variables.

Real `.env` files must not be committed.

Service-role secrets must never be exposed in frontend code.

## Storage rule

Storage buckets must not be public.

Uploaded files must use private storage and signed temporary download URLs in later phases.

Storage is not implemented yet.

## EU hosting target

BuildTrace Beta targets EU-hosted infrastructure for database, storage, auth, API, worker, and monitoring where possible.

## Phase 2 security focus

Phase 2 should begin real security foundations.

Phase 2 roadmap scope includes:

- Supabase Auth
- PostgreSQL
- Prisma schema
- organization workspace logic
- organization-level tenant isolation
- API-level tenant checks
- RBAC foundation
- activity log table
- login event logging
- secure environment variable setup

Phase 2 exit condition:

- logged-in builder sees only their own organization data
- core activity logging works
- unauthorized access is blocked

## Known current gaps

Current implementation does not yet include:

- authentication
- role-based access control
- tenant isolation
- private storage buckets
- signed URLs
- audit log database table
- rate limiting
- QR token access control
- secure customer portal
- real data access checks

These are planned for later roadmap phases.

They are known roadmap boundaries, not hidden defects.
