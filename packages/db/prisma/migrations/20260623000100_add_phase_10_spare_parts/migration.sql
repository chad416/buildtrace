CREATE TABLE spare_parts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  part_name TEXT NOT NULL,
  manufacturer TEXT,
  part_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'other',
  criticality TEXT NOT NULL DEFAULT 'recommended',
  estimated_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  internal_cost NUMERIC(12,2),
  customer_visible_price NUMERIC(12,2),
  source_document_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

CREATE INDEX spare_parts_organization_id_idx ON spare_parts(organization_id);
CREATE INDEX spare_parts_machine_id_idx ON spare_parts(machine_id);

CREATE TABLE quote_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  spare_part_id TEXT,
  ticket_id TEXT,
  type TEXT NOT NULL DEFAULT 'spare-part',
  title TEXT NOT NULL,
  description TEXT,
  quoted_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'requested',
  customer_access_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

CREATE INDEX quote_requests_organization_id_idx ON quote_requests(organization_id);
CREATE INDEX quote_requests_machine_id_idx ON quote_requests(machine_id);
