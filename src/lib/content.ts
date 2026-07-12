// Data access layer for DB-backed content. All page queries go through here —
// pages never write raw SQL. Every bilingual column pair (*_fr / *_ar) is
// mapped back to a `Bi` object so templates keep using `pick(value, locale)`.
import { getSql } from './db';
import type { Bi } from '../i18n/ui';

export type Track = { key: string; title: Bi; points: Bi[] };
export type Destination = {
  id: string; order: number; available: boolean; flag: string;
  title: Bi; intro: Bi;
  seo?: { title: Bi; description: Bi };
  image3d: string | null; imageHero: string | null;
  meshFrom: string; meshTo: string;
  tracks: Track[];
  services: Service[];
};
export type Service = {
  id: string; order: number; available: boolean; isGlobal: boolean;
  icon: string; iconImage: string | null;
  title: Bi; tagline: Bi; summary: Bi;
  includes: Bi[]; whatsapp: Bi;
  seo?: { title: Bi; description: Bi };
  destinations: Pick<Destination, 'id' | 'flag' | 'title' | 'available'>[];
};
export type Testimonial = { id: number; name: string; city: string; destinationId: string | null; quote: Bi };

const bi = (fr: string | null | undefined, ar?: string | null): Bi => ({ fr: fr ?? '', ar: ar ?? undefined });
const biList = (fr: string[] | null, ar: string[] | null): Bi[] =>
  (fr ?? []).map((f, i) => ({ fr: f, ar: ar?.[i] ?? undefined }));
const seoOf = (r: any): { title: Bi; description: Bi } | undefined =>
  r.seo_title_fr || r.seo_desc_fr
    ? { title: bi(r.seo_title_fr ?? r.title_fr, r.seo_title_ar), description: bi(r.seo_desc_fr ?? '', r.seo_desc_ar) }
    : undefined;

let warned = false;
function sqlOrWarn() {
  const sql = getSql();
  if (!sql && !warned) {
    warned = true;
    console.warn('[content] DATABASE_URL is not set — content queries return empty results. Set DATABASE_URL and run `npm run db:migrate`.');
  }
  return sql;
}

function mapDestination(r: any): Destination {
  return {
    id: r.id, order: r.sort_order, available: r.available, flag: r.flag,
    title: bi(r.title_fr, r.title_ar), intro: bi(r.intro_fr, r.intro_ar),
    seo: seoOf(r),
    image3d: r.image_3d, imageHero: r.image_hero,
    meshFrom: r.mesh_from ?? '#E45424', meshTo: r.mesh_to ?? '#F7B450',
    tracks: [], services: [],
  };
}
function mapService(r: any): Service {
  return {
    id: r.id, order: r.sort_order, available: r.available, isGlobal: r.is_global,
    icon: r.icon, iconImage: r.icon_image,
    title: bi(r.title_fr, r.title_ar), tagline: bi(r.tagline_fr, r.tagline_ar),
    summary: bi(r.summary_fr, r.summary_ar),
    includes: biList(r.includes_fr, r.includes_ar),
    whatsapp: bi(r.whatsapp_fr, r.whatsapp_ar),
    seo: seoOf(r),
    destinations: [],
  };
}

export async function getDestinations(opts: { availableOnly?: boolean } = {}): Promise<Destination[]> {
  const sql = sqlOrWarn();
  if (!sql) return [];
  const rows = opts.availableOnly
    ? await sql`SELECT * FROM destinations WHERE available = true ORDER BY sort_order, id`
    : await sql`SELECT * FROM destinations ORDER BY sort_order, id`;
  return rows.map(mapDestination);
}

export async function getDestination(id: string): Promise<Destination | null> {
  const sql = sqlOrWarn();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM destinations WHERE id = ${id}`;
  if (rows.length === 0) return null;
  const dest = mapDestination(rows[0]);
  const tracks = await sql`SELECT * FROM destination_tracks WHERE destination_id = ${id} ORDER BY sort_order, id`;
  dest.tracks = tracks.map((t) => ({ key: t.key, title: bi(t.title_fr, t.title_ar), points: biList(t.points_fr, t.points_ar) }));
  // linked services first (in their per-destination order), then any global service not already linked
  const svc = await sql`
    SELECT s.*, COALESCE(ds.sort_order, 1000 + s.sort_order) AS link_order
    FROM services s
    LEFT JOIN destination_services ds ON ds.service_id = s.id AND ds.destination_id = ${id}
    WHERE s.available = true AND (ds.destination_id IS NOT NULL OR s.is_global = true)
    ORDER BY link_order, s.sort_order, s.id`;
  dest.services = svc.map(mapService);
  return dest;
}

export async function getServices(opts: { availableOnly?: boolean } = {}): Promise<Service[]> {
  const sql = sqlOrWarn();
  if (!sql) return [];
  const rows = opts.availableOnly
    ? await sql`SELECT * FROM services WHERE available = true ORDER BY sort_order, id`
    : await sql`SELECT * FROM services ORDER BY sort_order, id`;
  return rows.map(mapService);
}

export async function getService(id: string): Promise<Service | null> {
  const sql = sqlOrWarn();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM services WHERE id = ${id}`;
  if (rows.length === 0) return null;
  const service = mapService(rows[0]);
  const dests = service.isGlobal
    ? await sql`SELECT * FROM destinations WHERE available = true ORDER BY sort_order, id`
    : await sql`
        SELECT d.* FROM destinations d
        JOIN destination_services ds ON ds.destination_id = d.id
        WHERE ds.service_id = ${id}
        ORDER BY d.sort_order, d.id`;
  service.destinations = dests.map((d) => ({ id: d.id, flag: d.flag, title: bi(d.title_fr, d.title_ar), available: d.available }));
  return service;
}

export async function getTestimonials(destinationId?: string): Promise<Testimonial[]> {
  const sql = sqlOrWarn();
  if (!sql) return [];
  const rows = destinationId
    ? await sql`SELECT * FROM testimonials WHERE published = true AND destination_id = ${destinationId} ORDER BY sort_order, id`
    : await sql`SELECT * FROM testimonials WHERE published = true ORDER BY sort_order, id`;
  return rows.map((r) => ({ id: Number(r.id), name: r.name, city: r.city, destinationId: r.destination_id, quote: bi(r.quote_fr, r.quote_ar) }));
}

export { getLiveOffers, getOffer, type Offer } from './offers';
