-- v2: content moves to the DB (destinations, services, offers, testimonials).
-- The migration runner re-applies every file, so everything here is idempotent.

CREATE TABLE IF NOT EXISTS destinations (
  id           TEXT PRIMARY KEY,              -- slug: 'france', 'turquie'
  sort_order   INT  NOT NULL DEFAULT 100,
  available    BOOL NOT NULL DEFAULT true,    -- false => "Bientôt" card, page noindex
  flag         TEXT NOT NULL DEFAULT '',      -- emoji
  title_fr     TEXT NOT NULL,
  title_ar     TEXT,
  intro_fr     TEXT NOT NULL,
  intro_ar     TEXT,
  seo_title_fr TEXT, seo_title_ar TEXT,
  seo_desc_fr  TEXT, seo_desc_ar  TEXT,
  image_3d     TEXT,                          -- '/uploads/xxx.png' floating landmark
  image_hero   TEXT,                          -- '/uploads/xxx.webp' wide photo
  mesh_from    TEXT DEFAULT '#E45424',        -- flag colour A (card gradient)
  mesh_to      TEXT DEFAULT '#F7B450',        -- flag colour B
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id           TEXT PRIMARY KEY,              -- slug: 'tcf'
  sort_order   INT  NOT NULL DEFAULT 100,
  available    BOOL NOT NULL DEFAULT true,
  icon         TEXT NOT NULL DEFAULT 'file-check',  -- fallback line-icon key
  icon_image   TEXT,                          -- '/uploads/xxx.png' 3D icon; falls back to `icon`
  title_fr     TEXT NOT NULL, title_ar    TEXT,
  tagline_fr   TEXT NOT NULL, tagline_ar  TEXT,
  summary_fr   TEXT NOT NULL, summary_ar  TEXT,
  includes_fr  TEXT[] NOT NULL DEFAULT '{}', -- bullet list
  includes_ar  TEXT[] NOT NULL DEFAULT '{}',
  whatsapp_fr  TEXT NOT NULL DEFAULT '', whatsapp_ar TEXT,   -- WhatsApp prefill text
  seo_title_fr TEXT, seo_title_ar TEXT,
  seo_desc_fr  TEXT, seo_desc_ar  TEXT,
  is_global    BOOL NOT NULL DEFAULT false,  -- true => offered for every destination
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- which services apply to which destination
CREATE TABLE IF NOT EXISTS destination_services (
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  service_id     TEXT NOT NULL REFERENCES services(id)     ON DELETE CASCADE,
  sort_order     INT  NOT NULL DEFAULT 100,
  PRIMARY KEY (destination_id, service_id)
);

-- audience tracks per destination (étudiant / travailleur / résidence)
CREATE TABLE IF NOT EXISTS destination_tracks (
  id             BIGSERIAL PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  key            TEXT NOT NULL,               -- 'student' | 'worker' | 'pr'
  sort_order     INT  NOT NULL DEFAULT 100,
  title_fr       TEXT NOT NULL, title_ar TEXT,
  points_fr      TEXT[] NOT NULL DEFAULT '{}',
  points_ar      TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (destination_id, key)
);

CREATE TABLE IF NOT EXISTS offers (
  id             BIGSERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,        -- 'turquie-janvier'
  destination_id TEXT REFERENCES destinations(id) ON DELETE SET NULL,  -- nullable: offer can exist without a full destination page
  country_label  TEXT NOT NULL DEFAULT '',    -- free text for one-off countries: 'Turquie', 'Malaisie'
  flag           TEXT NOT NULL DEFAULT '',
  active         BOOL NOT NULL DEFAULT true,  -- manual kill switch
  featured       BOOL NOT NULL DEFAULT false, -- show as homepage banner
  starts_at      TIMESTAMPTZ,                 -- null = already started
  ends_at        TIMESTAMPTZ,                 -- null = no expiry
  slots_total    INT,                         -- null = unlimited
  slots_taken    INT NOT NULL DEFAULT 0,
  title_fr       TEXT NOT NULL, title_ar   TEXT,
  summary_fr     TEXT NOT NULL, summary_ar TEXT,
  body_fr        TEXT,          body_ar    TEXT,   -- longer description, plain text/markdown
  image          TEXT,                        -- '/uploads/xxx.webp'
  whatsapp_fr    TEXT NOT NULL DEFAULT '', whatsapp_ar TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offers_live ON offers (active, ends_at);

CREATE TABLE IF NOT EXISTS testimonials (
  id           BIGSERIAL PRIMARY KEY,
  sort_order   INT NOT NULL DEFAULT 100,
  published    BOOL NOT NULL DEFAULT true,
  name         TEXT NOT NULL,
  city         TEXT NOT NULL DEFAULT '',
  destination_id TEXT REFERENCES destinations(id) ON DELETE SET NULL,
  quote_fr     TEXT NOT NULL, quote_ar TEXT
);

-- attribute leads / clicks to an offer
ALTER TABLE leads  ADD COLUMN IF NOT EXISTS offer_slug TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS offer_slug TEXT;
