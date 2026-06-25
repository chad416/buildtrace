CREATE TABLE software_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  version_name TEXT NOT NULL,
  software_type TEXT NOT NULL,
  notes TEXT,
  is_delivered_version BOOLEAN NOT NULL DEFAULT FALSE,
  is_current_known_version BOOLEAN NOT NULL DEFAULT FALSE,
  storage_path TEXT,
  checksum TEXT,
  uploaded_by_user_id UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

CREATE INDEX software_versions_organization_id_idx
  ON software_versions(organization_id);
CREATE INDEX software_versions_machine_id_idx
  ON software_versions(machine_id);
CREATE INDEX software_versions_machine_type_idx
  ON software_versions(machine_id, software_type);
