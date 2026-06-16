CREATE TYPE "DocumentClassificationStatus" AS ENUM (
  'UNCLASSIFIED',
  'CLASSIFIED',
  'NEEDS_REVIEW',
  'MANUALLY_CONFIRMED'
);

CREATE TYPE "DocumentClassificationSource" AS ENUM (
  'FILENAME_TYPE',
  'MANUAL'
);

ALTER TABLE "documents"
ADD COLUMN "suggested_category" "DocumentCategory",
ADD COLUMN "classification_confidence" INTEGER,
ADD COLUMN "classification_status" "DocumentClassificationStatus" NOT NULL DEFAULT 'UNCLASSIFIED',
ADD COLUMN "classification_source" "DocumentClassificationSource";

CREATE INDEX "documents_organization_id_classification_status_idx"
ON "documents"("organization_id", "classification_status");

CREATE INDEX "documents_organization_id_suggested_category_idx"
ON "documents"("organization_id", "suggested_category");
