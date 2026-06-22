# BuildTrace Phase Log

## 2026-06-12 - Phase 3 machine records vertical slice

### Phase

Phase 3 - Machine/customer records foundation.

### Task completed

Implemented and browser-verified the first authenticated Phase 3 machine records vertical slice.

This slice proves the approved Phase 3 architecture end to end: Prisma-owned product records, typed shared constants, tenant-scoped database helpers, guarded NestJS API endpoints, Next.js web API client calls, cookie-backed browser session forwarding, and real web create/list/detail behavior through the API boundary.

This does not complete all of Phase 3. Create/read are working for customers, machine models, and machines; update/delete CRUD and localization closeout remain before Phase 3 can be marked complete against the full roadmap.

### Verified implementation

- Phase 3 decisions locked in `docs/decisions.md`
- customer, machine model, and machine schema added
- machine status enum added and mirrored with a drift check
- typed activity-log action constants added
- development bootstrap added for real Supabase user/org/membership setup
- real PostgreSQL tenant-isolation check added
- DB helpers added for customer/model/machine create/read paths
- API endpoints added for customer/model/machine create/read paths
- web API client added through the NestJS API boundary
- cookie-backed browser session boundary added
- customer create form added
- machine model create form added
- machine create form added
- machine list connected to real API data
- machine detail connected to real API data
- browser verification passed with one real customer, one real model, and one real machine

### Root fixes during verification

- Removed `NODE_ENV=development` from ignored local `.env` because it poisoned `next build`.
- Fixed machine list rendering with stable `key={machine.id}` in `bbcbc48`.
- Restarted the dev server after clearing `.next` so the browser did not use stale build state.

### Verification result

Passed:

- web typecheck
- web lint
- web build
- format check
- git diff check
- browser machine create flow
- browser machine list flow
- browser machine detail flow

### Remaining Phase 3 work

- customer update/delete path or explicit no-delete Phase 3 decision
- machine model update/delete path or explicit no-delete Phase 3 decision
- machine update/delete path or explicit no-delete Phase 3 decision
- activity-log coverage for update/delete paths that ship
- localization coverage for new Phase 3 copy, status labels, errors, dates, and counts
- final Phase 3 closeout docs and review

### Current completion assessment

Phase 3 is in progress.

The authenticated create/read vertical slice is complete and verified.

Conservative current full beta roadmap completion: about 30%.

### Commit message

`docs: record phase 3 machine records progress`

---

## 2026-06-08

### Phase

Phase 0 - Professional project foundation + security docs.

### Task completed

Created the professional monorepo foundation and verified web, API, and worker placeholders.

### Files/folders changed

- apps/web
- apps/api
- apps/worker
- packages/db
- packages/shared
- packages/i18n
- packages/ui
- docs
- README.md
- package.json
- pnpm-workspace.yaml
- turbo.json
- tsconfig.base.json
- eslint.config.mjs
- .prettierrc.json
- .env.example
- .gitignore

### Test result

Passed:

- web typecheck
- web lint
- web build
- locale route generation
- API typecheck
- API lint
- API build
- API /health runtime test
- worker typecheck
- worker lint
- worker build
- worker runtime test

### Issues found and resolved

- PowerShell denied write access in `C:\WINDOWS\system32`. Resolved by working in `C:\Users\chand\buildtrace`.
- pnpm was missing. Resolved by installing pnpm with `npm.cmd`.
- PowerShell script policy blocked `npm.ps1`. Resolved by using `npm.cmd`.
- Some files had UTF-8 BOM markers. Resolved by scanning and removing BOM markers.
- PowerShell treated `[locale]` as a pattern. Resolved by using literal path handling where needed.
- ESLint initially scanned generated `.next` output. Resolved by updating ESLint ignore rules.
- Turbo initially warned about missing build outputs for noEmit packages. Resolved by setting Phase 0 build outputs to `[]`.
- Prettier initially found formatting drift. Resolved with `pnpm.cmd format`.
- TypeScript generated `apps/web/tsconfig.tsbuildinfo`. Resolved by removing it from Git index and adding `*.tsbuildinfo` to `.gitignore`.
- Git warned about LF-to-CRLF conversion on Windows. Resolved by adding `.gitattributes` with LF normalization.

### Commit message

`chore: initialize phase 0 project foundation`

---

## 2026-06-08

### Phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

### Task completed

Added multilingual language switcher foundation.

This did not complete Phase 1. Current full beta roadmap completion remained 5%.

### Files/folders changed

- apps/web/src/app/[locale]/page.tsx
- apps/web/src/components/language-switcher.tsx
- packages/i18n/src/index.ts
- packages/i18n/messages/en.json
- packages/i18n/messages/cs.json
- packages/i18n/messages/sk.json
- packages/i18n/messages/pl.json
- packages/i18n/messages/de.json
- packages/i18n/messages/fr.json
- packages/i18n/messages/es.json

### Test result

Passed:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`
- translation JSON key validation for en, cs, sk, pl, de, fr, es
- manual runtime test for language switching

### Commit message

`feat(web): add multilingual language switcher`

---

## 2026-06-09

### Phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

### Task completed

Added translated app shell/header/footer foundation.

This did not complete Phase 1. Current full beta roadmap completion remains 5%.

### Files/folders changed

- apps/web/src/app/[locale]/layout.tsx
- apps/web/src/app/[locale]/page.tsx
- apps/web/src/components/app-shell.tsx
- packages/i18n/src/index.ts
- packages/i18n/messages/en.json
- packages/i18n/messages/cs.json
- packages/i18n/messages/sk.json
- packages/i18n/messages/pl.json
- packages/i18n/messages/de.json
- packages/i18n/messages/fr.json
- packages/i18n/messages/es.json

### Test result

Passed:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`
- shell and landing translation JSON key validation for en, cs, sk, pl, de, fr, es
- manual runtime test for header rendering
- manual runtime test for footer rendering
- manual runtime test for language switcher in header
- manual runtime test for language switching
- manual runtime test for privacy/security/data-protection sections
- VS Code Problems panel clean after stale wrong-path tab was closed

### Manual runtime result

- localized page loaded
- translated app shell rendered
- header rendered
- footer rendered
- language switcher was visible in header
- switching language worked
- overview, evidence-readiness, and documentation anchors existed
- privacy, security, and data-protection footer anchors matched real section IDs

### Issues found and resolved

- Codex initially proposed footer links pointing to section IDs that did not exist. Resolved by adding translated trust sections with matching IDs: `privacy`, `security`, and `data-protection`.
- Codex initially proposed an internal route as a raw anchor tag. Resolved by using Next.js `Link` for the locale home link.
- `AppShell` was accidentally created in a wrong nested folder path under `apps/web/src/components/apps/web/src/components`. Resolved by moving it to `apps/web/src/components/app-shell.tsx` and deleting the wrong nested folder.
- VS Code showed a stale `./language-switcher` import error from the old wrong nested file tab. Resolved by closing the stale tab; `pnpm.cmd typecheck` and the VS Problems panel confirmed the repo was clean.
- `apps/web/next-env.d.ts` drifted after `next dev`. Resolved by running `pnpm.cmd build`, which restored the tracked build-safe state.

