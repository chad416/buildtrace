ALTER TABLE "data_exports"
ADD COLUMN "artifact_storage_path" TEXT,
ADD COLUMN "archive_checksum" TEXT,
ADD COLUMN "archive_byte_length" INTEGER,
ADD COLUMN "document_count" INTEGER,
ADD COLUMN "total_document_bytes" INTEGER;

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_archive_checksum_format_check"
CHECK (
  "archive_checksum" IS NULL
  OR "archive_checksum" ~ '^[a-f0-9]{64}$'
) NOT VALID;

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_artifact_metrics_positive_check"
CHECK (
  (
    "archive_byte_length" IS NULL
    OR "archive_byte_length" > 0
  )
  AND (
    "document_count" IS NULL
    OR "document_count" > 0
  )
  AND (
    "total_document_bytes" IS NULL
    OR "total_document_bytes" > 0
  )
) NOT VALID;

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_succeeded_artifact_metadata_check"
CHECK (
  "result" <> 'SUCCEEDED'
  OR (
    "artifact_storage_path" IS NOT NULL
    AND "archive_checksum" IS NOT NULL
    AND "archive_byte_length" IS NOT NULL
    AND "document_count" IS NOT NULL
    AND "total_document_bytes" IS NOT NULL
    AND "completed_at" IS NOT NULL
  )
) NOT VALID;

ALTER TABLE "data_exports"
ADD CONSTRAINT "data_exports_non_succeeded_artifact_metadata_check"
CHECK (
  "result" = 'SUCCEEDED'
  OR (
    "artifact_storage_path" IS NULL
    AND "archive_checksum" IS NULL
    AND "archive_byte_length" IS NULL
    AND "document_count" IS NULL
    AND "total_document_bytes" IS NULL
  )
) NOT VALID;