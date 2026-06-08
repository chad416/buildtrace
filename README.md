# BuildTrace Beta

BuildTrace Beta is a professional B2B machine-lifecycle SaaS foundation for SME machine builders, automation integrators, and OEMs.

The product goal is to help builders turn every delivered machine into a secure, multilingual, QR-accessible digital machine record.

## Phase

Current phase:

Phase 0 — Professional project foundation + security docs.

Phase 0 completion target:

5% of the full beta roadmap.

## Current Phase 0 scope

This phase establishes the technical foundation:

- pnpm monorepo
- Turborepo
- apps/web
- apps/api
- apps/worker
- packages/db
- packages/shared
- packages/i18n
- packages/ui
- strict TypeScript base config
- ESLint
- Prettier
- environment example
- multilingual base
- security documentation
- data-protection documentation
- data-classification documentation

## Local development

Install dependencies:

pnpm.cmd install

Run web:

pnpm.cmd -F @buildtrace/web dev

Run API:

pnpm.cmd -F @buildtrace/api dev

Run worker:

pnpm.cmd -F @buildtrace/worker dev

## Verification commands

Web:

pnpm.cmd -F @buildtrace/web typecheck
pnpm.cmd -F @buildtrace/web lint
pnpm.cmd -F @buildtrace/web build

API:

pnpm.cmd -F @buildtrace/api typecheck
pnpm.cmd -F @buildtrace/api lint
pnpm.cmd -F @buildtrace/api build

Worker:

pnpm.cmd -F @buildtrace/worker typecheck
pnpm.cmd -F @buildtrace/worker lint
pnpm.cmd -F @buildtrace/worker build

## Locale routes

The web app supports these route foundations:

- /en
- /cs
- /sk
- /pl
- /de
- /fr
- /es

The root route redirects to /en.

## API health check

API health endpoint:

GET /health

Expected response:

{
"service": "buildtrace-api",
"status": "ok",
"phase": "phase-0-foundation"
}

## Worker placeholder

The worker currently prints a placeholder status JSON.

## Security principles

- No hardcoded secrets.
- Use environment variables for credentials.
- Uploaded files are private by default in the product design.
- Storage buckets must not be public.
- Downloads must use signed temporary URLs in later phases.
- PLC, HMI, CAD, and electrical files default to sensitive-engineering.
- Customer-visible files must be explicitly selected.
- EU-hosting is the target direction.
- Uploaded documents must not be used for external AI model training.

## Not included yet

Phase 0 does not include:

- login
- Supabase Auth
- PostgreSQL
- Prisma schema
- real tenant isolation
- document upload
- private storage buckets
- signed URLs
- QR portal
- tickets
- spare parts
- quote flow
- feedback
- production deployment