### Security notes

- No auth was added.
- No database was added.
- No storage was added.
- No QR portal was added.
- No tickets, CRUD, document upload, signed URLs, or backend access logic was added.
- No private file URLs were exposed.
- No security claims or compliance guarantees were added.
- The shell uses safe positioning only: evidence readiness, documentation organization, secure-by-default direction, customer-visible files, and private engineering docs.

### i18n notes

- Header, footer, navigation, landing hero, landing sections, and trust placeholders use translation keys.
- Supported locales remain: en, cs, sk, pl, de, fr, es.
- `appMessages` now exposes shell and landing messages.
- Uploaded document translation is still not included.

### Not included yet

- real authentication
- login functionality
- dashboard data
- machine/customer/document CRUD
- document upload
- QR portal
- tickets
- spare parts
- quote flow
- feedback
- deployment

### Commit message

`feat(web): add translated app shell foundation`

---

## 2026-06-09

### Phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

### Task completed

Added translated application page-shell skeletons.

This did not complete Phase 1. Current full beta roadmap completion remains 5%.

Practical Phase 1 progress is approximately 60-65%.

### Files/folders changed

- apps/web/src/app/[locale]/dashboard/page.tsx
- apps/web/src/app/[locale]/documents/page.tsx
- apps/web/src/app/[locale]/feedback/page.tsx
- apps/web/src/app/[locale]/login/page.tsx
- apps/web/src/app/[locale]/machines/page.tsx
- apps/web/src/app/[locale]/settings/page.tsx
- apps/web/src/app/[locale]/spare-parts/page.tsx
- apps/web/src/app/[locale]/tickets/page.tsx
- apps/web/src/components/app-shell.tsx
- apps/web/src/components/page-shell.tsx
- packages/i18n/src/index.ts
- packages/i18n/messages/en.json
- packages/i18n/messages/cs.json
- packages/i18n/messages/sk.json
- packages/i18n/messages/pl.json
- packages/i18n/messages/de.json
- packages/i18n/messages/fr.json
- packages/i18n/messages/es.json

### Test result

Passed:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- `git diff --cached --check`

### Build result

Production build confirmed the localized placeholder routes:

- `/[locale]/dashboard`
- `/[locale]/documents`
- `/[locale]/feedback`
- `/[locale]/login`
- `/[locale]/machines`
- `/[locale]/settings`
- `/[locale]/spare-parts`
- `/[locale]/tickets`

### Manual/runtime result

- VS Code Problems panel was fixed before final verification.
- `apps/web/src/components/page-shell.tsx` existed in the correct folder.
- TypeScript accepted all new placeholder route pages.
- Staged file review confirmed only the intended web/i18n implementation files were included.

### Issues found and resolved

- New page-shell files temporarily showed VS Code errors while the implementation was partially applied. Resolved by completing `page-shell.tsx`, all route pages, `packages/i18n/src/index.ts`, and all 7 JSON message files.
- VS Code showed stale or misleading errors before the full implementation was saved. Resolved before final verification.
- Prettier found formatting drift after the page-shell skeleton files were added. Resolved with `pnpm.cmd exec prettier --write .`, then re-verified with `format:check`, `typecheck`, `lint`, `build`, and Git whitespace checks.
- `git diff --stat` initially showed only tracked files and excluded new untracked route pages. Resolved by checking `git ls-files --others --exclude-standard` before staging.
- The staged batch was reviewed with `git diff --cached --stat`, `git diff --cached --name-status`, and `git diff --cached --check` before commit.

### Security notes

- No auth was added.
- No database was added.
- No storage was added.
- No QR portal was added.
- No tickets backend was added.
- No CRUD was added.
- No dashboard data was added.
- No private file URLs were exposed.
- No regulatory, legal, safety, CE, Machinery Regulation, or CRA compliance guarantee was added.
- Placeholder copy stays within evidence readiness, documentation organization, secure-by-default direction, customer-visible files, and private engineering docs.

### i18n notes

- All new route navigation labels use translation keys.
- All placeholder page titles, descriptions, and empty states use translation keys.
- Supported locales remain: en, cs, sk, pl, de, fr, es.
- `appMessages` now exposes `pages` messages.
- Uploaded document translation is still not included.

### Not included yet

- real authentication
- Supabase Auth
- PostgreSQL
- Prisma
- tenant isolation
- RBAC
- document upload
- private storage
- signed URLs
- QR portal
- ticket backend
- machine/customer/document CRUD
- dashboard data
- software timeline
- spare parts logic
- quote flow
- feedback collection logic
- deployment

### Commit message

`feat(web): add translated page shell skeletons`

---

## 2026-06-09

### Phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

### Task completed

Added industrial polish for translated Phase 1 shell pages.

This did not complete Phase 1. Current full beta roadmap completion remained 5%.

Practical Phase 1 progress was approximately 80-85%.

### Files/folders changed

- apps/web/package.json
- apps/web/postcss.config.mjs
- apps/web/src/app/globals.css
- apps/web/src/app/[locale]/layout.tsx
- apps/web/src/app/[locale]/dashboard/page.tsx
- apps/web/src/app/[locale]/login/page.tsx
- apps/web/src/app/[locale]/settings/page.tsx
- apps/web/src/components/app-nav.tsx
- apps/web/src/components/app-shell.tsx
- packages/i18n/messages/en.json
- packages/i18n/messages/cs.json
- packages/i18n/messages/sk.json
- packages/i18n/messages/pl.json
- packages/i18n/messages/de.json
- packages/i18n/messages/fr.json
- packages/i18n/messages/es.json
- pnpm-lock.yaml

### Test result

Passed:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- final `git status --short` after commit was clean

### Build result

Production build passed after Tailwind/PostCSS CSS pipeline was added.

Production build continued to confirm the localized placeholder routes:

- `/[locale]/dashboard`
- `/[locale]/documents`
- `/[locale]/feedback`
- `/[locale]/login`
- `/[locale]/machines`
- `/[locale]/settings`
- `/[locale]/spare-parts`
- `/[locale]/tickets`

### Manual/runtime result

Manual browser checks completed:

- `/en`
- `/en/dashboard`
- `/en/login`
- `/en/settings`
- `/cs/dashboard`
- `/en#privacy`
- `/en#security`
- `/en#data-protection`

Manual browser result:

- header rendered on localized pages
- language switcher rendered
- active navigation state worked
- dashboard placeholder cards rendered
- login remained placeholder-only
- settings placeholder sections rendered
- Czech dashboard route loaded
- footer anchors navigated to the expected landing sections
- Next.js dev tools overlay was ignored as development-only UI

CSS verification result:

