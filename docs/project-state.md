# BuildTrace Project State

## Current phase

Phase 2 - Database + auth + tenancy.

Phase 0 is formally complete.

Phase 1 is formally complete.

Phase 2 trust-foundation implementation is complete.

Phase 2 documentation closeout and final review gate are underway.

Completed Phase 2 foundation:

- Prisma tooling and generation workflow
- PostgreSQL trust schema for organizations, app users, organization memberships, and activity logs
- initial trust schema migration validated against PostgreSQL from zero
- Prisma client factory
- Supabase auth configuration boundary
- Supabase bearer token verifier
- bearer authorization header parser
- auth boundary smoke check
- current user resolution foundation
- application-layer tenant access guard foundation
- tenant access smoke check
- authenticated tenant context composition helper
- append-only activity log helper
- activity log smoke check

Next phase after Phase 2:

- Phase 3 - Machine/customer records foundation

## Current beta completion

Phase 0 target: 5% of full beta roadmap.

Phase 0 status: complete.

Phase 1 target: 12% of full beta roadmap.

Phase 1 status: complete.

Phase 2 target: 22% of full beta roadmap.

Phase 2 status: trust-foundation implementation complete.

Current full beta roadmap completion: 22%.

## Latest completed implementation chunk

Phase 2 trust-foundation backend slice completed:

- database tooling and schema foundation
- migration-from-zero validation
- API auth boundary helpers
- current-user and tenant access helpers
- authenticated tenant context helper
- activity log helper and smoke check

Latest implementation commit:

- `ec2b2f1 test(db): add activity log smoke check`

Remote status:

- pushed to `origin/main`

## Completed in Phase 0

- Git repository initialized
- branch set to main
- GitHub remote connected
- pnpm installed and working
- pnpm workspace configured
- Turborepo configured
- strict TypeScript base config created
- ESLint configured
- Prettier configured
- `.prettierignore` created
- `.gitattributes` created to enforce LF line endings
- `.env.example` created with placeholders only
- apps/web created
- apps/api created
- apps/worker created
- packages/db created
- packages/shared created
- packages/i18n created
- packages/ui created
- multilingual base created for en, cs, sk, pl, de, fr, es
- web locale routes created
- root web route redirects to `/en`
- API health endpoint created
- worker placeholder created
- security documentation created
- data-protection documentation created
- data-classification documentation created
- i18n documentation created
- README created
- roadmap created
- phase log created
- decisions log created
- next steps created

## Completed in Phase 1

- Added `LanguageSwitcher` component

- Added language links for:
  - English - en
  - Czech - cs
  - Slovak - sk
  - Polish - pl
  - German - de
  - French - fr
  - Spanish - es

- Mounted language switcher into the translated app shell header

- Added `AppShell` component

- Kept `AppShell` server-side while adding active navigation through a small client component

- Added `AppNav` component

- Added active/current navigation indication

- Added `aria-current="page"` to the active navigation item

- Added translated header foundation

- Added translated footer foundation

- Added route-based app shell navigation for:
  - Home
  - Dashboard
  - Machines
  - Documents
  - Tickets
  - Spare parts
  - Feedback
  - Settings
  - Login

- Updated footer privacy/security/data-protection links to work from localized subpages

- Added translated landing page starter content

- Added final industrial landing page polish

- Added translated evidence-readiness and documentation sections

- Added translated privacy/security/data-protection placeholder sections

- Added reusable `PageShell` component

- Added translated login page shell

- Added translated dashboard page shell

- Added translated machines page shell

- Added translated documents page shell

- Added translated tickets page shell

- Added translated spare-parts page shell

- Added translated feedback page shell

- Added translated settings page shell

- Added translated empty-state placeholder copy for the shell pages

- Added stronger translated dashboard placeholder layout with cards for:
  - handover readiness
  - machine records
  - document organization
  - ticket activity

- Added stronger translated login visual shell for a future secure sign-in entry

- Added translated login placeholders for:
  - identity area
  - session boundary
  - private workspace boundary
  - no-credentials-collected note

