/*
  Align Phase 3 machine/customer record fields with the accepted roadmap scope.

  This migration preserves equivalent data by renaming columns where the meaning
  is the same, and drops only the fields that were removed from the Phase 3 schema.
*/

-- DropIndex
DROP INDEX "customers_organization_id_name_key";

-- DropIndex
DROP INDEX "machine_models_organization_id_manufacturer_name_key";

-- RenameColumns
ALTER TABLE "customers" RENAME COLUMN "name" TO "company_name";

ALTER TABLE "machine_models" RENAME COLUMN "name" TO "model_name";

ALTER TABLE "machines" RENAME COLUMN "name" TO "machine_name";

ALTER TABLE "machines" RENAME COLUMN "installed_at" TO "delivery_date";

-- AlterTable
ALTER TABLE "customers"
DROP COLUMN "external_ref",
DROP COLUMN "notes",
ADD COLUMN "contact_name" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "preferred_locale" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "machine_models"
DROP COLUMN "manufacturer",
DROP COLUMN "model_code";

-- AlterTable
ALTER TABLE "machines"
DROP COLUMN "location",
DROP COLUMN "notes",
ADD COLUMN "hmi_type" TEXT,
ADD COLUMN "plc_type" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_company_name_key" ON "customers"("organization_id", "company_name");

-- CreateIndex
CREATE UNIQUE INDEX "machine_models_organization_id_model_name_key" ON "machine_models"("organization_id", "model_name");