- Next dev served a real CSS asset under `/_next/static/chunks/`
- the CSS asset was non-empty
- the CSS asset contained Tailwind utility output such as `bg-neutral-950` and `text-stone-50`
- browser pages rendered as styled shell pages, not plain HTML

### Issues found and resolved

- New `app-nav.tsx` was initially untracked and invisible to normal `git diff` review. Resolved by checking untracked files before staging and ensuring the new file was included in the final commit.
- Browser testing initially showed a hydration mismatch related to browser translation behavior. Resolved as a test-environment issue by testing with translation disabled.
- Browser testing initially showed plain HTML-looking output. Root cause was missing/incomplete Tailwind/PostCSS CSS pipeline even though the UI used Tailwind utility classes. Resolved by adding `apps/web/src/app/globals.css`, `apps/web/postcss.config.mjs`, required Tailwind/PostCSS development dependencies, and importing `globals.css` from the localized layout.
- `apps/web/src/app/globals.css` initially failed Prettier format check. Resolved before final verification.
- A generated `apps/web/next-env.d.ts` drift occurred during dev server testing. Resolved by restoring the generated file before commit.

### Security notes

- No auth was added.
- No Supabase Auth was added.
- No database was added.
- No storage was added.
- No QR portal was added.
- No tickets backend was added.
- No CRUD was added.
- No dashboard data was added.
- No real settings functionality was added.
- No account updates were added.
- No password handling was added.
- No form submission was added.
- No private file URLs were exposed.
- No regulatory, legal, safety, CE, Machinery Regulation, or CRA compliance guarantee was added.
- Placeholder copy stays within evidence readiness, documentation organization, secure-by-default direction, customer-visible files, private engineering docs, and secure-by-default direction.

### i18n notes

- Active navigation labels use translation keys.
- Dashboard placeholder cards use translation keys.
- Login secure-entry placeholder content uses translation keys.
- Settings placeholder sections use translation keys.
- Supported locales remain: en, cs, sk, pl, de, fr, es.
- All 7 locale message files were updated.
- Uploaded document translation is still not included.

### Not included yet

- real authentication
- Supabase Auth
- PostgreSQL
- Prisma
- tenant isolation
- RBAC
- document upload
- private storage
- signed URLs
- QR portal
- ticket backend
- machine/customer/document CRUD
- dashboard data
- software timeline
- spare parts logic
- quote flow
- feedback collection logic
- deployment

### Commit message

`feat(web): polish translated phase 1 shell`

---

## 2026-06-09

### Phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

### Task completed

Completed the final Phase 1 shell foundation slice.

This formally completed Phase 1 according to the roadmap criteria.

Full beta roadmap completion moved from 5% to 12%.

### Files/folders changed

- apps/web/src/app/[locale]/page.tsx
- apps/web/src/app/[locale]/machines/[machineId]/page.tsx
- packages/i18n/messages/en.json
- packages/i18n/messages/cs.json
- packages/i18n/messages/sk.json
- packages/i18n/messages/pl.json
- packages/i18n/messages/de.json
- packages/i18n/messages/fr.json
- packages/i18n/messages/es.json

### Test result

Passed:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- `git diff --stat`
- `git diff --name-status`
- `git ls-files --others --exclude-standard`
- final `git status --short` after commit was clean

### Build result

Production build passed.

Production build confirmed the translated machine detail shell route existed through the localized App Router structure:

- `/[locale]/machines/[machineId]`

### Manual/runtime result

Manual browser checks completed:

- `/en`
- `/en/machines/example-machine`
- `/cs/machines/example-machine`
- localized navigation routes
- `/en#privacy`
- `/en#security`
- `/en#data-protection`

Manual browser result:

- styled landing page rendered
- narrow/mobile layout was reviewed manually
- translated app shell rendered
- header rendered
- footer rendered
- language switcher rendered
- active navigation state still worked
- machine detail shell rendered as placeholder-only
- Czech machine detail route loaded
- footer anchors navigated to the expected landing sections
- no real machine data appeared
- no fake operational metrics appeared
- no backend data was requested

### Phase 1 exit-condition result

Roadmap Phase 1 exit condition:

- user can click through serious industrial UI
- language switching works
- product already communicates secure-by-default positioning

Result:

- passed

Phase 1 is formally complete.

### Issues found and resolved

- During final review, the roadmap criteria were checked against the completed implementation before declaring Phase 1 complete. The documented criteria matched the delivered shell scope.
- The dev server could not start a second time on port 3000 because an existing server was already running. Resolved by using the existing `localhost:3000` server for browser verification instead of starting a duplicate server.
- Final wording initially risked using wording equivalent to compliance outcomes. Resolved by using safer wording around regulatory outcomes, review outcomes, and approval outcomes.
- A generated `apps/web/next-env.d.ts` drift occurred during dev server testing. Resolved by restoring the generated file before commit.
- Final staging review confirmed only the intended localized web/i18n files were included.

### Security notes

- No auth was added.
- No Supabase Auth was added.
- No database was added.
- No storage was added.
- No QR portal was added.
- No ticket backend was added.
- No CRUD was added.
- No dashboard data was added.
- No machine CRUD was added.
- No customer data was added.
- No document upload was added.
- No document download was added.
- No real machine data was connected.
- No private file URLs were exposed.
- No regulatory, legal, safety, CE, Machinery Regulation, CRA, or compliance guarantee was added.
- Final landing and machine-detail wording stayed within evidence readiness, documentation organization, secure-by-default direction, customer-visible files, private engineering docs, regulatory outcomes, review outcomes, and approval outcomes.

### i18n notes

- Final landing polish uses translation keys.
- Machine detail shell text uses translation keys.
- Machine detail placeholder sections use translation keys.
- All 7 locale message files were updated:
  - en
  - cs
  - sk
  - pl
  - de
  - fr
  - es
- Supported locales remain: en, cs, sk, pl, de, fr, es.
- Uploaded document translation is still not included.

### Not included

- real authentication
- Supabase Auth
- PostgreSQL
- Prisma
- tenant isolation
- RBAC
- document upload
- private storage
- signed URLs
- QR portal
- ticket backend
- machine/customer/document CRUD
- real dashboard data
- software timeline logic
- spare parts logic
- quote flow
- feedback collection logic
- deployment

### Commit message

`feat(web): complete phase 1 shell foundation`

---

## 2026-06-09

### Phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

### Task completed

Completed post-review Phase 1 hardening before starting Phase 2.

This did not add Phase 2 scope.

Full beta roadmap completion remains 12%.

### Review source

A second external review checked the completed Phase 1 shell against the roadmap, i18n requirements, accessibility structure, lint/build tooling, and scope boundaries.

The review verdict was:

- Pass - ready for Phase 2

### Files/folders changed

- apps/web/src/app/[locale]/page.tsx
- apps/web/src/app/[locale]/dashboard/page.tsx
- apps/web/src/app/[locale]/login/page.tsx
- apps/web/src/app/[locale]/settings/page.tsx
- apps/web/src/app/[locale]/machines/[machineId]/page.tsx
- apps/web/src/components/page-shell.tsx
- eslint.config.mjs
- package.json
- apps/web/package.json
- packages/i18n/package.json
- packages/i18n/src/index.ts
- pnpm-lock.yaml
- pnpm-workspace.yaml
- docs/phase-log.md
- docs/decisions.md