- Added stronger translated settings placeholder layout

- Added translated settings sections for:
  - user role
  - preferred language
  - future MFA
  - data export
  - security logs

- Added translated machine detail shell route:
  - `/[locale]/machines/[machineId]`

- Added placeholder-only translated machine detail sections for:
  - machine overview
  - handover readiness
  - documents
  - tickets
  - software timeline
  - spare parts

- Added translated language-switcher labels to all 7 locale message files

- Added translated shell, landing, page-shell, dashboard, login, settings, and machine detail keys to all 7 locale message files

- Renamed misleading `phaseZeroMessages` export to `appMessages`

- Exposed shell, landing, and page messages through `packages/i18n/src/index.ts`

- Replaced inline switcher layout styling with Tailwind utility classes

- Added Tailwind/PostCSS CSS pipeline for the web app

- Added `apps/web/src/app/globals.css`

- Added `apps/web/postcss.config.mjs`

- Added required Tailwind/PostCSS development dependencies for the web app

- Imported global CSS from the localized layout

- Verified language route switching manually

- Verified app shell/header/footer manually

- Verified active navigation manually

- Verified dashboard placeholder cards manually

- Verified login remains placeholder-only manually

- Verified settings placeholder sections manually

- Verified Czech dashboard route manually

- Verified machine detail placeholder routes manually

- Verified footer anchor targets exist and match section IDs

## Completed in Phase 2

- Locked Phase 2 trust-foundation decisions in docs
- Added Prisma tooling foundation to `@buildtrace/db`
- Added Prisma schema for:
  - organizations
  - app users
  - organization memberships
  - activity logs
- Added `OrganizationRole` enum with:
  - `OWNER`
  - `ADMIN`
  - `MEMBER`
- Added PostgreSQL migration lock and initial trust schema migration
- Validated migration from zero against local PostgreSQL
- Added Prisma client factory using `@prisma/adapter-pg`
- Added generated Prisma client output policy
- Ignored generated Prisma client output from Git, ESLint, and Prettier
- Updated Turbo generation behavior so generated Prisma output is not cached as a source artifact
- Added Supabase auth configuration boundary
- Added Supabase bearer token verifier
- Added bearer authorization header parser
- Added auth boundary smoke check
- Added API dependency on `@supabase/supabase-js`
- Added API dependency on `@buildtrace/db`
- Added current user resolution foundation
- Added organization membership context resolution
- Added tenant access guard foundation
- Added tenant access smoke check
- Added authenticated tenant context composition helper
- Added append-only activity log helper
- Added activity log smoke check
- Added `tsx` dev dependency to `@buildtrace/db` for DB smoke checks

## Verified locally

Final Phase 0 verification passed before Phase 0 commit:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`

Phase 1 language switcher foundation verification passed:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`
- translation JSON key validation for en, cs, sk, pl, de, fr, es
- manual runtime check: language route switching works

Phase 1 translated app shell foundation verification passed:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`
- translation JSON key validation for shell and landing keys across en, cs, sk, pl, de, fr, es
- manual runtime check: header renders
- manual runtime check: footer renders
- manual runtime check: language switcher appears in header
- manual runtime check: language switching works
- manual runtime check: footer privacy/security/data-protection anchor targets exist
- VS Code Problems panel verified clean after stale wrong-path tab was closed

Phase 1 translated page-shell skeleton verification passed:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- `git diff --cached --check`
- staged file review confirmed only intended web/i18n files were included
- production build confirmed the new localized placeholder routes:
  - `/[locale]/dashboard`
  - `/[locale]/documents`
  - `/[locale]/feedback`
  - `/[locale]/login`
  - `/[locale]/machines`
  - `/[locale]/settings`
  - `/[locale]/spare-parts`
  - `/[locale]/tickets`

Phase 1 industrial polish verification passed:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- staged file review confirmed only intended frontend/i18n/CSS pipeline files were included
- `apps/web/next-env.d.ts` generated dev drift was restored before commit
- CSS asset verification confirmed a real non-empty global CSS asset was served by Next dev
- CSS asset contained Tailwind utility output such as `bg-neutral-950` and `text-stone-50`
- manual browser review confirmed pages rendered as styled shell pages, not plain HTML

Manual browser checks completed for the industrial polish chunk:

- `/en`
- `/en/dashboard`
- `/en/login`
- `/en/settings`
- `/cs/dashboard`
- `/en#privacy`
- `/en#security`
- `/en#data-protection`

