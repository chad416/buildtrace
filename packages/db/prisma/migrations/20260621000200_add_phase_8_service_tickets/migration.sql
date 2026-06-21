CREATE TABLE service_tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  customer_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_from_portal BOOLEAN NOT NULL DEFAULT FALSE,
  customer_access_token TEXT UNIQUE,
  meeting_link TEXT,
  meeting_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

CREATE INDEX service_tickets_organization_id_idx ON service_tickets(organization_id);
CREATE INDEX service_tickets_machine_id_idx ON service_tickets(machine_id);

CREATE TABLE ticket_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  ticket_id TEXT NOT NULL,
  author_type TEXT NOT NULL,
  message TEXT NOT NULL,
  internal_only BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_url TEXT,
  attachment_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (ticket_id) REFERENCES service_tickets(id)
);

CREATE INDEX ticket_comments_ticket_id_idx ON ticket_comments(ticket_id);