### Hardening completed

- Removed nested `<main>` landmarks from page-level wrappers and kept `AppShell` as the single owner of the page `<main>` landmark.
- Strengthened ESLint quality gates with Next.js, JSX accessibility, and React hooks lint rules.
- Moved ESLint to a plugin-compatible supported major version.
- Disabled the Pages Router-only `@next/next/no-html-link-for-pages` rule because BuildTrace uses the Next.js App Router.
- Explicitly approved trusted native build dependencies through `pnpm-workspace.yaml`.
- Unified locale source of truth by making `packages/shared` the canonical owner of supported locales.
- Updated `packages/i18n` to reuse the shared locale source and declare `@buildtrace/shared` as a workspace dependency.
- Removed unused `next-intl` dependency from the web app because Phase 1 uses the internal `appMessages` i18n foundation.

### Related commits

- `a90ed1d fix(web): remove nested main landmarks`
- `60e340c chore: strengthen lint quality gates`
- `7dedbbd chore(i18n): use shared locale source`
- `24ebf0f chore(web): remove unused next-intl dependency`

### Test result

Passed across the hardening steps:

- `pnpm.cmd install --frozen-lockfile`
- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd turbo lint --force`
- `pnpm.cmd build`
- `git diff --check`
- staged diff checks before commit

### Issues found and resolved

- External review found nested `<main>` landmarks. Resolved by keeping only the `AppShell` `<main>` and changing child page wrappers to `<div>`.
- External review found the lint gate was too weak for Next.js, accessibility, and React hooks. Resolved by adding the appropriate lint plugins and forcing lint verification.
- ESLint 10 caused peer compatibility risk with the accessibility lint plugin. Resolved by aligning ESLint to supported 9.x.
- The Next.js Pages Router link rule emitted a warning in an App Router project. Resolved by disabling that specific Pages Router-only rule while keeping the rest of the Next.js lint rules.
- `pnpm install` required explicit native build dependency approval. Resolved by recording trusted build dependencies in `pnpm-workspace.yaml`.
- External review found duplicate locale sources. Resolved by using `packages/shared` as the canonical locale source.
- External review found `next-intl` was installed but unused. Resolved by removing it until the project intentionally adopts it.

### Security notes

- No auth was added.
- No Supabase Auth was added.
- No database was added.
- No storage was added.
- No QR portal was added.
- No ticket backend was added.
- No CRUD was added.
- No real dashboard data was added.
- No real machine data was added.
- No document upload was added.
- No private file URLs were exposed.

### Commit message

`docs: record phase 1 hardening decisions`

---

## 2026-06-10

### Phase

Phase 2 - Database + auth + tenancy.

### Task completed

Started Phase 2 with a docs-only trust-foundation decision preflight.

This was not a database implementation step yet.

### Files/folders changed

- docs/decisions.md
- docs/security.md
- docs/data-protection.md
- docs/next-steps.md
- docs/phase-log.md

### Decisions recorded

- Phase 2 starts with organizations, users, and activity log only
- product tables remain owned by their roadmap phases
- application-layer tenant guards are the first implemented isolation layer
- RLS must not be claimed until configured and tested
- internal BuildTrace user ID maps to external Supabase `auth_user_id`
- web/API auth boundary is explicit
- service-role secrets stay server-side only
- Prisma generation must be wired into Turbo before dependent gates
- Prisma enum mirrors require immediate drift checks
- migrations must be validated from zero against disposable PostgreSQL
- activity logs are append-only
- IP address and user agent handling requires documented purpose and retention expectation

### Scope notes

No implementation was added.

This step did not add:

- Prisma schema
- database migrations
- Supabase Auth integration
- tenant guards
- RBAC logic
- storage
- QR portal
- tickets backend
- CRUD
- product tables
- dashboard data

### Test result

Passed:

- `pnpm.cmd format:check`
- `pnpm.cmd turbo typecheck --force`
- `pnpm.cmd turbo lint --force`
- `pnpm.cmd turbo build --force`
- `git diff --check`
- staged diff checks before commit

### Commit message

`docs: lock phase 2 trust foundation decisions`

---

## 2026-06-10

### Phase

Phase 2 - Database + auth + tenancy.

### Task completed

Implemented the Phase 2 database, auth, tenancy, and activity-log trust foundation.

This completed the core Phase 2 implementation scope without adding later-phase product workflows.

Full beta roadmap completion moved from 12% to 22% after Phase 2 documentation closeout.

### Implementation commits

- `7324175 chore(db): add prisma tooling foundation`
- `a81137d feat(db): add phase 2 trust schema`
- `c64aa5a chore(db): add initial trust schema migration`
- `484a227 chore(db): add prisma client factory`
- `222cab4 chore(api): add supabase auth config boundary`
- `75561b3 chore(api): add supabase token verifier`
- `c0c30a4 chore(api): add bearer authorization parser`
- `e96cacf test(api): add auth boundary smoke check`
- `c4ba492 chore: stop caching generated prisma output`
- `b989f4e feat(api): add current user resolution foundation`
- `c4f6bac feat(api): add tenant access guard foundation`
- `c574790 test(api): add tenant access smoke check`
- `fce41c3 feat(api): compose authenticated tenant context`
- `b27d90d feat(db): add activity log helper`
- `ec2b2f1 test(db): add activity log smoke check`

### Files/folders changed

- .gitignore
- .prettierignore
- eslint.config.mjs
- turbo.json
- pnpm-workspace.yaml
- pnpm-lock.yaml
- packages/db/package.json
- packages/db/prisma.config.ts
- packages/db/prisma/schema.prisma
- packages/db/prisma/migrations/20260610143537_init_trust_schema/migration.sql
- packages/db/prisma/migrations/migration_lock.toml
- packages/db/src/index.ts
- packages/db/src/client.ts
- packages/db/src/activity-log.ts
- packages/db/src/activity-log-smoke-check.ts
- packages/db/tsconfig.json
- apps/api/package.json
- apps/api/src/auth-config.ts
- apps/api/src/auth-verifier.ts
- apps/api/src/authorization-header.ts
- apps/api/src/auth-smoke-check.ts
- apps/api/src/current-user.ts
- apps/api/src/tenant-access.ts
- apps/api/src/tenant-access-smoke-check.ts
- apps/api/src/authenticated-tenant-context.ts

### Completed foundation

- Added Prisma tooling foundation in `packages/db`.
- Added PostgreSQL datasource configuration.
- Added Prisma schema for organizations, app users, organization memberships, and activity logs.
- Added `OrganizationRole` enum with `OWNER`, `ADMIN`, and `MEMBER`.
- Generated and committed the initial migration.
- Validated the migration from zero against a disposable PostgreSQL database.
- Kept generated Prisma client output ignored and regenerated through package scripts.
- Added Prisma client factory.
- Added API-side Supabase auth config boundary.
- Added API-side bearer-token verifier.
- Added bearer authorization-header parser.
- Added auth boundary smoke check.
- Added API dependency on `@buildtrace/db`.
- Added current-user resolution foundation.
- Added tenant access guard foundation.
- Added tenant access smoke check.
- Added authenticated tenant-context composition helper.
- Added activity-log helper.
- Added activity-log smoke check.
- Updated Turbo generation behavior so generated Prisma output is not treated as a cache artifact.

### Security and tenancy notes

- API helpers verify bearer tokens server-side.
- Supabase service-role secrets are kept in the API/server boundary only.
- The web app does not depend on Supabase or `@buildtrace/db`.
- Authenticated Supabase user IDs map to internal app users through `auth_user_id`.
- Tenant access is checked through organization memberships.
- Product-specific RBAC is not claimed yet.
- Database row-level security is not claimed yet.
- The implemented tenant foundation is API-layer only.

### Activity-log notes

- Activity logs are append-only through the exposed helper.
- The helper validates required organization ID and action.
- Optional text fields are normalized before insert.
- Activity logs must not store secrets, passwords, tokens, signed URLs, uploaded file contents, or sensitive engineering file contents.
- Phase 2 stores nullable `actor_user_id` for authenticated internal app users.
- `actor_type` is deferred until the first non-`AppUser` activity-log producer exists.

### Migration validation

Passed:

- PostgreSQL 17 local tooling installed through `winget`.
- PostgreSQL server verified as accepting connections on `localhost:5432`.
- Disposable `buildtrace_migration_test` database created.
- `DATABASE_URL` set only in the local PowerShell session.
- `pnpm.cmd --filter @buildtrace/db exec prisma migrate dev --name init_trust_schema`
- `pnpm.cmd --filter @buildtrace/db exec prisma migrate status`
- `psql` table listing confirmed:
  - `_prisma_migrations`
  - `organizations`
  - `app_users`
  - `organization_memberships`
  - `activity_logs`
- migration table confirmed `20260610143537_init_trust_schema`

### Smoke checks

Passed:

- `pnpm.cmd --filter @buildtrace/api run auth:smoke`
- `pnpm.cmd --filter @buildtrace/api run tenant:smoke`
- `pnpm.cmd --filter @buildtrace/db run activity:smoke`

### Test result

Passed across the Phase 2 implementation slices:

- `pnpm.cmd --filter @buildtrace/db run prisma:validate`
- `pnpm.cmd --filter @buildtrace/db typecheck`
- `pnpm.cmd --filter @buildtrace/db lint`
- `pnpm.cmd --filter @buildtrace/db build`
- `pnpm.cmd --filter @buildtrace/api typecheck`
- `pnpm.cmd --filter @buildtrace/api lint`
- `pnpm.cmd --filter @buildtrace/api build`
- `pnpm.cmd format:check`
- `pnpm.cmd turbo typecheck --force`
- `pnpm.cmd turbo lint --force`
- `pnpm.cmd turbo build --force`
- `git diff --check`
- staged diff checks before each commit
- final `git status --short` checks before pushing each slice

### Issues found and resolved

- Docker was not installed. Resolved by using local PostgreSQL instead of Docker for migration-from-zero validation.
- PostgreSQL command-line tools were installed but not on PATH. Resolved by using full executable paths under `C:\Program Files\PostgreSQL\17\bin`.
- PostgreSQL password was not known after install. Resolved by temporarily using a backed-up `pg_hba.conf`, resetting the password through `psql`, restoring the original `pg_hba.conf`, and restarting the service.
- `DATABASE_URL` initially contained a placeholder password. Resolved by clearing it and setting a session-only value from a secure prompt.
- `createdb` initially failed authentication. Resolved after password reset and service restart.
- Prisma migration files were initially untracked. Resolved by checking untracked files and staging `packages/db/prisma/migrations`.
- Generated Prisma client output was intentionally not staged because it is generated and ignored.
- `tsx` was missing from `@buildtrace/db` when adding the activity-log smoke check. Resolved by adding `tsx` as a `@buildtrace/db` dev dependency.
- Early smoke-check files triggered Prettier warnings. Resolved by formatting changed human-authored files and rerunning gates.
- Turbo generated-output caching risk was found during Phase 2. Resolved by stopping generated Prisma output from being treated as a cached artifact.

### Scope notes

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
- product-specific RBAC
- database row-level security claims
- production rate limiting
- deployment

---

## 2026-06-11

### Phase

Phase 2 - Database + auth + tenancy review hardening and closeout.

### Task completed

Closed the Phase 2 review-hardening loop after external senior-engineering review.

This completed the trailing Phase 2 docs, decision, security, data-protection, tooling, and health-label consistency fixes before Phase 3 begins.

This did not add product features.

This did not start Phase 3 product implementation.

### Review source

An external senior-engineering review first gave Phase 2 this verdict:

- Pass with concerns

The first review found no critical code issue.

The review concerns were:

- state-bearing docs still described Phase 2 as future work
- `docs/phase-log.md` did not record Phase 2 implementation commits
- the `actor_type` Step 0 sketch was not implemented or documented
- the membership model changed from the Step 0 sketch without a decision record
- activity-log organization deletion behavior needed to be documented
- `packages/db/prisma.config.ts` and `apps/api/src/main.ts` needed small consistency follow-up fixes

A final re-review after hardening gave Phase 2 this verdict:

- Pass - Phase 2 is closed
- cleared for Phase 3
- no critical issues
- no blockers
- one trailing docs nit only

### Documentation hardening commits

- `85533c8 docs: update phase 2 project state`
- `d011307 docs: record phase 2 decision reconciliation`
- `9d53700 docs: update phase 2 security and data protection state`
- `c58db3f docs: update phase 2 roadmap state`
- `4d779b9 docs: update phase 2 next steps`
- `18b4ccf docs: update phase 2 phase log`

### Code and tooling hardening commits

- `e50ad23 fix(db): require database url in prisma config`
- `21ed8f0 fix(api): update health phase label`
- `7960188 fix: pass database url through turbo tasks`

### Files/folders changed

- docs/project-state.md
- docs/decisions.md
- docs/security.md
- docs/data-protection.md
- docs/roadmap.md
- docs/next-steps.md
- docs/phase-log.md
- packages/db/prisma.config.ts
- apps/api/src/main.ts
- turbo.json

### Hardening completed

- Updated project state to show Phase 2 complete at 22%.
- Updated roadmap to show Phase 2 complete and Phase 3 next.
- Updated next steps to remove stale Phase 2 review-hardening instructions and point to Phase 3 decision preflight.
- Updated security docs from future-tense Phase 2 plan to implemented Phase 2 state.
- Updated data-protection docs with Phase 2 activity-log and data-handling state.
- Recorded the membership-scoped organization role decision.
- Recorded the `actor_type` deferral decision.
- Recorded the audit-log deletion posture.
- Documented that API-layer tenant isolation exists, while RLS is not claimed.
- Documented that auth and tenant helpers exist but are not mounted on real product endpoints yet.
- Updated this phase log with Phase 2 implementation commits, gates, scope notes, hardening notes, and final closeout.
- Removed the placeholder Prisma `DATABASE_URL` fallback.
- Made Prisma config fail clearly when `DATABASE_URL` is missing.
- Updated the API `/health` phase label from `phase-0-foundation` to `phase-2-trust-foundation`.
- Fixed the Turbo root cause where strict environment mode stripped `DATABASE_URL` from Prisma generate/build/typecheck tasks.
- Added `DATABASE_URL` to `globalPassThroughEnv` in `turbo.json`.
- Reran final full Phase 2 gates after the Turbo fix.
- Confirmed working tree clean.
- Completed final external re-review.
- Updated Phase 3 Step 0 planning notes to include web data-access path, bearer-token travel, authenticated-builder provisioning, enum ownership/drift checks, and activity-log action constants.

### Decisions reconciled

Membership model:

- Phase 2 uses `OrganizationMembership`.
- Roles are `OWNER`, `ADMIN`, and `MEMBER`.
- Product-specific roles are deferred to the phases that introduce the workflows they protect.

Actor typing:

- Phase 2 activity logs use nullable `actor_user_id` for authenticated internal app users.
- `actor_type` is deferred until the first non-`AppUser` activity-log producer is implemented.
- Non-user actors must not be faked as `AppUser` records.

Audit-log deletion posture:

- Activity logs are tenant-owned records.
- In Phase 2, deleting an organization cascades to its activity logs.
- Audit-log retention must be revisited before production organization deletion workflows.

RLS wording:

- BuildTrace must not claim database row-level security is implemented.
- Current tenant isolation is API-layer only.
- RLS may be considered later only after it is configured and tested with the chosen Prisma/Supabase setup.

Turbo environment handling:

- Prisma config intentionally requires `DATABASE_URL`.
- Turbo strict environment mode must pass `DATABASE_URL` into Prisma generate/build/typecheck tasks.
- `DATABASE_URL` is passed through via `globalPassThroughEnv`.
- The variable value is not committed to source.
- The variable value is not added to cache hashing as a machine-specific cache invalidator.

Phase 3 Step 0 planning:

- Web data-access path must be decided before connecting the machine shell to real data.
- Bearer-token travel from browser session to API calls must be decided before machine pages load real data.
- Authenticated-builder and development provisioning must be decided before claiming secure machine creation.
- Machine status enum ownership and drift checks must be decided before adding localized status labels.
- Activity-log action naming must be represented by typed constants before first real call sites.

### Issues found and resolved

- An early `docs/project-state.md` closeout attempt was too broad and was reverted with `9de6c26 Revert "docs: update phase 2 project state"`.
- The project-state doc was then redone cleanly with `85533c8 docs: update phase 2 project state`.
- The decision log still described Phase 2 as next and did not record the membership, actor typing, or audit-log deletion decisions. Resolved in `d011307`.
- Security and data-protection docs still described Phase 2 in future tense. Resolved in `9d53700`.
- Roadmap still showed Phase 2 as next and completion at 12%. Resolved in `c58db3f`.
- Next steps still instructed the project not to start Phase 2 implementation. Resolved in `4d779b9`.
- Phase log did not yet record Phase 2 implementation and hardening history. Resolved in `18b4ccf`.
- Prisma config used a placeholder fallback `DATABASE_URL`. Resolved in `e50ad23`.
- API health still reported `phase-0-foundation`. Resolved in `21ed8f0`.
- Final gates exposed that Turbo stripped `DATABASE_URL` from Prisma tasks. Resolved at the root in `7960188`.
- Final external re-review found a trailing-docs nit: `docs/phase-log.md` was missing `e50ad23`, `21ed8f0`, and `7960188`; `docs/next-steps.md` had a stale latest pushed commit list. Resolved in this docs freshness slice.
- Final Phase 3 planning review found that Step 0 needed explicit decisions for web data-access path, bearer-token travel, authenticated-builder provisioning, enum ownership/drift checks, and activity-log action constants. Resolved in `docs/next-steps.md`.
- During manual paste of `docs/next-steps.md`, the file was briefly truncated near the command section. Resolved by replacing the file with the full intended ready-to-paste version before staging.
- Corrupted dash characters in `docs/roadmap.md` headings were replaced with plain ASCII hyphens.

### Test result

Final Phase 2 hardening gates passed after `7960188`:

- `pnpm.cmd format:check`
- `pnpm.cmd --filter @buildtrace/db run prisma:validate`
- `pnpm.cmd --filter @buildtrace/api run auth:smoke`
- `pnpm.cmd --filter @buildtrace/api run tenant:smoke`
- `pnpm.cmd --filter @buildtrace/db run activity:smoke`
- `pnpm.cmd turbo typecheck --force`
- `pnpm.cmd turbo lint --force`
- `pnpm.cmd turbo build --force`
- `git diff --check`
- `git diff --stat`
- `git diff --name-status`
- `git ls-files --others --exclude-standard`
- `git status --short`
- `git log --oneline -8`

Final gate summary:

- format: passed
- Prisma validate: passed
- auth smoke: passed
- tenant smoke: passed
- activity smoke: passed
- typecheck: 8 successful, 8 total
- lint: 7 successful, 7 total
- build: 8 successful, 8 total
- Git diff checks: clean
- no untracked files
- working tree clean
- `origin/main` current at `7960188`

### Remaining review-hardening items

None before Phase 3.

The final external re-review found one small trailing-docs nit:

- `docs/phase-log.md` needed to record `e50ad23`, `21ed8f0`, and `7960188`
- `docs/next-steps.md` needed the latest pushed commit list updated from stale `c58db3f`

This entry resolves the `docs/phase-log.md` side of that nit.

A follow-up planning review found Phase 3 Step 0 needed explicit decision coverage for:

- web data-access path
- bearer-token travel from browser session to API calls
- authenticated-builder and development provisioning path
- enum ownership and drift checks
- activity-log action constants

`docs/next-steps.md` now tracks these as required Step 0 decisions.

### Scope notes

This Phase 2 hardening did not add:

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
- product-specific RBAC
- database row-level security claims
- production rate limiting
- deployment

### Commit message

`docs: close phase 2 hardening notes`

## 2026-06-14 - Phase 3 final runtime verification

### Scope

Closed the Phase 3 machine records vertical slice after browser runtime verification against the real local API, local database, Supabase auth boundary, tenant session cookies, and web UI.

### Verified runtime flow

- Loaded local `.env` values into PowerShell for database, Supabase, API, and web runtime.
- Ran the development bootstrap successfully for `buildtrace-development`.
- Started the API server with the required Supabase and database environment.
- Started the web server on `http://localhost:3000`.
- Loaded `http://localhost:3000/en/machines`.
- Set the machine-record tenant cookies using:
  - `buildtrace_machine_records_organization_id`
  - `buildtrace_machine_records_access_token`