Phase 1 final shell completion verification passed:

- `pnpm.cmd format:check`
- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `git diff --check`
- `git diff --stat`
- `git diff --name-status`
- `git ls-files --others --exclude-standard`
- `git status --short`
- staged file review confirmed only intended localized web/i18n files were included
- `apps/web/next-env.d.ts` generated dev drift was restored before commit

Manual browser checks completed for the final Phase 1 shell completion slice:

- `/en`
- `/en/machines/example-machine`
- `/cs/machines/example-machine`
- localized navigation routes
- footer anchor links:
  - `/en#privacy`
  - `/en#security`
  - `/en#data-protection`

Manual browser result:

- styled landing page renders
- narrow/mobile layout was reviewed manually
- header renders on localized pages
- language switcher renders
- active navigation state works
- dashboard placeholder cards render
- login remains placeholder-only
- settings placeholder sections render
- machine detail shell renders as placeholder-only
- Czech machine detail route loads
- footer anchors navigate to the expected landing sections
- Next.js dev tools overlay was treated as development-only UI

Individual runtime verification also passed:

- web app locale route loads
- language switcher works
- API starts successfully
- worker placeholder starts successfully

Phase 2 database and trust-foundation verification passed:

- `pnpm.cmd --filter @buildtrace/db run prisma:validate`
- `pnpm.cmd --filter @buildtrace/db typecheck`
- `pnpm.cmd --filter @buildtrace/db lint`
- `pnpm.cmd --filter @buildtrace/db build`
- `pnpm.cmd --filter @buildtrace/db run activity:smoke`
- `pnpm.cmd --filter @buildtrace/api typecheck`
- `pnpm.cmd --filter @buildtrace/api lint`
- `pnpm.cmd --filter @buildtrace/api build`
- `pnpm.cmd --filter @buildtrace/api run auth:smoke`
- `pnpm.cmd --filter @buildtrace/api run tenant:smoke`
- `pnpm.cmd format:check`
- `pnpm.cmd turbo typecheck --force`
- `pnpm.cmd turbo lint --force`
- `pnpm.cmd turbo build --force`
- `git diff --check`
- `git diff --cached --check`
- staged file review was performed before each Phase 2 commit
- generated Prisma client output was not committed
- migration was applied and verified against local PostgreSQL
- Prisma migrate status confirmed the database schema was up to date

Phase 2 local PostgreSQL verification passed:

- PostgreSQL 17 installed locally
- PostgreSQL service verified running
- test database `buildtrace_migration_test` created
- `DATABASE_URL` set only in the local PowerShell session
- Prisma migration applied successfully
- database tables verified:
  - `_prisma_migrations`
  - `activity_logs`
  - `app_users`
  - `organization_memberships`
  - `organizations`

## Current tech stack foundation

- pnpm
- Turborepo
- TypeScript strict mode
- Next.js web app
- Next.js App Router
- Tailwind CSS foundation
- PostCSS foundation for Tailwind CSS
- NestJS API with Fastify
- worker placeholder with tsx
- shared package
- i18n package
- db package with Prisma
- Prisma Client 7
- PostgreSQL provider
- local PostgreSQL migration verification
- Supabase auth boundary in API
- Supabase token verifier foundation
- tenant access guard foundation
- activity log helper foundation
- ui placeholder package

## Issues found and resolved

