# BuildTrace Project State

## Current phase

Phase 1 - Industrial UI shell + multilingual UI skeleton.

Phase 1 is in progress.

## Current beta completion

Phase 0 target: 5% of full beta roadmap.

Phase 0 status: complete.

Current full beta roadmap completion: 5%.

Phase 1 target after full completion: 12%.

Current Phase 1 status: in progress.

Practical Phase 1 progress: approximately 60-65% of Phase 1.

Phase 1 is not complete yet.

## Latest completed implementation chunk

Phase 1 implementation chunk completed:

- translated application page-shell skeletons

Latest feature commit:

- `91166dd feat(web): add translated page shell skeletons`

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

## Completed in Phase 1 so far

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

- Updated footer privacy/security/data-protection links to work from localized subpages

- Added translated landing page starter content

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

- Added translated empty-state placeholder copy for the new shell pages

- Added translated language-switcher labels to all 7 locale message files

- Added translated shell, landing, and page-shell keys to all 7 locale message files

- Renamed misleading `phaseZeroMessages` export to `appMessages`

- Exposed shell, landing, and page messages through `packages/i18n/src/index.ts`

- Replaced inline switcher layout styling with Tailwind utility classes

- Verified language route switching manually

- Verified app shell/header/footer manually

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

Phase 0 does not include:

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

## Known Phase 1 remaining scope

Phase 1 still needs:

- stronger industrial landing page polish

- stronger dashboard shell polish

- stronger login page visual shell polish

- active/current navigation indication

- machine detail shell

- settings placeholder sections for:
  - user role
  - preferred language
  - future MFA
  - data export
  - security logs

- mobile/layout refinement if needed after manual browser review

- final Phase 1 documentation update after remaining shell work is complete

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
- software timeline
- spare parts logic
- quote flow
- feedback collection logic
- deployment

## Next phase milestone

Continue Phase 1 - Industrial UI shell + multilingual UI skeleton.

Next recommended implementation chunk:

- industrial UI polish for the existing shell pages, including stronger dashboard/login/settings placeholders and active navigation indication, without auth, database, storage, or CRUD

## Last git commit

Commit hash: `91166dd`

Commit message: `feat(web): add translated page shell skeletons`
