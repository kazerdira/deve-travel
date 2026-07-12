# Agence — site vitrine (lead-gen)

Bilingual (FR default + AR/RTL) lead-generation site for an immigration / study-abroad / travel agency. Astro 5 SSR, hand-written CSS, optional Postgres. Every CTA routes to WhatsApp or a lead form — **no prices shown anywhere**.

## Run it locally (zero setup)

Requires **Node 20.3+ or 22+** (`node -v` to check). Postgres and Telegram are **optional** — without them the site runs fully and leads are logged to the server console.

```bash
npm install
npm run dev
```

Open http://localhost:4321 (FR) and http://localhost:4321/ar (AR / RTL).

Submit the form → check the terminal, you'll see `[lead:dev] {...}`. WhatsApp button clicks log `[event:dev] {...}`.

## Configure (optional)

Copy `.env.example` to `.env` and fill what you need:

- `PUBLIC_*` — agency name, city, WhatsApp number (E.164 digits only, e.g. `2137XXXXXXXX`), phone display, FB/IG links, hours. These have dev fallbacks so the site runs without them.
- `DATABASE_URL` — set it to store leads + click events in Postgres instead of the console.
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` — set both to get a Telegram ping on every new lead (with a `wa.me` link to reply to the lead directly).

### With Postgres

```bash
# set DATABASE_URL in .env first
npm run db:migrate     # creates the leads + events tables
npm run dev
```

## Build for production

```bash
npm run build
npm run preview        # serves dist/ on the node adapter
```

Deploy target: a single Node service (e.g. Railway) + a Postgres addon. Set the env vars above in the host.

## Where to edit content

- **Services** — `src/content/services/*.md` (8 files, bilingual frontmatter). Add a file = add a service.
- **Destinations** — `src/content/destinations/*.md`. Set `available: false` to show a "Bientôt" card and hide the page from search. Flip to `true` to launch (Spain/Portugal are stubs).
- **Testimonials** — `src/content/testimonials/*.md`.
- **UI strings** — `src/i18n/ui.ts`.
- **Trust numbers** — `TRUST` in `src/consts.ts` (currently placeholders — swap for real figures).
- **Design tokens** — top of `src/styles/global.css`.

## Before going live — supply the real data

1. Confirm the real service list + wording.
2. Real trust numbers (dossiers, années, ville) in `src/consts.ts`.
3. Real WhatsApp number + FB/IG links in `.env`.

## Branding & design

- **Logo** — `public/logo.png` (swap for a higher-res / transparent version when you have one).
- **Brand colour** — `--sun: #E45424` (sampled from the logo) drives the whole palette. All design tokens live at the top of `src/styles/global.css`.
- **Fonts** — Fraunces (display), Sora (UI), Plus Jakarta Sans (body), Space Mono (departure board), IBM Plex Sans Arabic (AR). Loaded from Google Fonts; they fall back to system fonts offline.
- **Motion** — scroll reveals, count-up stats, animated hero (sun rays, plane fly-in), header shrink, hero parallax. All respect `prefers-reduced-motion`. Runtime lives in `src/layouts/Base.astro`.
- **Destination art** — hand-built SVG "postcards" were replaced by real image slots. See **`public/ASSETS.md`** for exactly which files to add, their names, and folders. Everything degrades gracefully until you add them.
- **3D icons & landmarks** — drop transparent PNGs into `public/icons/` and `public/destinations/` per `public/ASSETS.md`. Service icons fall back to built-in line icons if absent.

### Home hero background (optional photo)
The home hero uses an animated SVG scene by default. To put a photographic
desert-dusk behind it, add `public/hero/desert-dusk.webp`, then append this to
the bottom of `src/styles/global.css`:

```css
.hero { background-image: linear-gradient(180deg, rgba(255,247,236,.35), rgba(246,223,197,.6) 70%, var(--sand)), url('/hero/desert-dusk.webp'); background-size: cover; background-position: center; }
.hero__scene { opacity: .55; }
```

## Analytics

Once Postgres is connected, the `events` table answers "which destination/service drives WhatsApp clicks":

```sql
SELECT service, count(*) FROM events WHERE kind='wa_click' GROUP BY service ORDER BY 2 DESC;
SELECT destination, count(*) FROM leads GROUP BY destination ORDER BY 2 DESC;
```
