# PROGRESS_1.md - BuildTrace Beta

> Living state file for AI handoff. Read this after AGENTS.md when continuing the project.

Last updated after commit:

- 48342d9 feat(web): show document classification suggestions

Current branch:

- main

Current phase:

- Phase 5 - Document classification

Current full beta roadmap completion:

- about 52-53%

Phase 5 completion:

- about 70-75%

## Product / Roadmap Truth

BuildTrace Beta is a professional B2B vertical SaaS for machine handover, machine documentation, private document storage, signed document downloads, classification suggestions, and later QR customer portal, service tickets, software version timeline, spare parts intelligence, quotes, and feedback.

Phase 4 is complete. Phase 5 is active. Phase 6 and later are not started.

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

## Phase 5 Completed So Far

- Phase 5 classification decision lock added.
- Classification is suggestion-only.
- Classifier must never auto-apply category.
- Classifier must never change visibility level.
- Classifier must never make a file customer-visible.
- No AI, OCR, PDF extraction, vector search, or worker queue in this lean Phase 5 slice.
- Shared classification constants added:
  - classification status
  - classification source
  - needs-review threshold
- DB classification metadata added.
- Filename/type classifier added in packages/shared.
- DB persistence of suggested category, confidence, status, and source added.
- API exposes classification metadata.
- API endpoint added to refresh classification suggestion.
- Web API client supports classification suggestion refresh.
- Machine detail UI shows:
  - suggested category
  - classification status
  - confidence
  - source
  - refresh suggestion action
- Latest pushed commit:
  - 48342d9 feat(web): show document classification suggestions

## Phase 5 Not Complete Yet

Still required before Phase 5 can be closed:

1. Explicit builder action to accept/confirm a suggested category.
2. Preserve security boundary during accept:
   - do not silently change visibility to customer-visible
   - do not allow classifier to override builder decision
3. Set classification status to manually-confirmed after explicit builder confirmation.
4. Activity log:
   - document.classification_confirmed
5. Browser verification of the full classification flow.
6. Docs update for honest Phase 5 progress/closeout after the accept path is complete.

## Next Exact Engineering Step

Implement the explicit accept/confirm suggestion path.

Lean/no-compromise rules for that step:

- It must be builder-triggered.
- It must be tenant-scoped.
- It must be document-scoped.
- It must preserve or explicitly handle visibility.
- It must log document.classification_confirmed.
- It must not introduce AI/OCR/vector search/worker queues.
- It must not weaken Phase 4 private-by-default storage.
- It must pass smoke/typecheck/lint/build/format gates before commit.

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
