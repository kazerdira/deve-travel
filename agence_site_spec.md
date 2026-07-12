# agence_site_spec.md

Lead-generation / trust website for an Algerian **agence** offering immigration, study-abroad, and travel-assistance services (TCF/TEF, Campus France, visa dossiers, RDV booking, sworn translation, flight tickets, etc.).

Placeholders to fill before build: `<AGENCY_NAME>`, `<AGENCY_CITY>`, `<WHATSAPP_NUMBER>` (E.164, e.g. `2137XXXXXXXX`), `<DOMAIN>`, `<FB_URL>`, `<IG_URL>`, `<TELEGRAM_ADMIN_CHAT_ID>`.

---

## 0. Goal / Non-goals

**Goal:** A mobile-first, SEO-optimized, bilingual (FR default + AR/RTL) marketing site whose single job is to convert Google/Facebook/Instagram traffic into WhatsApp conversations and captured leads. It is a conversion machine, not a portfolio and not a client portal.

**Primary KPI:** WhatsApp click-throughs + qualified form submissions, attributable per-service and per-destination.

**Non-goals for v1 (explicitly out of scope):**
- No online payment (no SATIM/CIB/BaridiMob integration). Deposits are handled off-site by the agency.
- No client portal, no dossier upload, no appointment dashboard, no auth. The agency's real workflow is relationship-based over WhatsApp.
- No pricing displayed anywhere. Every price-adjacent CTA routes to contact.
- No blog/CMS admin UI in v1 (content edited via MDX files in repo).

---

## 1. Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Astro 5** (SSR, `output: 'server'`) | Built-in i18n, content collections, island architecture, best-in-class SEO. |
| Adapter | `@astrojs/node` (standalone) | Single Node process on Railway; API routes live in-app, no separate backend. |
| Styling | **Tailwind CSS v4** | Fast, mobile-first, low ceremony. |
| Interactive islands | Astro + minimal vanilla/Solid where needed | Keep JS payload tiny. Only the lead form and lang/RTL toggle need JS. |
| Content | **MDX content collections** (`src/content/`) | Services + destinations are data, bilingual, editable without code. |
| DB | **PostgreSQL** (Railway addon) | Leads + click events only. |
| DB client | `postgres` (porsager) | Tiny, fast, no ORM overhead. Raw SQL migrations in `/migrations`. |
| Validation | `zod` | Form + API payload validation. |
| Admin notify | **Telegram Bot API** (raw `fetch`) | Free, instant, no lib. Alerts agency on every new lead. |
| Email (optional) | Resend | Optional second notification channel. Gate behind env var. |
| Hosting | **Railway** — one service (Astro Node) + Postgres | Single deploy. |

No Go, no Flutter. This is a marketing site; heaviness is the enemy.

---

## 2. Architecture

```
Browser (mobile-first)
   │
   ├── GET /fr/* , /ar/*  ─────► Astro SSR (Railway Node)
   │                                 ├── renders MDX content collections
   │                                 └── injects hreflang, JSON-LD, OG
   │
   ├── click "WhatsApp"  ──────► navigator.sendBeacon('/api/track')  → events table
   │                            → window.open(wa.me/<NUMBER>?text=...)
   │
   └── submit lead form  ──────► POST /api/lead
                                    ├── zod validate
                                    ├── INSERT leads
                                    ├── Telegram notify admin
                                    └── (optional) Resend email
```

- All content pages are SSR but effectively static (cacheable). Only `/api/*` is dynamic.
- No client-side routing. Each page is a real URL for SEO.

---

## 3. i18n / RTL

- Astro i18n routing. Locales: `fr` (default, no prefix or `/fr`), `ar`.
  - `i18n: { defaultLocale: 'fr', locales: ['fr','ar'], routing: { prefixDefaultLocale: false } }`