- PowerShell denied write access in `C:\WINDOWS\system32`. Resolved by working in `C:\Users\chand\buildtrace`.
- pnpm was missing. Resolved by installing pnpm with `npm.cmd`.
- PowerShell script policy blocked npm/codex `.ps1` execution. Resolved by using `.cmd` commands.
- Some files had UTF-8 BOM markers. Resolved by scanning and removing BOM markers.
- PowerShell treated `[locale]` as a pattern. Resolved by using `-LiteralPath` where needed.
- ESLint initially scanned generated `.next` output. Resolved by updating ESLint ignore rules.
- Turbo initially warned about missing build outputs for noEmit packages. Resolved by setting Phase 0 build outputs to `[]`.
- Prettier initially found formatting drift. Resolved with `pnpm.cmd format`.
- TypeScript generated `apps/web/tsconfig.tsbuildinfo`. Resolved by removing it from Git index and adding `*.tsbuildinfo` to `.gitignore`.
- Git warned about LF-to-CRLF conversion on Windows. Resolved by adding `.gitattributes` with LF normalization.
- `LanguageSwitcher` initially used inline layout styles. Resolved by replacing them with Tailwind utility classes.
- `phaseZeroMessages` became misleading after Phase 1 language-switcher keys were added. Resolved by renaming it to `appMessages`.
- Codex initially proposed footer links pointing to section IDs that did not exist. Resolved by adding translated trust sections with matching IDs: `privacy`, `security`, and `data-protection`.
- Codex initially proposed an internal route as a raw anchor tag. Resolved by using Next.js `Link` for the locale home link.
- `AppShell` was accidentally created in a wrong nested folder path under `apps/web/src/components/apps/web/src/components`. Resolved by moving it to `apps/web/src/components/app-shell.tsx` and deleting the wrong nested folder.
- VS Code showed a stale `./language-switcher` import error from the old wrong nested file tab. Resolved by closing the stale tab; `pnpm.cmd typecheck` and the VS Problems panel both confirmed the repo was clean.
- `apps/web/next-env.d.ts` drifted after `next dev`. Resolved by running `pnpm.cmd build`, which restored the tracked build-safe state.
- PowerShell file-writing with relative paths attempted to write docs under `C:\WINDOWS\system32`. Resolved by using VS Code for file editing and keeping PowerShell for verification/build/Git tasks.
- New page-shell files temporarily showed VS Code errors while the implementation was only partially applied. Resolved by completing `page-shell.tsx`, all route pages, `packages/i18n/src/index.ts`, and all 7 JSON message files.
- Prettier found formatting drift after the page-shell skeleton files were added. Resolved with `pnpm.cmd exec prettier --write .`, then re-verified with `format:check`, `typecheck`, `lint`, `build`, and Git whitespace checks.
- New `app-nav.tsx` was initially untracked and therefore invisible to normal `git diff` review. Resolved by using Git review checks that include untracked files before staging.
- Browser testing initially showed a hydration mismatch related to browser translation behavior. Resolved as a test-environment issue by testing with translation disabled.
- Browser testing initially showed plain HTML-looking output. Resolved by adding the Tailwind/PostCSS CSS pipeline and importing global CSS from the localized layout.
- A generated `apps/web/next-env.d.ts` drift occurred during dev server testing. Resolved by restoring the generated file before commit.
- Final Phase 1 wording was checked to avoid claims of legal, CE, Machinery Regulation, CRA, safety, or compliance guarantees. Resolved by using conservative language around evidence readiness, documentation organization, secure-by-default direction, regulatory outcomes, review outcomes, and approval outcomes.
- Prisma generated client output initially appeared as untracked source. Resolved by keeping generated output reproducible and ignored instead of committing generated files.
- VS Code initially could not load the remote Turbo schema. Resolved by pointing `turbo.json` to the local installed schema.
- PostgreSQL command-line tools were initially unavailable. Resolved by installing PostgreSQL locally and using the installed binary path.
- The local PostgreSQL password was unknown after installation. Resolved by temporarily switching local auth to trust, setting a real password, then restoring the original PostgreSQL authentication config.
- `DATABASE_URL` was kept out of Git and set only in the local PowerShell session for migration verification.
- `pnpm add @buildtrace/db` initially looked for the package in npm. Resolved by using the workspace protocol: `@buildtrace/db@workspace:*`.
- `@buildtrace/db` initially lacked `tsx` for its smoke script. Resolved by adding `tsx` as a dev dependency in `packages/db`.
- An intermediate activity-log test-only helper design was rejected because it widened the public API for a smoke test. Resolved by testing the real `createActivityLog` behavior through a fake Prisma client instead.

