# BuildTrace

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

BuildTrace is an SME-first machine handover and lifecycle record for machine builders, automation integrators, and OEMs. It turns each delivered machine into a secure, multilingual, QR-accessible record for documentation, PLC/HMI software history, service communication, spare-parts intelligence, quote tracking, and customer handover. The product is deliberately lighter than a full PLM or CMMS: it focuses on the post-build information gap, uses TIA-aware document classification heuristics, and is designed for EU-region infrastructure from day one.

## Build status

BuildTrace is an actively developed beta, not a finished production service. The repository contains working slices for roadmap Phases 0 through 10: the monorepo foundation, multilingual UI, Supabase authentication boundary, organization-scoped machine records, private document handling, classification suggestions, handover exports, a QR customer portal, service tickets, software-version history, spare-parts records, and quote tracking. In the repository's historical phase weighting, that is the 95% milestone.

Phase 11 feedback workflows, audit-log presentation, production login, deployment, and operational hardening remain. The worker is currently a process boundary and health placeholder rather than an active job processor.

## Architecture

```text
                              +----------------------+
                              |  apps/worker         |
                              |  job boundary        |
                              |  (placeholder)       |
                              +----------+-----------+
                                         |
+----------------------+       HTTPS/JWT  v       +----------------------+
|  apps/web            | --------------->+------> |  apps/api            |
|  Next.js App Router  |                  |        |  NestJS + Fastify    |
|  7 locale routes     | <----------------+        |  auth + tenant guard |
+----------------------+     JSON / signed URLs     +----+-------------+---+
                                                         |             |
                                           Prisma / SQL  |             | Supabase SDK
                                                         v             v
                                                +-------------+  +----------------+
                                                | PostgreSQL  |  | Private Storage|
                                                | on Supabase |  | signed URLs     |
                                                +-------------+  +----------------+
```

All product records carry an `organization_id`. The API verifies a Supabase bearer token, resolves the internal user and organization membership, checks the required role, and passes the organization ID into scoped database helpers. The migrations do **not** yet install PostgreSQL Row-Level Security policies; adding and testing RLS is a production-hardening requirement, not a completed control.

The monorepo is organized as follows:

```text
apps/
  web/       Next.js web application and public QR portal
  api/       NestJS API, authentication boundary, storage access
  worker/    isolated background-process boundary (currently a placeholder)
packages/
  db/        Prisma schema, migrations, tenant-scoped data helpers
  shared/    shared domain constants, classifier, handover/export rules
  i18n/      message catalogs and feature copy for seven locales
  ui/        shared UI package boundary
docs/        reviewer-facing architecture and security documentation
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the trust boundaries and data model.

## Feature coverage

| Capability                               | Status                           | Repository evidence                                                                                                                                      |
| ---------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization-scoped machine records      | Implemented                      | Customers, machine models, machines, role checks, and scoped data helpers                                                                                |
| Private document upload and storage      | Implemented                      | API-mediated upload, tenant-prefixed storage paths, and private-bucket preflight                                                                         |
| Temporary download URLs                  | Implemented                      | Signed URLs for documents, exports, ticket attachments, and software files                                                                               |
| Document classification                  | Implemented                      | Deterministic filename/type suggestions with explicit builder confirmation; no automatic customer exposure                                               |
| Handover readiness and export            | Implemented                      | Completeness evaluation plus private ZIP and localized PDF artifacts                                                                                     |
| Customer-facing QR portal                | Implemented                      | Token-based machine view, locale switching, customer-visible documents, ticket creation, and quote requests                                              |
| Service ticketing                        | Implemented                      | Builder/customer tickets, statuses, comments, private attachments, and support-session notes                                                             |
| Software-version timeline                | Implemented                      | PLC/HMI/robot/drive history, delivered/current markers, private file upload, and SHA-256 checksum recording                                              |
| Multilingual UI                          | Implemented                      | English, Czech, Slovak, Polish, German, French, and Spanish message catalogs                                                                             |
| Activity trail                           | Implemented with a hardening gap | Important mutations and downloads create activity records; database-level immutability is not yet enforced                                               |
| Data classification tiers                | Implemented                      | Shared five-tier taxonomy; uploaded documents intentionally persist only customer-visible, internal, sensitive-engineering, or restricted (never public) |
| Spare-parts catalogue and quote tracking | Implemented                      | Organization-scoped parts with criticality/pricing fields, builder workflows, customer quote requests, quote status tracking, and seven-locale copy      |

## Security and data-protection posture

- Supabase Auth tokens terminate at the API boundary; the service-role key is consumed only by server-side API/development tooling.
- Documents and generated artifacts use a configured private Supabase Storage bucket. The preflight rejects a public bucket.
- Downloads use short-lived signed URLs; raw storage paths are not returned as download links.
- Customer portal document access is limited to files explicitly marked customer-visible.
- Tenant membership and role checks are followed by organization-scoped database queries and tenant-prefixed storage paths.
- Uploaded engineering files default to private classifications, with PLC, HMI, CAD, and electrical categories defaulting to sensitive-engineering.
- Activity records support traceability, but PostgreSQL RLS and database-enforced audit immutability remain open hardening work.
- The deployment target is an EU-region Supabase project. The repository cannot enforce or prove the region of a supplied project, so operators must verify it during provisioning.

BuildTrace is evidence-ready and secure-by-default in direction; it does not claim GDPR compliance, CE compliance, SIL certification, or any regulatory approval.

## Local development

### Prerequisites

- Node.js 22 or newer
- pnpm 10.12.4 or newer
- A PostgreSQL database (the intended setup is a Supabase project)
- A private Supabase Storage bucket

### Setup

```bash
pnpm install
cp .env.example .env
```

On Windows PowerShell, use the command shim and native copy command:

```powershell
pnpm.cmd install
Copy-Item .env.example .env
```

Fill in `.env` using values from the Supabase project dashboard. In particular, provide `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the name of a private storage bucket. Never expose the service-role key through a `NEXT_PUBLIC_*` variable.

Apply the migrations and seed the local development membership:

```bash
pnpm --filter @buildtrace/db exec prisma migrate deploy
pnpm --filter @buildtrace/db run dev:bootstrap
pnpm dev:preflight
```

Use `pnpm.cmd` in place of `pnpm` for the PowerShell equivalents. The web app has local URL defaults; when overriding its public URLs, place `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` as well as the root environment used by API/DB tooling.

Start the complete workspace or an individual app:

```bash
pnpm dev
pnpm --filter @buildtrace/web dev
pnpm --filter @buildtrace/api dev
pnpm --filter @buildtrace/worker dev
```

The API health endpoint is `GET http://localhost:4000/health`.

## Verification gates

Run the same repository-wide gates used for review:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm format:check
```

Package-specific smoke checks are available in each workspace `package.json`. Development conventions are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Remaining work

- Replace placeholder login/session bootstrap with a production-ready browser authentication flow.
- Add PostgreSQL/Supabase RLS policies and prove them with cross-tenant database tests.
- Enforce activity-log immutability and define production retention/export policy.
- Implement real worker jobs, production rate limiting, monitoring, backups, and an EU-region deployment runbook.
- Complete feedback, audit-log presentation, top-level dashboard/settings workflows, and final accessibility/browser verification.

Predictive maintenance, live IIoT telemetry, remote control, a supplier marketplace, and full PLM/CMMS scope are intentionally outside this beta.
