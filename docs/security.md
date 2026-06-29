# Security Posture

BuildTrace uses explicit server-side boundaries for identity, tenant access, private files, and traceability. The beta has meaningful security controls, alongside documented production-hardening gaps.

## Implemented

- Supabase bearer tokens are verified by the NestJS API.
- Supabase identities map to internal users and organization memberships with `OWNER`, `ADMIN`, or `MEMBER` roles.
- Product endpoints require organization membership and pass the organization ID into scoped database helpers.
- Private storage paths include the owning organization and record context.
- The storage preflight verifies that the configured bucket is not public.
- Uploads reject unsafe paths and use no-overwrite behavior.
- Downloads use configurable short-lived signed URLs.
- Customer portal document queries are restricted to explicitly customer-visible records.
- PLC, HMI, CAD, and electrical documents default to sensitive-engineering visibility.
- Activity records cover machine, document, export, QR portal, ticket, and software-version events.
- Real `.env` files, generated clients, build output, and internal agent/handoff files are excluded from Git.

## Known gaps

- PostgreSQL RLS policies are not present in the migrations; tenant isolation currently relies on API checks and scoped queries.
- The activity log is append-oriented in application code but is not immutable at the database privilege/trigger level.
- The public QR ticket and quote-request endpoints document a rate-limiting requirement but production rate limiting is not implemented here.
- The QR schema contains PIN fields, but the current public portal flow is token-based and does not enforce a PIN challenge.
- Browser login is a development session bootstrap rather than a production authentication UI.
- Production monitoring, backup/restore proof, secret rotation, retention, and incident response are not included.

## Secret boundary

`SUPABASE_SERVICE_ROLE_KEY` must never appear in browser code or a `NEXT_PUBLIC_*` variable. The current source reads it only from API/development paths. `.env.example` contains names and placeholders only; real values belong in ignored local/hosting secrets.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the authentication, tenant, storage, and RLS boundaries.
