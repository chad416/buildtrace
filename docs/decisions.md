# BuildTrace Decisions

## Phase

Phase 0 — Professional project foundation + security docs.

## Architectural decisions

### Monorepo

Use a pnpm workspace monorepo.

Reason:

- keeps web, API, worker, shared code, i18n, database package, and UI package separated
- avoids putting the full product inside one Next.js app
- supports production-grade scaling later

### Turborepo

Use Turborepo for workspace task orchestration.

Reason:

- consistent build, lint, typecheck, and dev commands across apps/packages
- suitable for a multi-app SaaS structure

### Web app

Use Next.js App Router.

Reason:

- supports route-based app structure
- works well with locale routes
- suitable for Vercel deployment later

### API

Use NestJS with Fastify.

Reason:

- structured backend architecture
- good module/controller/service pattern for future phases
- Fastify gives strong runtime performance

### Worker

Create a separate worker app.

Reason:

- later background jobs should not run inside the web app
- future exports, classification, emails, and async processing need isolation

### Shared package

Use packages/shared for common constants and enums.

Reason:

- document visibility levels, categories, and locale constants must be consistent across apps

### I18N package

Use packages/i18n for locale constants and base messages.

Reason:

- multilingual support is required from day one
- all future UI should use translation keys instead of hardcoded user-facing text

## Product decisions

### Scope discipline

Phase 0 only creates the foundation.

No product features are built in Phase 0.

### Compliance wording

BuildTrace must be framed as evidence readiness and documentation organization.

It must not claim to guarantee legal, CE, Machinery Regulation, CRA, or safety compliance.

## Security decisions

### Secrets

No hardcoded secrets.

Use `.env.example` placeholders only.

Real `.env` files stay ignored by Git.

### File defaults

Uploaded documents are private by default in the product design.

PLC, HMI, CAD, and electrical files default to sensitive-engineering.

Customer-visible access must be explicitly selected.

### Storage

Future storage buckets must not be public.

Downloads must use signed temporary URLs.

## I18N decisions

Supported locales from day one:

- en
- cs
- sk
- pl
- de
- fr
- es

Root route redirects to /en.

Unsupported locale routes should return not found.

## Rejected alternatives

### Single Next.js app only

Rejected.

Reason:

- would mix web, API, jobs, database, and shared logic too early
- not suitable for the planned SaaS architecture

### Public storage buckets

Rejected.

Reason:

- conflicts with secure-by-default product positioning

### Hardcoded UI text

Rejected.

Reason:

- multilingual support is a beta requirement from day one

### Building product features in Phase 0

Rejected.

Reason:

- Phase 0 must stay focused on foundation and security docs

## Quality decisions

### Generated framework files

Generated framework/build files are excluded from formatting and linting checks.

This includes:

- apps/web/next-env.d.ts
- .next output
- dist output
- .turbo output
- coverage output

Reason:

- these files are generated or rewritten by tools such as Next.js, Turbo, and test/build systems
- they are not hand-authored product source code
- repeatedly formatting generated files creates rework without improving product quality

Quality rule:

- human-authored source, config, docs, and package files must pass formatting, linting, typecheck, and build verification
- generated framework/build artifacts must be excluded from style checks
- generated artifacts must not be used to hide real source-code defects