- Confirmed the machines page loads through the API-backed session boundary.
- Confirmed customer, machine model, and machine counts load from real API data.
- Confirmed create customer, create machine model, and create machine forms are visible.
- Confirmed an existing machine record appears in the machine list.
- Confirmed the machine detail route opens by real machine id.
- Confirmed the machine detail page shows real machine data.
- Confirmed the machine update form is visible and wired through the Phase 3 update path.

### Final verification commands

- `pnpm.cmd --filter @buildtrace/db run machine-records:smoke`
- `pnpm.cmd --filter @buildtrace/db typecheck`
- `pnpm.cmd --filter @buildtrace/db lint`
- `pnpm.cmd --filter @buildtrace/db build`
- `pnpm.cmd --filter @buildtrace/api run machine-records:smoke`
- `pnpm.cmd --filter @buildtrace/api typecheck`
- `pnpm.cmd --filter @buildtrace/api lint`
- `pnpm.cmd --filter @buildtrace/api build`
- `pnpm.cmd --filter @buildtrace/web run machine-records:smoke`
- `pnpm.cmd --filter @buildtrace/web run machine-records:session-smoke`
- `pnpm.cmd --filter @buildtrace/web typecheck`
- `pnpm.cmd --filter @buildtrace/web lint`
- `pnpm.cmd --filter @buildtrace/web build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git status --short`

