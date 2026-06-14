CREATE TYPE "DocumentCategory" AS ENUM (
  'PLC',
  'HMI',
  'MECHANICAL_DRAWINGS',
  'ELECTRICAL_DRAWINGS',
  'CAD',
  'MACHINE_PHOTOS',
  'FAT',
  'SAT',
  'MANUALS',
  'SAFETY_INSTRUCTIONS',
  'SUPPLIER_DOCUMENTS',
  'SPARE_PARTS_BOM',
  'CERTIFICATES',
  'SERVICE_NOTES',
  'OTHER'
);

CREATE TYPE "DocumentVisibilityLevel" AS ENUM (
  'CUSTOMER_VISIBLE',
  'INTERNAL',
  'SENSITIVE_ENGINEERING',
  'RESTRICTED'
);

CREATE TYPE "DocumentLanguage" AS ENUM (
  'EN',
  'CS',
  'SK',
  'PL',
  'DE',
  'FR',
  'ES',
  'UNKNOWN'
);

CREATE UNIQUE INDEX "machines_organization_id_id_key" ON "machines"("organization_id", "id");

CREATE TABLE "documents" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "machine_id" UUID NOT NULL,
  "file_name" TEXT NOT NULL,
  "storage_path" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "visibility_level" "DocumentVisibilityLevel" NOT NULL DEFAULT 'INTERNAL',
  "visible_to_customer" BOOLEAN NOT NULL DEFAULT false,
  "language" "DocumentLanguage" NOT NULL DEFAULT 'UNKNOWN',
  "checksum" TEXT NOT NULL,
  "uploaded_by" UUID,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_download_url_issued_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documents_organization_id_storage_path_key" ON "documents"("organization_id", "storage_path");
CREATE INDEX "documents_organization_id_machine_id_idx" ON "documents"("organization_id", "machine_id");
CREATE INDEX "documents_organization_id_category_idx" ON "documents"("organization_id", "category");
CREATE INDEX "documents_organization_id_visibility_level_idx" ON "documents"("organization_id", "visibility_level");
CREATE INDEX "documents_uploaded_by_idx" ON "documents"("uploaded_by");

ALTER TABLE "documents"
ADD CONSTRAINT "documents_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents"
ADD CONSTRAINT "documents_organization_id_machine_id_fkey"
FOREIGN KEY ("organization_id", "machine_id") REFERENCES "machines"("organization_id", "id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents"
ADD CONSTRAINT "documents_uploaded_by_fkey"
FOREIGN KEY ("uploaded_by") REFERENCES "app_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
