# Agence — site vitrine (lead-gen)

Bilingual (FR default + AR/RTL) lead-generation site for an immigration / study-abroad / travel agency. Astro 5 SSR, hand-written CSS, Postgres-backed content, admin panel, Telegram ops bot. Every CTA routes to WhatsApp or a lead form — **no prices shown anywhere**.

Since v2, the changing content (**destinations, services, offers, testimonials**) lives in **Postgres** and is managed from **`/admin`** — no redeploy needed to add a country or launch a time-limited offer.

## Run it locally

Requires **Node 20.3+ or 22+** and a **Postgres** database (content is served from it). Telegram stays optional.

```bash
cp .env.example .env    # set DATABASE_URL (and the rest as needed)
npm install
npm run db:migrate      # creates all tables + seeds destinations/services/testimonials
npm run dev
```

Open http://localhost:4321 (FR) and http://localhost:4321/ar (AR / RTL). Admin: http://localhost:4321/admin (password = `ADMIN_PASSWORD` from `.env`).

Without `DATABASE_URL` the site still boots — pages render with empty content lists and a console warning, and lead submissions are logged to the console (`[lead:dev] {...}`).

## Environment variables

See `.env.example` for the full list:

- `PUBLIC_*` — agency name, city, WhatsApp number (E.164 digits only, e.g. `2137XXXXXXXX`), phone display, FB/IG links, hours. Dev-safe fallbacks exist.
- `DATABASE_URL` — **required for content** (destinations, services, offers, testimonials) + leads/events.
- `APP_SALT` — hashes visitor IPs and signs the admin session cookie. Change it in production.
- `ADMIN_PASSWORD` — the single admin password for `/admin`.
- `UPLOAD_DIR` — where admin image uploads are written (default `./public/uploads`).
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` — set both to enable the Telegram bot; unset = bot silently off.
- `TELEGRAM_DIGEST_HOUR` — optional daily digest hour (0–23, server-local time).

## Admin panel (`/admin`)

Server-rendered, plain HTML forms, single shared password (7-day signed session cookie).

- **Tableau de bord** — leads & WhatsApp clicks this week, live offers, top-performing offer.
- **Leads** — status triage (`nouveau / contacté / gagné / perdu`), "Ouvrir WhatsApp" per row, CSV export.
- **Offres** — create/edit/delete, activate/deactivate, homepage banner toggle, end dates and slot counts. An offer disappears from the site the moment it expires or sells out — SSR, no cron, no rebuild.
- **Destinations** — create/edit/delete, "Bientôt" toggle, 3D image + hero photo upload, flag colours for the card gradient, audience tracks (étudiants/travailleurs/résidence), which services apply.
- **Services** — create/edit/delete, visibility + "global" toggles, 3D icon upload.
- **Témoignages** — create/edit/delete, publish toggle.

FR fields are required; AR fields are optional and fall back to FR on the public site. Slugs are immutable after creation (URLs never break).

## Offers & lead attribution

Offers live at `/offres` (AR: `/ar/offres`). A `featured` live offer shows as a banner on the homepage. Every offer CTA and the offer-page lead form carry the offer slug, so `leads.offer_slug` and `events.offer_slug` tell you **which offer produced contacts** — visible on the dashboard and in `/stats` on Telegram.

An offer is *live* when: `active`, started (or no start date), not ended (or no end date), and has slots left (or no slot limit). Deadline / remaining-slot urgency lines only show when those fields are set — no fabricated scarcity.

## Telegram bot (optional)

One long-polling worker inside the same Node process; starts only when `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` are set, and only ever talks to the admin chat.

- **New-lead notifications** with a `wa.me` reply link and inline **Contacté / Gagné / Perdu** buttons — tap to update the lead status from your phone.
- Commands: `/leads` (last 5), `/stats` (week), `/offers` (live offers), `/offer_off <slug>` (emergency kill switch).
- Optional daily digest at `TELEGRAM_DIGEST_HOUR`.

## Image uploads on Railway

`./public/uploads` is **ephemeral** on Railway — files vanish on redeploy. Mount a **Railway volume** at `/data/uploads` and set `UPLOAD_DIR=/data/uploads`. Uploaded files are served by the `GET /uploads/[...file]` route, so they work from any directory. Uploads accept png/jpg/webp up to 4 MB (validated by magic bytes, random filenames).

## Build for production

```bash
npm run build
npm run preview        # serves dist/ on the node adapter
```

Deploy target: a single Node service (e.g. Railway) + a Postgres addon + a volume for uploads. Run `npm run db:migrate` once per deploy (it is idempotent). Set the env vars above in the host.

## Where to edit content

- **Destinations / services / offers / testimonials** — in `/admin` (stored in Postgres).
- **UI strings** — `src/i18n/ui.ts`.
- **Process / about / legal copy** — in the page components (never changes).
- **Trust numbers** — `TRUST` in `src/consts.ts` (currently placeholders — swap for real figures).
- **Design tokens** — top of `src/styles/global.css`.

## Before going live — supply the real data

1. Confirm the real service list + wording (editable later in `/admin`).
2. Real trust numbers (dossiers, années, ville) in `src/consts.ts`.
3. Real WhatsApp number + FB/IG links in `.env`.
4. A strong `ADMIN_PASSWORD` and `APP_SALT`.

## Branding & design

- **Logo** — `public/logo.png` (swap for a higher-res / transparent version when you have one).
- **Brand colour** — `--sun: #E45424` (sampled from the logo) drives the whole palette. All design tokens live at the top of `src/styles/global.css`.
- **Fonts** — Fraunces (display), Sora (UI), Plus Jakarta Sans (body), Space Mono (departure board), IBM Plex Sans Arabic (AR). Loaded from Google Fonts; they fall back to system fonts offline.
- **Motion** — scroll reveals, count-up stats, animated hero (sun rays, plane fly-in), header shrink, hero parallax. All respect `prefers-reduced-motion`. Runtime lives in `src/layouts/Base.astro`.
- **Destination art** — upload a transparent 3D landmark PNG + a wide hero photo per destination in `/admin`; the seeded France/Canada images live in `public/destinations/`. Everything degrades gracefully until you add them.
- **3D icons** — upload per service in `/admin` (or drop PNGs into `public/icons/` named after the slug). Service icons fall back to built-in line icons if absent.

### Home hero background (optional photo)
The home hero uses an animated SVG scene by default. To put a photographic
desert-dusk behind it, add `public/hero/desert-dusk.webp`, then append this to
the bottom of `src/styles/global.css`:

```css
.hero { background-image: linear-gradient(180deg, rgba(255,247,236,.35), rgba(246,223,197,.6) 70%, var(--sand)), url('/hero/desert-dusk.webp'); background-size: cover; background-position: center; }
.hero__scene { opacity: .55; }
```

## Analytics

The `events` table answers "which destination/service/offer drives WhatsApp clicks" (the dashboard shows the same):

```sql
SELECT service, count(*) FROM events WHERE kind='wa_click' GROUP BY service ORDER BY 2 DESC;
SELECT destination, count(*) FROM leads GROUP BY destination ORDER BY 2 DESC;
SELECT offer_slug, count(*) FROM leads WHERE offer_slug IS NOT NULL GROUP BY offer_slug ORDER BY 2 DESC;
```