All final checks passed. Working tree was clean before push.

### Final pushed Phase 3 commits

- `8614eca fix(web): align machine record session cookies`
- `6c213e2 feat(web): add machine update form`
- `29af4af feat(web): add machine update api client`
- `beb362f feat(api): add machine update endpoint`
- `3a561da feat(db): add machine update helper`

### Phase 3 closeout status

Phase 3 machine records are implementation-complete and runtime-verified. Remaining closeout work is documentation alignment in roadmap and next-steps before marking Phase 3 fully complete.

## Phase 4 document dump upload closeout

Phase 4 is complete.

Full beta roadmap completion moved from about 32% to about 45%.

Verified shipped scope:

- shared document categories, visibility levels, language codes, defaults, and drift checks
- Prisma document metadata schema and migration
- organization-scoped document metadata tied to machines
- private Supabase Storage bucket configuration
- service-role storage write boundary
- browser document upload through API and web server action boundaries
- signed temporary document download URLs
- document category update
- document visibility update
- activity logs for document upload, signed download URL issuance, category change, and visibility change
- Phase 4 dev preflight for env, DB membership, private bucket, and service-role storage write readiness

Final verification passed:

- `pnpm.cmd dev:preflight`
- `pnpm.cmd --filter @buildtrace/shared run document-constants:smoke`
- `pnpm.cmd --filter @buildtrace/shared typecheck`
- `pnpm.cmd --filter @buildtrace/shared lint`
- `pnpm.cmd --filter @buildtrace/shared build`
- `pnpm.cmd --filter @buildtrace/db run document-schema:drift`
- `pnpm.cmd --filter @buildtrace/db run document-records:isolation`
- `pnpm.cmd --filter @buildtrace/db typecheck`
- `pnpm.cmd --filter @buildtrace/db lint`
- `pnpm.cmd --filter @buildtrace/db build`
- `pnpm.cmd --filter @buildtrace/api run document-storage:smoke`
- `pnpm.cmd --filter @buildtrace/api run document-upload:smoke`
- `pnpm.cmd --filter @buildtrace/api run document-upload-endpoint:smoke`
- `pnpm.cmd --filter @buildtrace/api run document-records:smoke`
- `pnpm.cmd --filter @buildtrace/api run routes:smoke`
- `pnpm.cmd --filter @buildtrace/api typecheck`
- `pnpm.cmd --filter @buildtrace/api lint`
- `pnpm.cmd --filter @buildtrace/api build`
- `pnpm.cmd --filter @buildtrace/web run document-records:smoke`
- `pnpm.cmd --filter @buildtrace/web run machine-records:session-smoke`
- `pnpm.cmd --filter @buildtrace/web run machine-records:smoke`
- `pnpm.cmd --filter @buildtrace/web typecheck`
- `pnpm.cmd --filter @buildtrace/web lint`
- `pnpm.cmd --filter @buildtrace/web build`
- `pnpm.cmd format:check`
- `git diff --check`

