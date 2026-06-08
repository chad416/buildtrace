# BuildTrace Next Steps

## Current position

Phase 0 is almost complete.

The foundation is built and verified locally.

## Immediate next baby step

Run full root-level verification:

- typecheck
- lint
- build
- format check

## Prerequisites already completed

- web app builds
- API builds
- worker builds
- web locale routes exist
- API /health responds
- worker placeholder runs
- security docs exist
- data-protection docs exist
- data-classification docs exist
- i18n docs exist
- roadmap/project-state/phase-log/decisions docs exist

## Risks

- PowerShell command compatibility can create hidden formatting issues.
- Some files previously had UTF-8 BOM markers, already cleaned and verified.
- Full root checks may expose package-level config gaps that individual app checks did not expose.

## Expected output

After root verification passes:

- update project-state.md to mark Phase 0 complete
- commit the Phase 0 foundation
- prepare for Phase 1 — Industrial UI shell + multilingual UI skeleton
