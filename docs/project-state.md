# BuildTrace Project State

## Current phase

Phase 1 — Industrial UI shell + multilingual UI skeleton.

Phase 1 has started, but it is not complete.

## Current beta completion

Phase 0 target: 5% of full beta roadmap.

Phase 0 status: complete.

Current full beta roadmap completion: 5%.

Phase 1 target after full completion: 12%.

Current Phase 1 status: started with first committed baby step only.

## Latest completed baby step

Phase 1 baby step completed:

- multilingual language switcher foundation

Latest commit:

- `951e43e feat(web): add multilingual language switcher`

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
- root web route redirects to /en
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
  - English — en
  - Czech — cs
  - Slovak — sk
  - Polish — pl
  - German — de
  - French — fr
  - Spanish — es

- Mounted language switcher on the localized landing route
- Added translated language-switcher labels to all 7 locale message files
- Renamed misleading `phaseZeroMessages` export to `appMessages`
- Replaced inline switcher layout styling with Tailwind utility classes
- Verified language route switching manually

## Verified locally

Final Phase 0 verification passed before Phase 0 commit:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`

Phase 1 language switcher baby step verification passed:

- `pnpm.cmd typecheck`
- `pnpm.cmd lint`
- `pnpm.cmd build`
- `pnpm.cmd format:check`
- `git diff --check`
- `git diff --cached --check`
- translation JSON key validation for en, cs, sk, pl, de, fr, es
- manual runtime check: language route switching works

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

- industrial landing page UI
- app shell
- header/navigation
- footer
- Security & Data Protection landing page section
- privacy/security footer links
- login page shell
- dashboard shell
- machines page shell
- machine detail shell
- documents page shell
- tickets page shell
- spare parts page shell
- feedback page shell
- settings page shell
- settings placeholders for:
  - user role
  - preferred language
  - future MFA
  - data export
  - security logs

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
- feedback
- deployment

## Next phase milestone

Continue Phase 1 — Industrial UI shell + multilingual UI skeleton.

Next recommended baby step:

- update remaining documentation for the committed language-switcher baby step, then continue with the translated app shell/header foundation

## Last git commit

Commit hash: `951e43e`

Commit message: `feat(web): add multilingual language switcher`