Browser/runtime proof:

- machine list loaded through API session boundary
- machine detail loaded through API session boundary
- document uploaded through private API storage boundary
- uploaded document listed on machine detail
- signed download URL opened the private stored document
- category update saved from browser
- visibility update saved from browser
- DB activity-log query showed:
  - `document.uploaded`
  - `document.download_url_issued`
  - `document.category_changed`
  - `document.visibility_changed`

Issues found and resolved:

- missing `DOCUMENT_STORAGE_BUCKET` in local `.env`
- Supabase bucket did not exist
- service-role env var accidentally held anon key
- storage RLS blocked writes until private bucket and service-role policy were correctly configured
- browser token/session cookies were stale after restarts
- document upload form incorrectly set `encType`/`method` on a React server-action form
- category and visibility updates initially did not write activity logs; fixed in `b36a19b`

Out of scope for Phase 4:

- AI document classification
- QR customer portal access
- handover completeness scoring
- export packaging
- ticket workflows
- spare-parts intelligence

## 2026-06-17 - Phase 5 document classification closeout

Phase 5 is complete.

Full beta roadmap completion moved from about 45% to about 55%.

Verified shipped scope:

- classification boundary decision locked
- shared classification constants
- DB classification metadata
- filename/type classifier
- DB persistence of suggestions
- API exposure and refresh endpoint
- web API client support
- machine detail UI display and refresh action
- explicit builder confirmation action
- status transition to manually-confirmed
- classification source transition to manual
- activity log action document.classification_confirmed
- confirmation preserves visibility and customer exposure
- stale metadata controls fixed after server-action confirmation
- dev browser-session bootstrap added for repeatable browser verification

Final verification passed:

- `pnpm.cmd dev:preflight`
- `pnpm.cmd --filter @buildtrace/web run document-records:smoke`
- `pnpm.cmd --filter @buildtrace/web typecheck`
- `pnpm.cmd --filter @buildtrace/web lint`
- `pnpm.cmd --filter @buildtrace/web build`
- `pnpm.cmd --filter @buildtrace/api typecheck`
- `pnpm.cmd --filter @buildtrace/api lint`
- `pnpm.cmd --filter @buildtrace/api build`
- `pnpm.cmd format:check`
- `git diff --check`

Browser/runtime proof:

- machine detail loaded through API session boundary
- document classification suggestion displayed
- refresh suggestion action worked
- explicit confirm suggested category action worked
- category changed to the suggested category only after explicit builder action
- classification status showed manually confirmed
- classification source showed manual
- visibility stayed internal
- category dropdown remounted to the confirmed category after reload
- no product-breaking browser/API error remained