- UI strings in `src/i18n/{fr,ar}.json`. Helper `t(key, locale)`.
- AR pages set `<html dir="rtl" lang="ar">`; FR `dir="ltr"`.
- **Use CSS logical properties everywhere** (`margin-inline-start`, `padding-inline-end`, `text-align: start`) so a single stylesheet serves both directions. Tailwind v4: use logical utilities / `rtl:` variants only where logical props can't reach.
- Language switch persists via a cookie (`locale`) and swaps to the equivalent route.
- **Sequencing:** build and ship FR fully first. AR content fields exist in the collection schema from the start (nullable), so AR is added per-entry without schema changes or layout rework. A page with no AR content falls back to FR with a subtle notice — never a broken/empty AR page.

---

## 4. Content model (MDX collections)

### 4.1 `services` collection
`src/content/services/{slug}.mdx` — one file per service, frontmatter bilingual.

```yaml
slug: tcf
order: 10
icon: file-check          # lucide icon name
available: true
title:
  fr: "Inscription TCF / TEF"
  ar: "التسجيل في TCF / TEF"
tagline:
  fr: "Réservez votre session, préparez-vous, réussissez."
  ar: "..."
summary:
  fr: "Nous gérons votre inscription au TCF/TEF..."
  ar: "..."
# body (MDX below frontmatter) = full description, bilingual via <Fr>/<Ar> slots or two files
whatsappTemplate:
  fr: "Bonjour, je souhaite des informations sur l'inscription TCF/TEF."
  ar: "..."
seo:
  title: { fr: "...", ar: "..." }
  description: { fr: "...", ar: "..." }
```

**Seed services (v1):**
1. `tcf` — Inscription TCF / TEF
2. `campus-france` — Campus France / Études en France (dossier, RDV, entretien)
3. `visa-dossier` — Constitution & vérification de dossier visa
4. `rdv-booking` — Prise de rendez-vous (TLS / VFS / consulat)
5. `translation` — Traduction assermentée
6. `flights` — Billets d'avion
7. `accommodation` — Attestation d'hébergement / réservation
8. `cv-lm` — CV & lettre de motivation

### 4.2 `destinations` collection
`src/content/destinations/{slug}.mdx`

```yaml
slug: france
order: 10
available: true
flag: fr
title: { fr: "France", ar: "فرنسا" }
tracks:                    # audience tracks shown as tabs/cards
  - key: student
    title: { fr: "Étudiants", ar: "الطلبة" }
    body: { fr: "Campus France, TCF, visa étudiant...", ar: "..." }
  - key: worker
    title: { fr: "Travailleurs", ar: "العمال" }
    body: { fr: "...", ar: "..." }
  - key: pr
    title: { fr: "Résidence / Immigration", ar: "الإقامة" }
    body: { fr: "...", ar: "..." }
services: [tcf, campus-france, visa-dossier, rdv-booking, translation, flights, accommodation, cv-lm]
seo: { title: {...}, description: {...} }
```

**Seed destinations (v1):**
- `france` — `available: true`, tracks: student / worker / pr
- `canada` — `available: true`, tracks: student / worker / pr (Express Entry-adjacent messaging, no legal advice claims)
- `spain` — `available: false` → renders "Bientôt disponible" card, no dedicated page indexed
- `portugal` — `available: false` → same

`available: false` destinations: show a greyed card + "bientôt" badge on listings; do **not** generate an indexable page (return 404 or noindex) until toggled true.

### 4.3 `testimonials` collection (optional but recommended for trust)
`{name, city, destination, quote:{fr,ar}, rating}`. Even 4–6 real ones materially lift conversion.

---

## 5. Data model (Postgres)

Only two tables. Content is NOT in the DB.

