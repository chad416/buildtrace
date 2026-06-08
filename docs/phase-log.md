# BuildTrace Phase Log

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

Added the first Phase 1 baby step: multilingual language switcher foundation.

This did not complete Phase 1. Current full beta roadmap completion remains 5%.

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

Manual runtime result:

- localized page loaded
- language switcher was visible
- switching from Spanish to English worked
- supported locale routes loaded without crash

### Issues found and resolved

- Codex initially ran in the wrong folder under `Documents\Codex`. Resolved by running Codex from `C:\Users\chand\buildtrace`.
- PowerShell script policy blocked `codex.ps1`. Resolved by using `codex.cmd`.
- Codex CLI directly edited files, which created workflow confusion. Decision: future edits should use manual review workflow unless explicitly approved.
- `LanguageSwitcher` initially used inline layout styles. Resolved by replacing inline styles with Tailwind utility classes.
- `phaseZeroMessages` became misleading after Phase 1 language switcher messages were added. Resolved by renaming it to `appMessages`.
- `apps/web/next-env.d.ts` changed after `next dev`. Root cause confirmed: `next dev` points it to `.next/dev/types/routes.d.ts`; `next build` restores it to `.next/types/routes.d.ts`. Current policy: do not commit dev-server drift; run `pnpm.cmd build` before committing and verify `apps/web/next-env.d.ts` is clean.
- `docs/project-state.md` was initially committed after `format:check` failed. Resolved with follow-up formatting commit `56798b0 docs: format project state`.

### Security notes

- No auth was added.
- No database was added.
- No storage was added.
- No QR portal was added.
- No tickets, CRUD, document upload, signed URLs, or backend access logic was added.
- No private file URLs were exposed.
- No security claims or compliance guarantees were added.

### i18n notes

- Language switcher labels are stored in translation JSON files.
- Supported locales remain: en, cs, sk, pl, de, fr, es.
- No hardcoded visible language labels are inside `LanguageSwitcher`.
- Uploaded document translation is still not included.

### Not included yet

- industrial landing page UI
- app shell
- header/navigation
- footer
- Security & Data Protection landing section
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

### Commit messages

Feature commit:

`feat(web): add multilingual language switcher`

Docs commits:

`docs: update project state after language switcher step`

`docs: format project state`
