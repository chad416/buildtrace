# BuildTrace Security

## Phase

Phase 0 — Professional project foundation + security docs.

## Security position

BuildTrace Beta is designed as a secure, EU-hosted machine handover and service portal.

Security is a product pillar from day one.

## Current Phase 0 security model

Current implementation includes:

- no real secrets committed to the repository
- `.env.example` contains placeholders only
- `.env` and `.env.*` are ignored by Git, except `.env.example`
- web, API, worker, shared code, database package, i18n package, and UI package are separated
- TypeScript strict mode is enabled
- file visibility levels are defined in shared code

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

## Storage rule

Storage buckets must not be public.

Uploaded files must use private storage and signed temporary download URLs in later phases.

## EU hosting target

BuildTrace Beta targets EU-hosted infrastructure for database, storage, auth, API, worker, and monitoring where possible.

## Known Phase 0 gaps

Phase 0 does not yet include:

- authentication
- role-based access control
- tenant isolation
- private storage buckets
- signed URLs
- audit log database table
- rate limiting
- QR token access control

These are planned for later roadmap phases.
