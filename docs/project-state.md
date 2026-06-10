# BuildTrace Project State

## Current phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

Phase 1 is formally complete.

Next phase:

- Phase 2 - Database + auth + tenancy

## Current beta completion

Phase 0 target: 5% of full beta roadmap.

Phase 0 status: complete.

Phase 1 target: 12% of full beta roadmap.

Phase 1 status: complete.

Current full beta roadmap completion: 12%.

## Latest completed implementation chunk

Phase 1 final shell completion slice completed:

- final industrial landing polish
- translated machine detail shell route
- final localized shell browser verification

Latest feature commit:

- `92a1585 feat(web): complete phase 1 shell foundation`

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
- db placeholder package
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

## Current not-in-scope items

Not started yet:

- real authentication
- Supabase Auth
- PostgreSQL
- Prisma
- tenant isolation
- RBAC
- document upload
- Supabase Storage
- QR portal
- tickets backend
- machine CRUD
- customer CRUD
- document CRUD
- software timeline
- spare parts logic
- quote flow
- feedback collection logic
- deployment

## Next phase milestone

Start Phase 2 - Database + auth + tenancy.

Phase 2 target completion:

- 22% of full beta roadmap after full Phase 2 completion

Next recommended implementation chunk:

- plan the Phase 2 foundation carefully before coding
- inspect current repo state and docs
- define the smallest safe first baby step for database/auth/tenancy
- avoid adding broad backend scope before the first Phase 2 boundary is clear

Phase 2 must introduce real backend/security foundations carefully:

- Supabase Auth
- PostgreSQL
- Prisma schema
- organization workspace logic
- user preferred language
- organization default language
- customer preferred language
- organization-level tenant isolation
- API-level tenant checks
- RBAC foundation
- activity log table
- login event logging
- secure environment variable setup

## Last git commit

Commit hash: `92a1585`

Commit message: `feat(web): complete phase 1 shell foundation`
