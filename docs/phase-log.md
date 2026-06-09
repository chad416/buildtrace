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
