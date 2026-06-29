# BuildTrace Architecture

This document describes the code in this repository as it exists today. It distinguishes implemented controls from deployment targets so reviewers can evaluate the beta without relying on roadmap claims.

## System context

```text
 Builder browser                         Customer browser
       |                                       |
       | locale app routes + bearer JWT        | QR token route
       v                                       v
+------------------+                    +------------------+
| Next.js web      |                    | Next.js portal   |
| apps/web         |                    | /portal/:token   |
+--------+---------+                    +---------+--------+
         |                                        |
         +---------------- HTTPS -----------------+
                              |
                              v
                    +--------------------+
                    | NestJS API         |
                    | apps/api           |
                    | Fastify multipart  |
                    +----+-----------+---+
                         |           |
                    Prisma|           |Supabase SDK
                         v           v
                 +-----------+  +----------------+
                 |PostgreSQL |  |Private Storage |
                 |Supabase   |  |signed downloads|
                 +-----------+  +----------------+

                    +--------------------+
                    | Worker boundary    |
                    | apps/worker        |
                    | placeholder today  |
                    +--------------------+
```

The web application owns presentation and server actions. The API owns authentication, authorization, business endpoints, database access, checksums, and storage operations. Private file bytes do not pass directly from the browser to Supabase Storage.

## Monorepo layout