```sql
-- migrations/001_init.sql

CREATE TABLE leads (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,          -- normalized E.164 where possible
  email         TEXT,
  destination   TEXT,                   -- france|canada|spain|portugal|null
  service       TEXT,                   -- service slug or null
  audience      TEXT,                   -- student|worker|pr|null
  message       TEXT,
  locale        TEXT NOT NULL,          -- fr|ar
  source        TEXT,                   -- utm_source or referrer bucket
  page_path     TEXT,                   -- where the form was submitted
  status        TEXT NOT NULL DEFAULT 'new',  -- new|contacted|won|lost
  ip_hash       TEXT,                   -- sha256(ip+salt), spam throttle only
  user_agent    TEXT
);
CREATE INDEX idx_leads_created ON leads (created_at DESC);
CREATE INDEX idx_leads_status  ON leads (status);

CREATE TABLE events (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind          TEXT NOT NULL,          -- wa_click | form_view | form_submit | call_click
  destination   TEXT,
  service       TEXT,
  locale        TEXT,
  page_path     TEXT,
  source        TEXT
);
CREATE INDEX idx_events_kind_created ON events (kind, created_at DESC);
CREATE INDEX idx_events_dest ON events (destination);
CREATE INDEX idx_events_service ON events (service);
```

**Instrumentation is the point.** These two tables let the agency answer: *which destination drives the most WhatsApp clicks*, *which service page converts*, *FR vs AR*. This is the distribution feedback loop.

---

## 6. Routes / sitemap

```
/                         → redirect to /fr (or serve FR at root)
/fr                       Home (FR)
/fr/services              Services index
/fr/services/[slug]       Service detail
/fr/destinations          Destinations index
/fr/destinations/[slug]   Destination detail (with audience tracks)
/fr/processus             "Comment ça marche" (5-step process)
/fr/a-propos              About / trust
/fr/contact               Contact (WhatsApp + form + map/hours)
/fr/mentions-legales      Legal
/fr/confidentialite       Privacy (GDPR-lite: what we collect, why, retention)

/ar/... mirror of all above (RTL)

/api/lead                 POST — create lead
/api/track                POST — event beacon (wa_click, etc.)
/sitemap-index.xml        auto (@astrojs/sitemap)
/robots.txt
```

Every content page emits `hreflang` alternates (fr/ar/x-default).

---

## 7. Page specs (key sections)

### 7.1 Home
Order top→bottom (mobile-first single column):
1. **Hero** — headline (destination-mission framing: "Votre projet France, Canada — accompagné de A à Z"), subhead, primary CTA **[Contacter sur WhatsApp]**, secondary **[Demander un devis]** (scrolls to form). Trust microcopy under CTA ("Réponse sous 24h · Accompagnement personnalisé").
2. **Trust strip** — dossiers traités / clients accompagnés / années d'expérience (fill real numbers, no fabrication). If numbers are weak, replace with "Agréé / basé à `<AGENCY_CITY>` · Suivi personnalisé".
3. **Destinations grid** — France, Canada cards (active), Spain/Portugal (bientôt). Each links to destination page.
4. **Services grid** — 8 service cards, icon + title + tagline, each card CTA → WhatsApp with service-specific prefill.
5. **Process (3–5 steps)** — Contact → Évaluation → Constitution du dossier → Suivi → Départ.
6. **Testimonials** carousel (if available).
7. **Final CTA band** — big WhatsApp button + form.
8. **Footer** — hours, city, WhatsApp, FB/IG, language switch, legal links.

### 7.2 Service detail `[slug]`
Hero (title, tagline) → what's included (MDX body) → "Pour quelles destinations" (linked chips) → process for this service → sticky mobile CTA bar (WhatsApp prefilled with `whatsappTemplate`) → related services → form.

### 7.3 Destination detail `[slug]`
Hero (flag, title) → **audience track tabs** (Étudiants / Travailleurs / Résidence) each with its body → services relevant to this destination (linked) → process → testimonials filtered by destination → CTA + form.

If `available: false` → this route is `noindex` and shows a "bientôt disponible, laissez vos coordonnées" mini-form only.

### 7.4 Contact
WhatsApp button (primary) · phone (tel: with `call_click` tracking) · lead form · opening hours · city / neighborhood (embed a lightweight static map image or a link, not a heavy JS map) · FB/IG.

---

## 8. Components

