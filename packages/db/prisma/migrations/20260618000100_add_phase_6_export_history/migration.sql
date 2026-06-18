CREATE TYPE "DataExportAudience" AS ENUM (
  'CUSTOMER_HANDOVER'
);

CREATE TYPE "DataExportResult" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED'
);

CREATE TABLE "data_exports" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "machine_id" UUID NOT NULL,
  "requested_by" UUID,
  "audience" "DataExportAudience" NOT NULL DEFAULT 'CUSTOMER_HANDOVER',
  "checklist_version" TEXT NOT NULL,
  "manifest" JSONB NOT NULL,
  "result" "DataExportResult" NOT NULL DEFAULT 'PENDING',
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "data_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_exports_organization_id_machine_id_created_at_idx"
ON "data_exports"("organization_id", "machine_id", "created_at");

CREATE INDEX "data_exports_organization_id_result_idx"
ON "data_exports"("organization_id", "result");

CREATE INDEX "data_exports_requested_by_idx"
ON "data_exports"("requested_by");

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_organization_id_machine_id_fkey"
FOREIGN KEY ("organization_id", "machine_id") REFERENCES "machines"("organization_id", "id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_requested_by_fkey"
FOREIGN KEY ("requested_by") REFERENCES "app_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