| Workspace            | Responsibility                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@buildtrace/web`    | Next.js App Router application, localized builder UI, and public QR portal                                      |
| `@buildtrace/api`    | NestJS/Fastify HTTP boundary, Supabase token verification, tenant/role checks, storage and export orchestration |
| `@buildtrace/worker` | Separate process boundary reserved for background work; currently emits a placeholder status only               |
| `@buildtrace/db`     | Prisma schema and migrations, database client, organization-scoped record helpers, and isolation smoke checks   |
| `@buildtrace/shared` | Domain constants, document classifier, handover/export rules, spare-part criticality, and quote workflow types  |
| `@buildtrace/i18n`   | Seven message catalogs plus localized document, spare-part, quote, portal, ticket, and version copy             |
| `@buildtrace/ui`     | Shared UI package boundary; intentionally small in the current beta                                             |

The root pnpm workspace and Turborepo pipeline coordinate `build`, `lint`, `typecheck`, and development tasks.

## Authentication boundary

The implemented builder-side request path is:

1. The web layer sends a Supabase access token as an HTTP bearer token.
2. `apps/api` verifies that token with Supabase Auth.
3. The API maps the Supabase user ID to `AppUser.authUserId`.
4. The requested organization is resolved through `OrganizationMembership`.
5. The endpoint checks the allowed membership role (`OWNER`, `ADMIN`, or `MEMBER`).
6. Only then does the endpoint call an organization-scoped database helper.

`SUPABASE_SERVICE_ROLE_KEY` is read only by server-side API/development code. There is no production browser login flow in this repository yet; the development browser-session helper obtains a token and seeds local cookies for manual testing. The anon key is used by that development bootstrap path, while API token verification currently uses the server-side Supabase client.

The intended production boundary is browser authentication with public Supabase configuration, a bearer JWT sent to the API, and service-role access confined to the API. That browser login wiring remains to be implemented.

## Multi-tenant data isolation

Every tenant-owned product model includes `organizationId`/`organization_id`. The current isolation layers are:

- authenticated organization membership and role checks at the API boundary;
- organization IDs passed explicitly into database commands;
- `organizationId` predicates on reads and updates;
- organization-scoped uniqueness and indexes for machine, document, and export records;
- composite organization/machine relationships for documents and exports;
- tenant-prefixed storage paths such as `organizations/{organizationId}/machines/{machineId}/...`;
- smoke checks that attempt cross-organization access.

### RLS status

The Prisma migrations currently do not enable PostgreSQL Row-Level Security or create organization policies. Isolation therefore depends on the API and scoped database helpers. The Supabase service role would bypass RLS in any case, so a production RLS design must define which database role Prisma uses, how the authenticated organization context is propagated, and how cross-tenant denial is tested.

Before production, the project should:

1. add RLS policies for every tenant-owned table;
2. use a non-bypass database role for user-scoped operations, or formally constrain and audit the service-role pattern;
3. add migration-level tests proving both read and write denial across organizations;
4. document the small set of privileged server operations that may bypass tenant policies.

This is an explicit hardening gap, not a claimed completed control.

## Document classification tiers

BuildTrace defines a five-tier information taxonomy:

| Tier                    | Meaning                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `public`                | Content intentionally suitable for unrestricted publication; not selectable for uploaded machine documents |
| `customer-visible`      | Private content explicitly approved for the customer portal                                                |
| `internal`              | Default builder-workspace content                                                                          |
| `sensitive-engineering` | PLC, HMI, CAD, electrical, and similar engineering material                                                |
| `restricted`            | Highest-sensitivity organizational content                                                                 |

The persisted `DocumentVisibilityLevel` intentionally contains only the four non-public document tiers. `visibleToCustomer` is synchronized with the `customer-visible` tier, and the QR portal lists only records explicitly marked customer-visible.

The classifier is deterministic and suggestion-only. It examines the filename and file type, records a suggested category, confidence, status, and source, and requires an explicit builder confirmation. Refreshing or confirming a suggestion does not automatically expose a file to a customer. This design separates organizational assistance from authorization.

## Storage model

All document, export, ticket-attachment, and software-version files use the configured `DOCUMENT_STORAGE_BUCKET`.

- The bucket must be private; the development preflight reads the bucket configuration and rejects a public bucket.
- Uploads flow through the API, which checks tenant context, file limits, and storage-path scope.
- Storage paths are prefixed by organization and owning record IDs.
- Uploads use `upsert: false` to avoid silent overwrite.
- Download endpoints return short-lived signed URLs using `SIGNED_URL_TTL_SECONDS`.
- Handover ZIP and PDF artifacts are generated server-side and stored privately.
- Raw storage paths are retained as server-side metadata rather than public download addresses.

Bucket privacy and EU-region placement are deployment configuration. Operators must verify both when provisioning Supabase; the repository cannot prove the region of arbitrary credentials supplied at runtime.

## Software-version timeline

`SoftwareVersion` records belong to an organization and machine and contain:

- a version name and software type (`plc`, `hmi`, `robot`, `drive`, or `other`);
- optional notes and an uploader reference;
- `isDeliveredVersion` and `isCurrentKnownVersion` markers;
- an optional private storage path;
- an optional SHA-256 checksum calculated by the API while reading an uploaded file;
- upload, creation, and update timestamps.

List and lookup operations include the organization ID. Owner/admin operations can mark a version as delivered or current. Files are written under an organization/machine/version path with overwrite disabled, and downloads use the same private signed-URL boundary as documents.

The current schema records markers but does not enforce exactly one delivered or current version per machine/software type at the database level. It also records the computed checksum rather than accepting and comparing an independent expected checksum. Those distinctions matter when evaluating the beta's integrity guarantees.

## Spare parts and quote tracking

`SparePart` records belong to an organization and machine. They store part identity, manufacturer and part number, quantity, category, criticality (`critical`, `recommended`, or `optional`), currency, estimated/internal/customer-visible price fields, an optional source-document reference, and notes. Builder endpoints support create, list, and update operations. API responses deliberately omit `internalCost`.

`QuoteRequest` records support spare-part and service requests. They store the owning organization and machine, optional part/ticket references, title and description, quoted price and currency, customer access token, and a status of `requested`, `quote-sent`, `approved`, `rejected`, or `completed`. Authenticated builder endpoints create, list, and update requests; the QR portal can create a customer request after verifying that the token resolves to the requested machine.

Both workflows use organization-scoped database helpers, localized web/API clients, smoke checks, and activity events. Public quote creation still requires production rate limiting.

## Activity records

Important machine, document, export, portal, ticket, software-version, spare-part, and quote-request events create `ActivityLog` rows. The application exposes creation helpers and does not expose normal update/delete workflows. The database schema itself does not yet prevent privileged updates/deletes, and organization deletion cascades to its activity rows. The accurate description is therefore an append-oriented activity trail, not an immutable audit ledger.

## Deployment boundary

The intended production topology is EU-region hosting for Supabase database, Auth, and private Storage, plus EU-region API/web/worker hosting. Production deployment, monitoring, backup/restore proof, rate limiting, RLS, browser login, and audit retention are not encoded as completed infrastructure in this repository.
