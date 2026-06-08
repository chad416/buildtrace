# BuildTrace Decisions

## Current phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

Phase 0 is complete.

Phase 1 has started, but it is not complete.

Current full beta roadmap completion remains 5%.

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

Use `packages/shared` for common constants and enums.

Reason:

- document visibility levels, categories, and locale constants must be consistent across apps

### I18N package

Use `packages/i18n` for locale constants and base messages.

Reason:

- multilingual support is required from day one
- all future UI should use translation keys instead of hardcoded user-facing text

## Product decisions

### Scope discipline

Phase 0 only created the professional foundation.

Phase 1 is for industrial UI shell and multilingual UI skeleton.

No database, auth, storage, QR portal, tickets, CRUD, or backend product features are part of the current Phase 1 UI shell work unless explicitly scoped later.

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

Root route redirects to `/en`.

Unsupported locale routes should return not found.

Language switcher labels must come from translation messages, not hardcoded component text.

Current Phase 1 language switcher feature uses:

- shared `locales`
- translated labels in all 7 message JSON files
- `appMessages` export from `packages/i18n`

## Workflow decisions

### Manual-review workflow

Use manual-review workflow by default for implementation work.

Default process:

1. Generate proposed code or patch.
2. Review the proposal before applying.
3. Apply approved code manually in VS Code.
4. Run verification gates in PowerShell.
5. Inspect changed files.
6. Commit only after clean verification.

Reason:

- prevents agent-driven edits from bypassing review
- keeps quality control with the project owner
- reduces risk of accidental scope expansion

Agent direct-edit mode can be used only when explicitly approved for that step.

### Conversation versus engineering step size

Conversation steps should remain one action at a time.

Engineering steps should be meaningful small slices, not microscopic changes that create excessive documentation and commit overhead.

Reason:

- keeps the user workflow manageable
- avoids wasting time on tiny commits
- preserves quality without slowing the project unnecessarily

## Quality decisions

### Stop-the-line quality rule

Do not ignore warnings or errors.

Every warning or error must have one of these outcomes:

1. fixed in code/config/docs
2. documented as intentional generated-file/tooling behavior
3. blocked until understood

No moving forward while an unexplained warning remains.

### Formatting rule for manual doc edits

Manual Markdown edits often need Prettier formatting.

After manually editing a doc, run:

- `pnpm.cmd exec prettier --write <changed-doc-file>`
- `pnpm.cmd format:check`

Reason:

- avoids committing documentation that fails formatting gates
- prevents repeating the `docs/project-state.md` formatting mistake

### next-env.d.ts policy

`apps/web/next-env.d.ts` is currently tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Decision:

- do not remove `apps/web/next-env.d.ts` from Git tracking without a separate documented decision
- do not commit dev-server drift in `apps/web/next-env.d.ts`
- before committing, run `pnpm.cmd build`
- verify `git status --short` does not show `apps/web/next-env.d.ts`

Reason:

- the dev/build toggle is generated framework behavior
- the tracked build-safe state is restored by `pnpm.cmd build`
- we should not hide this by blindly removing the file from Git tracking

### Generated framework files

Generated framework/build outputs are excluded from formatting and linting checks where appropriate.

This includes:

- `.next` output
- `dist` output
- `.turbo` output
- coverage output
- TypeScript build info files

Reason:

- these files are generated or rewritten by tools such as Next.js, Turbo, and test/build systems
- they are not hand-authored product source code
- repeatedly formatting generated files creates rework without improving product quality

Quality rule:

- human-authored source, config, docs, and package files must pass formatting, linting, typecheck, and build verification
- generated framework/build artifacts must not be used to hide real source-code defects

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

- Phase 0 had to stay focused on foundation and security docs

### Removing next-env.d.ts from Git without investigation

Rejected for now.

Reason:

- the dev/build drift was investigated
- `pnpm.cmd build` restores the tracked state
- removing it from Git tracking is a separate project policy decision, not an automatic fix
