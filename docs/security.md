# BuildTrace Security

## Current phase

Phase 2 - Database + auth + tenancy is complete.

Current full beta roadmap completion:

- 22%

Next phase:

- Phase 3 - Machine/customer records foundation

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
- Prisma and PostgreSQL tooling foundation exists in `@buildtrace/db`
- Phase 2 trust schema exists for organizations, app users, organization memberships, and activity logs
- the initial Prisma migration was validated from zero against disposable PostgreSQL
- generated Prisma client output is ignored and regenerated through package scripts
- API-side Supabase auth config boundary exists
- API-side bearer-token verification helper exists
- bearer authorization-header parser exists
- current-user resolution foundation exists
- organization tenant-access guard foundation exists
- authenticated tenant-context composition helper exists
- activity-log helper exists
- auth, tenant-access, and activity-log smoke checks exist

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

## Phase 2 security status

Phase 2 completed the database, auth, and tenancy trust foundation.

Phase 2 added:

- Prisma tooling foundation
- PostgreSQL datasource configuration
- initial Prisma schema for organizations, app users, organization memberships, and activity logs
- initial migration tested from zero against disposable PostgreSQL
- Prisma client factory
- API-side Supabase auth config boundary
- API-side bearer-token verification helper
- bearer authorization-header parser
- current-user context resolution from `auth_user_id`
- membership-scoped tenant access guard
- authenticated tenant-context composition helper
- generic organization roles: `OWNER`, `ADMIN`, and `MEMBER`
- append-only activity-log helper
- smoke checks for auth, tenant access, and activity logging
- generated Prisma client policy and Turbo pipeline wiring

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
- production rate limiting
- database row-level security claims

Security boundary:

- auth and tenant helpers exist, but they are not yet mounted on real product endpoints
- tenant isolation is implemented as an API-layer foundation
- database row-level security is not claimed
- product-specific RBAC is deferred until the workflows it protects exist
- service-role secrets remain server/API-side only
- frontend code must not contain service-role secrets

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

## Phase 2 trust-foundation security decisions

Phase 2 implemented security foundation work in this order:

1. establish authenticated identity boundary
2. map authenticated identity to an internal BuildTrace user
3. resolve the user's organization memberships
4. enforce organization-scoped tenant guards
5. add role foundation
6. add append-only activity logging

Phase 2 did not connect machine, document, ticket, QR, export, or storage workflows before the tenant boundary existed.

The service-role secret must remain server-side only.

The web app may use public/anon auth configuration only when needed for login.

BuildTrace must not claim row-level security is implemented until RLS is configured and tested with the chosen Prisma/Supabase setup.

Reason:

- secure-by-default positioning must become real backend behavior
- tenant isolation is the load-bearing wall for later phases
- secrets must not cross into frontend code
- untested security claims would weaken product trust

## Phase 2 role decision

Phase 2 uses membership-scoped organization roles:

- `OWNER`
- `ADMIN`
- `MEMBER`

These roles live on `OrganizationMembership`.

Reason:

- organization access is scoped to the user's membership in a specific organization
- the model avoids a future schema redesign if a user belongs to more than one organization
- Phase 2 needs a small, durable authorization foundation
- product-specific roles belong with the product workflows they protect

Product-specific roles such as engineer, service manager, sales, and customer viewer are deferred to the phases that introduce those workflows.

## Phase 2 activity-log actor decision

Phase 2 activity logs use nullable `actor_user_id` for authenticated internal app users.

Phase 2 does not add an `actor_type` column yet.

Reason:

- the only implemented actor in Phase 2 is an authenticated internal app user
- QR portal actors, customer-viewer actors, and system/worker actors do not have real logging call sites yet
- adding actor typing before those actors exist would create unused schema surface

Decision:

- do not fake non-user actors as `AppUser` records
- do not claim system, QR, or customer-portal actor attribution until the schema supports it
- add a documented `ActorType` enum and migration when the first non-`AppUser` activity-log producer is implemented

## Phase 2 audit-log deletion posture

Activity logs are tenant-owned records.

In Phase 2, deleting an organization cascades to its activity logs.

Reason:

- the beta foundation does not yet include legal hold, retention overrides, or anonymized audit retention workflows
- organization deletion should remove tenant-owned personal and operational metadata unless a later retention policy says otherwise
- keeping orphaned audit logs without a designed retention policy would weaken data-minimization discipline

Before adding production organization deletion workflows, revisit whether audit logs should be retained, anonymized, exported, or deleted.

## Known current gaps

Current implementation does not yet include:

- real frontend login flow
- mounted protected API routes
- product-specific RBAC
- private storage buckets
- signed URLs
- production rate limiting
- QR token access control
- secure customer portal
- machine/customer data access checks
- document access checks
- ticket access checks
- database row-level security
- production security monitoring

These are planned for later roadmap phases.

They are known roadmap boundaries, not hidden defects.
