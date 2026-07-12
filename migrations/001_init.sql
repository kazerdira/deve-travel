-- Leads + click events. Content lives in MDX, not the DB.
CREATE TABLE IF NOT EXISTS leads (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  destination TEXT,
  service     TEXT,
  audience    TEXT,
  message     TEXT,
  locale      TEXT NOT NULL,
  source      TEXT,
  page_path   TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  ip_hash     TEXT,
  user_agent  TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads (status);

CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind        TEXT NOT NULL,
  destination TEXT,
  service     TEXT,
  locale      TEXT,
  page_path   TEXT,
  source      TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_kind_created ON events (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_dest    ON events (destination);
CREATE INDEX IF NOT EXISTS idx_events_service ON events (service);