## Known quality note: `next-env.d.ts`

`apps/web/next-env.d.ts` is currently tracked by Git.

Observed behavior:

- `next dev` may change its route-type reference to `.next/dev/types/routes.d.ts`
- `next build` restores it to `.next/types/routes.d.ts`

Current policy:

- do not commit dev-server drift in `apps/web/next-env.d.ts`
- before committing, run `pnpm.cmd build`
- verify `git status --short` does not show `apps/web/next-env.d.ts`
- do not remove this file from Git tracking unless the project makes a documented decision later

## Known quality note: generated Prisma client

`packages/db/src/generated/` is generated output.

Current policy:

- do not commit generated Prisma client files
- generate them through `pnpm.cmd --filter @buildtrace/db run generate`
- keep generated output ignored by Git, ESLint, and Prettier
- verify generated output is not shown by `git ls-files --others --exclude-standard`
- keep Prisma schema, migrations, and source helpers committed

## Known Phase 0 limits

Phase 0 did not include:

- authentication
- database
- tenant isolation
- RBAC
- document upload
- private storage buckets
- signed URLs
- QR portal
- tickets
- software timeline
- spare parts
- quote flow
- feedback
- deployment

These are intentional roadmap boundaries, not defects.

## Known Phase 1 limits

Phase 1 is complete, but it is intentionally shell-only.

Phase 1 did not include:

- real authentication
- Supabase Auth
- PostgreSQL
- Prisma schema
- tenant isolation
- RBAC
- document upload
- Supabase Storage
- QR portal implementation
- ticket backend
- machine CRUD
- customer CRUD
- document CRUD
- software timeline logic
- spare parts logic
- quote flow
- feedback collection logic
- deployment

These are intentional Phase 2+ roadmap boundaries, not defects.

## Known Phase 2 limits

Phase 2 is complete as a trust-foundation backend slice.

Phase 2 did not include:

- production deployment
- live hosted Supabase project wiring
- frontend login screen connected to Supabase Auth
- browser session management
- API route guards mounted on real feature endpoints
- machine CRUD
- customer CRUD
- document CRUD
- ticket backend
- QR portal implementation
- Supabase Storage buckets
- signed URL document access
- software timeline implementation
- spare parts implementation
- quote flow implementation
- feedback collection implementation

These are intentional Phase 3+ roadmap boundaries, not defects.

## Current not-in-scope items

Not started yet:

- production deployment
- live hosted Supabase project wiring
- frontend login flow wiring
- API feature endpoints using the new tenant context
- machine CRUD
- customer CRUD
- document CRUD
- tickets backend
- document upload
- Supabase Storage
- private storage buckets
- signed URLs
- QR portal
- software timeline
- spare parts logic
- quote flow
- feedback collection logic

## Next phase milestone

Start Phase 3 - Machine/customer records foundation.

Phase 3 should build on the completed Phase 2 trust foundation.

Next recommended implementation chunk:

- inspect current repo state and docs
- define the smallest safe Phase 3 baby step
- add machine/customer data models only after checking tenant ownership rules
- keep every data model organization-scoped unless there is a documented reason not to
- avoid broad feature scope before the first Phase 3 boundary is clear

Phase 3 must preserve the Phase 2 trust rules:

- no cross-tenant reads
- no unauthenticated business data access
- no committed secrets
- no generated Prisma client committed
- no fake compliance claims
- every new backend path must have a clear organization boundary
- every meaningful write path should be ready for activity logging

## Latest completed implementation commit

Commit hash: `ec2b2f1`

Commit message: `test(db): add activity log smoke check`