Final pushed Phase 5 commits:

- `dfb57f2 test(api): add dev browser session bootstrap`
- `950f55f fix(web): remount document metadata controls after confirmation`
- `812100e feat(web): confirm document classification suggestions`
- `52fe84e feat(api): confirm document classification suggestions`
- `e503366 feat(db): confirm document classification suggestions`
- `48342d9 feat(web): show document classification suggestions`
- `503a381 feat(api): expose document classification suggestions`
- `26d29c9 fix(db): persist document classification suggestions`
- `bf0ba38 fix(shared): align classifier exports with web bundler`
- `ea48307 feat(shared): add document filename classifier`
- `255c5f9 feat(db): add document classification metadata`
- `e88857a feat(shared): add document classification constants`
- `0e9f724 docs: lock phase 5 classification boundary`

Out of scope for Phase 5:

- AI classification
- OCR
- PDF text extraction
- vector search
- worker queues
- automatic visibility changes
- QR customer portal access
- handover completeness scoring
- export packaging

## 2026-06-20 - Phase 6 - Handover completeness + export closeout

Phase 6 is complete.

Full beta roadmap completion moved from about 55% to about 65%.

Verified shipped scope:

- shared completeness evaluator and export manifest builder
- shared ZIP entry builder with traversal guards
- i18n document labels and handover completeness copy (all 7 locales)
- i18n handover export copy (all 7 locales) including sensitive warning
- DB data_exports schema with CHECK constraints and migrations
- DB export creation/revalidation/finalization helpers
- DB export list helper (`listSucceededCustomerHandoverExports`)
- API completeness endpoint
- API export create endpoint with sensitive-file detection
- API export list endpoint
- API export ZIP download-url endpoint
- API export PDF download-url endpoint
- API ZIP archive builder with fflate + SHA-256 checksum
- API PDF summary generator with Playwright (localized, all 7 locales)
- API export storage (Supabase) with upload/remove/signed URL for ZIP and PDF
- API recovery path on export failure
- web handover completeness API client
- web export API client (create, list, ZIP download URL, PDF download URL)
- handover completeness widget in machine detail page
- export trigger UI with customer-visible document selection
- export history list UI with ZIP and PDF download buttons
- sensitive-file warning banner on export creation
- localized PDF summary generated and stored privately

Phase 6 commits:

- `6b73c4d docs: update agent context for Phase 6 partial progress`
- `3e722a5 feat(web): add customer handover export API client and smoke check`
- `3e36193 feat(web): add handover export trigger UI and server action`
- `af46e33 feat: add handover export history list endpoint and UI`
- `1211dea feat: add sensitive-file warning to handover export response and UI`
- `21b20ad feat: add localized PDF summary to customer handover export`
- `fix(api): add playwright dependency for PDF summary generation`

Out of scope for Phase 6:

- QR portal
- service tickets
- software timeline
- spare parts
- quote flow
- feedback collection
- production deployment

## 2026-06-21 - Phase 7 - QR customer portal closeout

Phase 7 is complete.

Full beta roadmap completion moved from about 65% to about 73%.

Verified shipped scope:

- DB QR portal migration: `qr_token`, `qr_pin_enabled`, `qr_pin_hash`, `portal_default_locale`
- DB QR token helpers: `generateQrToken`, `assignQrToken`, `getQrPortalMachine`, `getMachineQrToken`
- API QR portal controller for assign, get, rotate, disable, and public portal lookup
- API public document list endpoint restricted to customer-visible documents
- API public document download URL endpoint with activity logging
- API portal access logging through `portalMachineOpened` and `portalDocumentDownloaded`
- web public portal page at `/portal/:qrToken`
- web portal layout with no navigation and no authentication
- web portal language switcher for all 7 locales
- web portal document list with signed downloads
- web builder QR token UI in machine detail for assign, rotate, disable, and portal link
- web builder QR portal API client
- i18n QR portal copy for all 7 locales
- i18n QR portal builder copy for all 7 locales

Phase 7 commits:

- `7ca9161 feat(db): add QR portal schema migration and token helpers`
- `3174605 feat(api): add QR portal controller with token assign, rotate, disable, and public lookup`
- `1758e2d feat(web): add public QR portal page with language switcher`
- `6aab2a3 feat: add customer-visible document list and download to QR portal`
- `f1ba8ae feat(web): add builder QR token UI to machine detail page`
- `fa14c09 feat(api): log portal machine opened event on QR portal access`

Out of scope for Phase 7:

- PIN/password protection
- service tickets
- software timeline
- spare parts
- quote flow
- feedback
- production deployment

## 2026-06-21 - Phase 8 - Service tickets + support session closeout

Phase 8 is complete.

Full beta roadmap completion moved from about 73% to about 81%.

Verified shipped scope:

- DB `service_tickets` and `ticket_comments` schema and migration
- DB helpers for ticket creation, listing, lookup, status updates, comments, comment lookup, and meeting details
- authenticated builder API endpoints for ticket and comment management
- public ticket creation from the QR portal
- private ticket comment attachments with signed download URLs
- Fastify native multipart handling for ticket attachments
- support meeting link and meeting notes
- web service tickets API client
- web portal service tickets API client
- builder ticket dashboard in the machine detail page
- public ticket form on the QR portal page
- service-ticket copy for all 7 locales
- rate-limiting note on public ticket creation
- activity logging for ticket created, status updated, and comment added

Final Phase 8 verification passed:

- `pnpm.cmd --filter @buildtrace/shared typecheck`
- `pnpm.cmd --filter @buildtrace/db typecheck`
- `pnpm.cmd --filter @buildtrace/db run service-ticket-records:smoke`
- `pnpm.cmd --filter @buildtrace/i18n typecheck`
- `pnpm.cmd --filter @buildtrace/i18n run service-tickets-copy:smoke`
- `pnpm.cmd --filter @buildtrace/api typecheck`
- `pnpm.cmd --filter @buildtrace/api lint`
- `pnpm.cmd --filter @buildtrace/api run service-tickets:smoke`
- `pnpm.cmd --filter @buildtrace/web run service-tickets:smoke`
- `pnpm.cmd --filter @buildtrace/web run portal-service-tickets:smoke`
- `pnpm.cmd --filter @buildtrace/web typecheck`
- `pnpm.cmd --filter @buildtrace/web build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git status --short`

Phase 8 commits:

- `8061f3a feat(db): add service tickets schema migration and helpers`
- `72b21b0 feat(api): add service ticket endpoints`
- `c754593 feat(web): add service ticket dashboard UI`
- `618333d feat: add public ticket creation from QR portal`
- `3b168ec feat: add ticket comment attachments with signed URLs`
- `acc13d8 feat: add support meeting link field to service tickets`

Out of scope for Phase 8:

- software version timeline
- spare parts
- quote flow
- feedback collection
- production deployment
