# PROGRESS_1.md - BuildTrace Beta

> Living state file for AI handoff. Read this after AGENTS.md when continuing the project.

Last updated after commit:

- 6b73c4d docs: update agent context for Phase 6 partial progress

Current branch:

- main

Current phase:

- Phase 6 - Handover completeness + export

Current full beta roadmap completion:

- about 65%

Phase 5 completion:

- complete

## Product / Roadmap Truth

BuildTrace Beta is a professional B2B vertical SaaS for machine handover, machine documentation, private document storage, signed document downloads, classification suggestions, and later QR customer portal, service tickets, software version timeline, spare parts intelligence, quotes, and feedback.

Phase 4 is complete. Phase 5 is complete. Phase 6 is active. Phase 7 and later are not started.

Do not claim legal/compliance guarantees. Correct wording is evidence readiness, documentation organization, handover records, service history, and software-version traceability.

## Completed Phases

### Phase 0 - Foundation

- pnpm monorepo
- apps/web
- apps/api
- apps/worker placeholder
- packages/db
- packages/shared
- packages/i18n
- packages/ui
- formatting/lint/typecheck/build gates

### Phase 1 - Web Shell And I18n Skeleton

- Next.js App Router shell
- locale routing
- supported locales: en, cs, sk, pl, de, fr, es
- main navigation routes
- industrial dark UI baseline
- privacy/security footer links

### Phase 2 - DB/Auth/Tenancy Foundation

- Prisma + PostgreSQL/Supabase foundation
- organization/app-user/membership model
- tenant access checks
- Supabase auth token verification through API boundary
- service-role key belongs only in apps/api
- activity log foundation

### Phase 3 - Machine/Customer Records Foundation

- organization-scoped customers
- organization-scoped machine models
- organization-scoped machines
- create/read/update machine record vertical slice
- API and web client boundaries
- tenant isolation smoke checks
- machine create/edit activity logging

### Phase 4 - Document Upload

- document metadata schema
- private Supabase storage boundary
- document upload endpoint
- signed temporary document download URLs
- document category update
- document visibility update
- document upload/download/category/visibility activity logging
- machine detail document UI
- dev preflight for DB, membership, storage bucket, and service-role setup

## Phase 5 Completed

- Phase 5 classification decision lock added.
- Classification is suggestion-only.
- Classifier never auto-applies category.
- Classifier never changes visibility level.
- Classifier never makes a file customer-visible.
- No AI, OCR, PDF extraction, vector search, or worker queue in this lean Phase 5 slice.
- Shared classification constants added.
- DB classification metadata added.
- Filename/type classifier added in packages/shared.
- DB persistence of suggested category, confidence, status, and source added.
- API exposes classification metadata.
- API endpoint added to refresh classification suggestion.
- Web API client supports classification suggestion refresh.
- Machine detail UI shows suggested category, classification status, confidence, source, and refresh action.
- Explicit builder confirm action added.
- Confirmation applies the suggested category only after builder action.
- Confirmation preserves visibility and customer exposure.
- Confirmation sets status to manually-confirmed and source to manual.
- Confirmation logs document.classification_confirmed.
- Browser verification passed.
- Stale category/visibility controls after confirmation were fixed.
- Dev browser-session bootstrap added for repeatable browser testing.

## Phase 6 Partial Progress

Phase 6 is approximately 65% complete.

Completed:
- shared completeness evaluator and export manifest builder
- shared ZIP entry builder with traversal guards
- i18n document labels and handover completeness copy (all 7 locales)
- DB data_exports schema with CHECK constraints and migrations
- DB export creation/revalidation/finalization helpers
- API completeness endpoint
- API export create and download-url endpoints
- API ZIP archive builder with fflate + SHA-256 checksum
- API export storage (Supabase) with upload/remove/signed URL
- API recovery path on export failure
- web handover completeness API client
- handover completeness widget in machine detail page

Still required before Phase 6 can close:
1. Web export API client (customer-handover-export-api.ts)
2. Export trigger UI + server action
3. Export history list endpoint (API) + web client
4. Sensitive-file warning in export response
5. Localized PDF summary
6. Browser verification
7. Docs closeout

## Next Exact Engineering Step

Slice B: create apps/web/src/customer-handover-export-api.ts (web API client for
create-export and download-url endpoints) plus its smoke check.

## Handoff Docs

These root files are documentation/agent-context files only:

- AGENTS.md
- PROGRESS_1.md

They do not affect product runtime unless future tooling intentionally reads them. They can affect AI behavior, so keep them accurate and do not put secrets in them.

## Warning For Future Agents

Do not do brittle workaround edits.

Required behavior:

- Re-read the source file before editing.
- Fix the actual root cause, not symptoms.
- Keep changes small and scoped.
- Do not use fragile regex/text-anchor surgery when a clean source edit is needed.
- Do not stage unrelated files.
- Do not touch auth, RLS, storage, tenant access, migrations, or docs unless the step explicitly requires it.
- Do not claim a phase is complete until roadmap exit conditions, checks, browser proof, and docs are all aligned.
- Never put Supabase service-role keys, access tokens, refresh tokens, passwords, database URLs, or private keys in repo files.

## Usual Verification Gates

Use Windows PowerShell commands locally:

- pnpm.cmd --filter @buildtrace/shared typecheck
- pnpm.cmd --filter @buildtrace/db run document-schema:drift
- pnpm.cmd --filter @buildtrace/db run document-records:isolation
- pnpm.cmd --filter @buildtrace/api run document-records:smoke
- pnpm.cmd --filter @buildtrace/web run document-records:smoke
- pnpm.cmd --filter @buildtrace/web typecheck
- pnpm.cmd --filter @buildtrace/web lint
- pnpm.cmd --filter @buildtrace/web build
- pnpm.cmd format:check
- git diff --check
- git status --short

Use targeted gates when the change is narrow, but do not skip relevant package gates before commit.
