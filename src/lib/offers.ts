// Offers: time-limited deals stored in Postgres. Because pages are SSR, an
// expired offer simply disappears on the next request — no cron, no rebuild.
import type postgres from 'postgres';
import { getSql } from './db';
import { t, type Bi, type Locale } from '../i18n/ui';

export type Offer = {
  id: number; slug: string;
  destinationId: string | null; countryLabel: string; flag: string;
  active: boolean; featured: boolean;
  startsAt: Date | null; endsAt: Date | null;
  slotsTotal: number | null; slotsTaken: number;
  title: Bi; summary: Bi; body: Bi;
  image: string | null; whatsapp: Bi;
};

/** The single definition of "this offer is live" — never re-hand-write it. */
export function liveOffersQuery(sql: postgres.Sql) {
  return sql`
    active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
    AND (slots_total IS NULL OR slots_taken < slots_total)`;
}

const bi = (fr: string | null | undefined, ar?: string | null): Bi => ({ fr: fr ?? '', ar: ar ?? undefined });

/** Honest urgency line: deadline only if ends_at is set, slots only if slots_total is set. */
export function urgency(offer: Offer, locale: Locale): string | null {
  const parts: string[] = [];
  if (offer.endsAt) {
    const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(offer.endsAt);
    parts.push(`${t(locale, 'offers.until')} ${date}`);
  }
  if (offer.slotsTotal != null) {
    const left = Math.max(0, offer.slotsTotal - offer.slotsTaken);
    parts.push(`${left} ${t(locale, left === 1 ? 'offers.slot' : 'offers.slots')}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

function mapOffer(r: any): Offer {
  return {
    id: Number(r.id), slug: r.slug,
    destinationId: r.destination_id, countryLabel: r.country_label, flag: r.flag,
    active: r.active, featured: r.featured,
    startsAt: r.starts_at, endsAt: r.ends_at,
    slotsTotal: r.slots_total, slotsTaken: r.slots_taken,
    title: bi(r.title_fr, r.title_ar), summary: bi(r.summary_fr, r.summary_ar),
    body: bi(r.body_fr, r.body_ar),
    image: r.image, whatsapp: bi(r.whatsapp_fr, r.whatsapp_ar),
  };
}

export async function getLiveOffers(opts: { featured?: boolean; destinationId?: string; limit?: number } = {}): Promise<Offer[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT * FROM offers
    WHERE ${liveOffersQuery(sql)}
    ${opts.featured ? sql`AND featured = true` : sql``}
    ${opts.destinationId ? sql`AND destination_id = ${opts.destinationId}` : sql``}
    ORDER BY ends_at ASC NULLS LAST, created_at DESC
    ${opts.limit ? sql`LIMIT ${opts.limit}` : sql``}`;
  return rows.map(mapOffer);
}

/** Returns null when the offer is not live, unless opts.preview (admin). */
export async function getOffer(slug: string, opts: { preview?: boolean } = {}): Promise<Offer | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = opts.preview
    ? await sql`SELECT * FROM offers WHERE slug = ${slug}`
    : await sql`SELECT * FROM offers WHERE slug = ${slug} AND ${liveOffersQuery(sql)}`;
  return rows.length ? mapOffer(rows[0]) : null;
}
