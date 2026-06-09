# BuildTrace Decisions

## Current phase

Phase 0 - Professional project foundation + security docs is complete.

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Current full beta roadmap completion:

- 12%

Next phase:

- Phase 2 - Database + auth + tenancy

Latest feature commit:

- `92a1585 feat(web): complete phase 1 shell foundation`

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

### App messages export

Use `appMessages` as the main exported app message object from `packages/i18n`.

Reason:

- `phaseZeroMessages` became misleading once Phase 1 UI messages were added
- `appMessages` better describes the long-term role of the exported message bundle

### App shell server/client boundary

Keep `AppShell` server-side.

Use a small client component, `AppNav`, only where route-aware active navigation is needed.

Reason:

- avoids making the entire layout client-side unnecessarily
- keeps the shell simple and predictable
- supports active navigation without over-expanding client component scope

### Phase 1 machine detail route

Add `/[locale]/machines/[machineId]` as a placeholder-only translated shell route during Phase 1.

Reason:

- the Phase 1 roadmap requires a machine detail shell
- the route supports serious industrial UI click-through
- real machine records belong to Phase 3
- no database, API, CRUD, QR, document download, or real machine data should be added in Phase 1

### Tailwind/PostCSS CSS pipeline

Use a real Tailwind/PostCSS CSS pipeline for the web shell.

Reason:

- Phase 1 UI uses Tailwind utility classes
- browser testing showed plain HTML-looking output because the CSS pipeline was missing or incomplete
- adding `apps/web/src/app/globals.css`, `apps/web/postcss.config.mjs`, Tailwind/PostCSS dependencies, and importing global CSS from the localized layout fixed the root cause

Quality note:

- styling failures must be root-caused
- do not treat missing CSS output as a cosmetic issue if Tailwind classes are present but no compiled CSS reaches the browser

## Product decisions

### Scope discipline

Phase 0 only created the professional foundation.

Phase 1 created the industrial UI shell and multilingual UI skeleton.

Phase 2 will begin database, auth, and tenancy.

No database, auth, storage, QR portal, tickets backend, CRUD, or real dashboard data were part of Phase 1.

### Phase 1 closure

Phase 1 is formally complete.

Reason:

The roadmap defined Phase 1 exit conditions as:

- user can click through serious industrial UI
- language switching works
- product already communicates secure-by-default positioning

The completed Phase 1 shell satisfies those conditions.

Result:

- full beta roadmap completion moved from 5% to 12%
- next phase is Phase 2 - Database + auth + tenancy

### Placeholder-only pages

Phase 1 pages are intentionally placeholder-only.

Reason:

- the roadmap requires the shell routes to exist
- real product workflows belong to later phases
- placeholder pages prevent accidental fake data, fake metrics, or fake security behavior

### Compliance wording

BuildTrace must be framed as evidence readiness and documentation organization.

It must not claim to guarantee:

- legal compliance
- CE compliance
- Machinery Regulation compliance
- CRA compliance
- safety compliance
- safety certification
- regulatory approval

Allowed safer wording includes:

- evidence readiness
- documentation organization
- secure-by-default direction
- customer-visible files
- private engineering docs
- regulatory outcomes
- review outcomes
- approval outcomes

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

### Phase 1 security boundary

Phase 1 added visible secure-by-default positioning, but no real enforcement.

Reason:

- auth, tenant isolation, RBAC, storage, signed URLs, QR access, and audit logs belong to later phases
- visible security positioning should not be confused with implemented backend security controls

### Phase 2 security priority

Phase 2 must start the real security foundation.

Priority:

- authentication
- organization boundary
- tenant isolation
- role foundation
- activity log foundation
- secure environment variable setup

Reason:

- future machine, document, QR, ticket, and export workflows depend on correct tenant/security foundations

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

Current Phase 1 i18n shell uses:

- shared `locales`
- translated labels in all 7 message JSON files
- `appMessages` export from `packages/i18n`
- translated navigation
- translated footer links
- translated landing copy
- translated page-shell copy
- translated dashboard/login/settings placeholder copy
- translated machine detail shell copy

Uploaded technical documents are not automatically translated in beta.

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

### Root-cause rule

Prefer root-cause fixes over workarounds.

Reason:

- the product quality bar is production-grade
- temporary fixes create future rework
- tooling, build, CSS, type, and route problems should be understood before moving forward

### Stable React keys

Do not use translated visible UI text as React keys.

Use stable internal IDs instead.

Reason:

- translations can change
- translations can collide across languages
- React keys are technical identifiers, not display labels

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

### Building backend product features in Phase 1

Rejected.

Reason:

- Phase 1 was scoped to industrial UI shell and multilingual UI skeleton
- backend/auth/database/storage/QR/ticket/CRUD work belongs to later phases

### Fake dashboard data or fake operational metrics

Rejected.

Reason:

- placeholder UI must not imply real data exists
- fake metrics weaken product trust
- real data starts after database/auth/workflow phases are implemented

### Removing next-env.d.ts from Git without investigation

Rejected for now.

Reason:

- the dev/build drift was investigated
- `pnpm.cmd build` restores the tracked state
- removing it from Git tracking is a separate project policy decision, not an automatic fix

### Treating missing CSS as a cosmetic issue

Rejected.

Reason:

- the plain HTML browser result was caused by missing/incomplete Tailwind/PostCSS wiring
- the correct fix was to wire the CSS pipeline, not ignore the visual failure

### Single main landmark ownership

Keep `AppShell` as the single owner of the rendered page `<main>` landmark.

Child page components and shared page-shell components should use non-landmark wrappers such as `<div>`.

Reason:

- prevents invalid nested `<main>` landmarks
- improves accessibility semantics
- gives screen readers a single main page landmark
- keeps layout ownership clear

### Next.js App Router lint boundary

Disable `@next/next/no-html-link-for-pages`.

Reason:

- BuildTrace uses the Next.js App Router, not the legacy Pages Router
- the rule expects a `pages` directory and can emit irrelevant warnings for App Router projects
- route links still use Next.js `Link` where appropriate
- the rest of the Next.js lint rules remain enabled

### Native dependency build approvals

Record trusted native dependency build approvals in `pnpm-workspace.yaml`.

Approved native build dependencies:

- `esbuild`
- `sharp`

Reason:

- pnpm blocks dependency build scripts unless approved
- `esbuild` is part of the JavaScript tooling chain
- `sharp` is a normal native dependency used by Next.js image tooling
- approvals should be explicit and source-controlled instead of relying on local machine state

### Canonical locale source

Use `packages/shared` as the canonical owner of supported locale constants.

`packages/i18n` should import and re-export the shared locale source instead of duplicating its own locale array.

Reason:

- prevents locale-list drift
- gives shared constants a real cross-package role
- keeps locale support consistent across app, i18n, and future backend code

### next-intl dependency

Remove `next-intl` until BuildTrace intentionally adopts it.

Reason:

- Phase 1 currently uses a simple internal `appMessages` i18n foundation
- `next-intl` was installed but unused
- unused dependencies are inventory waste
- keeping an unused i18n dependency implies an architecture the app has not implemented

Decision:

- remove `next-intl` for now
- re-add it later only if a future i18n implementation step intentionally adopts it
