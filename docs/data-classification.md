# BuildTrace Data Classification

## Current phase

Phase 1 - Industrial UI shell + multilingual UI skeleton is complete.

Current full beta roadmap completion:

- 12%

Next phase:

- Phase 2 - Database + auth + tenancy

## Purpose

This document defines how BuildTrace classifies uploaded and generated files.

Every uploaded or generated item must have a visibility/security level.

## Current implementation status

Phase 0 defined the visibility levels in shared code and documentation.

Phase 1 did not add uploads, storage, generated files, or real document handling.

Therefore, the data-classification rules remain design-level rules until later phases implement database, storage, uploads, and access control.

This is intentional.

Data classification becomes enforceable only after the relevant backend/storage phases are implemented.

## Visibility levels

BuildTrace uses five visibility levels:

1. public
2. customer-visible
3. internal
4. sensitive-engineering
5. restricted

## Level definitions

### public

Information safe to show publicly.

Current rule:

- avoid using this level for uploaded machine files

### customer-visible

Files explicitly approved by the builder for customer portal access.

Customer-visible does not mean public internet access.

Downloads must still use controlled access and signed temporary URLs in later phases.

### internal

Default level for uploaded documents.

Visible only to authorized builder-side users after auth, tenant isolation, and access control are implemented.

### sensitive-engineering

Used for engineering-sensitive files.

Default level for:

- PLC files
- HMI files
- CAD files
- electrical drawings
- software/project files
- sensitive engineering notes

These files must not be exposed through the QR portal by default.

### restricted

Highest sensitivity level.

Visible only to owner/admin roles in later phases.

Used for business-critical, security-sensitive, or highly confidential records.

## Default classification rules

Uploaded documents default to internal.

PLC files default to sensitive-engineering.

HMI files default to sensitive-engineering.

CAD files default to sensitive-engineering.

Electrical drawings default to sensitive-engineering.

Software/project files default to sensitive-engineering.

Customer-visible access must be explicitly selected by an authorized builder user.

## AI/classifier rule

Classification suggestions may be added later.

AI or rule-assisted classification must never weaken security defaults automatically.

Low-confidence classification must require builder review.

AI suggestions must never make a file customer-visible automatically.

## Phase 0 implementation

Phase 0 defined visibility levels in shared code.

Phase 0 did not enforce access control because auth, database, and storage were not implemented yet.

## Phase 1 implementation

Phase 1 did not change the data-classification model.

Phase 1 added a translated UI shell and placeholder pages only.

Phase 1 did not add:

- document upload
- file storage
- generated exports
- customer-visible file selection
- signed download URLs
- QR portal file access
- document classification
- document metadata persistence
- access-control enforcement

## Later enforcement phases

Data-classification enforcement is expected to begin across later phases:

- Phase 2 - database, auth, tenancy, RBAC, and activity log foundation
- Phase 4 - private document upload, metadata, visibility controls, signed URLs
- Phase 5 - document classification and review flow
- Phase 6 - handover export rules and sensitive-file warnings
- Phase 7 - QR portal access limited to customer-visible files

## Quality rule

Do not treat classification labels as real security until enforcement exists.

A label in the UI is not enough.

Real protection requires:

- authentication
- tenant isolation
- role-based access control
- private storage
- signed temporary URLs
- server-side access checks
- activity logging
