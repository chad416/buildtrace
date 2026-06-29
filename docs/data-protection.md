# Data-Protection Posture

BuildTrace is designed to organize machine handover evidence and service history without turning engineering files into public assets. This document describes the current beta posture; it is not a compliance certification or legal assessment.

## Current controls

- Tenant-owned records carry an organization identifier and are accessed through authenticated membership checks plus organization-scoped queries.
- Documents, handover artifacts, ticket attachments, and software files use a private Supabase Storage bucket.
- Download access uses temporary signed URLs instead of public object URLs.
- Customer portal document access requires an explicit customer-visible classification.
- Engineering-sensitive categories receive a sensitive-engineering default.
- Activity records capture important mutations and download/portal events without storing file contents or signed URLs.
- Secrets are loaded from ignored environment files; the service-role key is confined to server-side API/development code.

## Data handled by the beta

The current schema stores organizations, users and memberships, customers, machine models, machines, documents and classification metadata, handover export records, service tickets and comments, software-version metadata, spare parts, quote requests, and activity records. Private object storage holds uploaded documents, generated ZIP/PDF exports, ticket attachments, and optional software-version files.

A dedicated feedback data model is not implemented. Spare-parts and quote records are implemented, including separate internal and customer-visible pricing fields; the API omits `internalCost` from spare-part responses.

## Deployment responsibility

The target is an EU-region Supabase project and EU-region application hosting. Region choice, retention, backups, monitoring, and subprocessors are deployment decisions and must be verified outside this repository. Production privacy notices, retention schedules, data-subject workflows, and organization deletion/export procedures remain to be defined.

## Wording boundary

BuildTrace may be described as evidence-ready, documentation-organized, secure-by-default in direction, and designed for EU hosting. It must not be described as guaranteeing GDPR compliance, CE compliance, Machinery Regulation compliance, CRA compliance, safety certification, SIL certification, or regulatory approval.
