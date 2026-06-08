# BuildTrace Data Classification

## Phase

Phase 0 — Professional project foundation + security docs.

## Purpose

This document defines how BuildTrace classifies uploaded and generated files.

Every uploaded or generated item must have a visibility/security level.

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

Phase 0 rule: avoid using this level for uploaded machine files.

### customer-visible

Files explicitly approved by the builder for customer portal access.

Customer-visible does not mean public internet access.

Downloads must still use controlled access and signed temporary URLs in later phases.

### internal

Default level for uploaded documents.

Visible only to authorized builder-side users.

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

Customer-visible access must be explicitly selected by an authorized builder user.

## AI/classifier rule

Classification suggestions may be added later.

AI or rule-assisted classification must never weaken security defaults automatically.

Low-confidence classification must require builder review.

## Phase 0 implementation

Phase 0 defines visibility levels in shared code.

Phase 0 does not yet enforce access control because auth, database, and storage are not implemented yet.