- `<LangSwitch>` — swaps route + sets cookie + flips `dir`.
- `<WhatsAppButton service? destination? locale>` — builds `https://wa.me/<NUMBER>?text=<encoded prefill>`, fires `sendBeacon('/api/track', {kind:'wa_click', service, destination, locale, page_path})` before opening. **Reusable everywhere.**
- `<LeadForm context={service?, destination?, audience?}>` — island. Fields: nom, téléphone (required), email (optional), destination (select, prefilled from context), service (select, prefilled), profil (student/worker/pr), message. Client zod + server zod. On submit → POST `/api/lead`. Success state inline (no redirect). Also fires `form_submit` event.
- `<ServiceCard>`, `<DestinationCard>`, `<TrackTabs>`, `<ProcessSteps>`, `<TrustStrip>`, `<TestimonialCarousel>`, `<StickyCtaBar>` (mobile).
- `<Seo>` — title, description, canonical, hreflang alternates, OG, JSON-LD.

---

## 9. API

### `POST /api/lead`
Body (JSON): `{ name, phone, email?, destination?, service?, audience?, message?, locale, page_path, source? }`
- zod validate; reject if honeypot field filled or if `ip_hash` submitted >5 leads/hour → 429.
- `INSERT leads`.
- Fire Telegram notify (see §10) — non-blocking (don't fail the request if Telegram is down; log it).
- Optional Resend email if `RESEND_API_KEY` set.
- Also `INSERT events(kind='form_submit', ...)`.
- Return `{ ok: true }`. Never leak internal errors to client.

### `POST /api/track`
Body: `{ kind, destination?, service?, locale?, page_path?, source? }`
- Whitelist `kind ∈ {wa_click, form_view, call_click}`.
- Lightweight; `INSERT events`. No PII. Fire-and-forget, return 204.

Rate-limit both by `ip_hash` (sha256(ip + APP_SALT)) — throttle only, don't store raw IP.

---

## 10. Admin notification (Telegram)

On new lead, POST to Telegram Bot API:
```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage
chat_id=<TELEGRAM_ADMIN_CHAT_ID>
text (Markdown):
🆕 *Nouveau lead* — <AGENCY_NAME>
👤 {name}
📞 {phone}
🌍 {destination} · {audience}
🧩 {service}
💬 {message}
🕒 {created_at} · {locale} · {page_path}
```
- Include an inline button/link `https://wa.me/{phone}` so the agency taps straight into a WhatsApp chat with the lead.
- This is internal ops tooling — Telegram for admin alerts, WhatsApp for actual client contact. Two channels, correct roles.

---

## 11. SEO

- SSR + effectively-static pages; `@astrojs/sitemap`; per-locale sitemaps in index.
- `hreflang` fr / ar / x-default on every page.
- JSON-LD: `LocalBusiness` (name, city, `areaServed: DZ`, telephone, sameAs FB/IG) on all pages; `Service` schema on service pages; `BreadcrumbList`.
- Per-page title/description from content `seo` fields (bilingual).
- Semantic headings, alt text on all imagery, `loading="lazy"`, responsive `srcset`.
- Target queries to optimize copy around (FR): "agence visa étudiant `<CITY>`", "inscription TCF `<CITY>` prix", "Campus France accompagnement", "dossier visa Canada Algérie", "prise de rendez-vous TLS/VFS". Weave naturally into service/destination MDX.
- OG image per destination/service (static, generated once).
- Core Web Vitals: near-zero JS, LCP hero image optimized (`astro:assets`), fonts self-hosted `font-display: swap`.

---

## 12. Design system

Direction: **credible / institutional, restrained**. This audience is entrusting migration plans + deposit money — trust > flash. No heavy glassmorphism.

Tokens:
```
--brand:        deep blue (trust / official / travel)  e.g. #12408A
--brand-2:      lighter blue for accents
--accent:       warm gold/amber for CTAs (contrast, "action")
--ok:           WhatsApp green ONLY on WhatsApp buttons (#25D366) — recognizable
--ink:          near-black text
--muted:        slate gray
--bg:           #FFFFFF / very light neutral
--surface:      #F6F8FB card background
radius:         12–16px (soft, not pill)
shadow:         subtle, single-layer
```
- Typography: FR — Inter / system; AR — a clean readable Arabic face (e.g. Cairo / IBM Plex Sans Arabic), self-hosted. Larger base line-height for AR.
- Big tap targets (≥48px), sticky mobile CTA bar with WhatsApp.
- Photography: real, aspirational-but-credible (airports, campuses, documents). Avoid obvious stock cliché.
- Trust elements: process clarity, testimonial faces, hours, physical city presence, response-time promise, FB/IG links with follower proof.

Load `frontend-design` skill guidance when building the actual UI.

---

## 13. Env vars

```
DATABASE_URL=
APP_SALT=                       # for ip_hash
PUBLIC_SITE_URL=https://<DOMAIN>
PUBLIC_WHATSAPP_NUMBER=<WHATSAPP_NUMBER>   # E.164, digits only
PUBLIC_FB_URL=
PUBLIC_IG_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
RESEND_API_KEY=                 # optional
```
`PUBLIC_*` are exposed to client (used by WhatsApp button etc.).

---

## 14. Build phases (gate at Phase 5)

**Phase 1 — Skeleton**
Astro + Node adapter + Tailwind + i18n routing (fr/ar) + base layout, header/footer, `<Seo>`, `<LangSwitch>`. Deploy empty shell to Railway. RTL verified with a dummy AR page.

**Phase 2 — Content model + FR content**
Define `services`, `destinations`, `testimonials` collections + schemas. Author all 8 services + France & Canada in **FR only**. Spain/Portugal as `available:false` stubs.

**Phase 3 — Pages + components (FR)**
Home, services index/detail, destinations index/detail (track tabs), process, about, contact, legal. `<WhatsAppButton>`, `<ServiceCard>`, `<DestinationCard>`, `<StickyCtaBar>`. Fully clickable FR site, WhatsApp CTAs live.

**Phase 4 — Backend: leads + tracking + notify**
Postgres migrations, `/api/lead`, `/api/track`, `<LeadForm>` island, zod validation, rate-limit, Telegram notify, events instrumentation. End-to-end lead test: submit → row in DB → Telegram ping.

**── GATE (Phase 5): FR launch-ready review ──**
Checklist before proceeding: Lighthouse mobile ≥90 (Perf/SEO/A11y); hreflang + sitemap + JSON-LD valid; every WhatsApp button fires `wa_click` with correct service/destination; lead form works on real mobile; no console errors; content proofread; legal/privacy pages present. **Ship FR to production here.** AR only after this gate — do not let AR block the FR launch.

**Phase 6 — AR localization**
Fill AR fields across all collections + `ar.json` UI strings. RTL QA on every page/component. AR sitemap + hreflang. Ship AR.

**Phase 7 — Polish + analytics review (post-launch)**
OG images, testimonial carousel, static map, small admin query script (`SELECT` summaries of events by destination/service) so the agency sees conversion by channel. Feed learnings back into ad targeting.

---

## 15. v2 / later (not now)
- Simple admin dashboard (read-only) over leads/events (HTMX or Astro page behind basic auth).
- BaridiMob deposit-confirmation flow (manual).
- Blog for SEO (MDX collection already supports it).
- WhatsApp Business API automation.
- Spain/Portugal content (flip `available`).

---

## 16. Notes / constraints
- **No pricing, ever** — all price intent → WhatsApp/form. This is deliberate and matches the market.
- No legal-advice claims on Canada immigration (avoid regulated-consultant liability); frame as "accompagnement administratif / préparation de dossier".
- Privacy page must state: data collected (name/phone/email), purpose (rappel/devis), retention, and a contact to request deletion. Keep it honest and short.
- Keep total JS shipped minimal; only the form + lang switch + track beacon need client JS.
