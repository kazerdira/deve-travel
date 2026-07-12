// Read helpers for the admin pages. Admin works on raw DB rows (snake_case)
// so the plain HTML forms map 1:1 to columns.
import { getSql } from './db';
import { liveOffersQuery } from './offers';

const sqlOrNull = () => getSql();

export async function listLeads(limit = 200) {
  const sql = sqlOrNull();
  if (!sql) return [];
  return sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function listOffers() {
  const sql = sqlOrNull();
  if (!sql) return [];
  return sql`
    SELECT *, (${liveOffersQuery(sql)}) AS is_live
    FROM offers ORDER BY created_at DESC`;
}
export async function offerById(id: number) {
  const sql = sqlOrNull();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM offers WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function listDestinationsRaw() {
  const sql = sqlOrNull();
  if (!sql) return [];
  return sql`SELECT * FROM destinations ORDER BY sort_order, id`;
}
export async function destinationById(id: string) {
  const sql = sqlOrNull();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM destinations WHERE id = ${id}`;
  if (!rows[0]) return null;
  const tracks = await sql`SELECT * FROM destination_tracks WHERE destination_id = ${id} ORDER BY sort_order`;
  const linked = await sql`SELECT service_id FROM destination_services WHERE destination_id = ${id}`;
  return { ...rows[0], tracks, serviceIds: linked.map((r) => r.service_id) };
}

export async function listServicesRaw() {
  const sql = sqlOrNull();
  if (!sql) return [];
  return sql`SELECT * FROM services ORDER BY sort_order, id`;
}
export async function serviceById(id: string) {
  const sql = sqlOrNull();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM services WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function listTestimonialsRaw() {
  const sql = sqlOrNull();
  if (!sql) return [];
  return sql`SELECT * FROM testimonials ORDER BY sort_order, id`;
}
export async function testimonialById(id: number) {
  const sql = sqlOrNull();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM testimonials WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function dashboardStats() {
  const sql = sqlOrNull();
  if (!sql) return null;
  const [leadsWeek] = await sql`SELECT count(*)::int AS n FROM leads WHERE created_at > now() - interval '7 days'`;
  const [clicksWeek] = await sql`SELECT count(*)::int AS n FROM events WHERE kind = 'wa_click' AND created_at > now() - interval '7 days'`;
  const clicksByService = await sql`
    SELECT service, count(*)::int AS n FROM events
    WHERE kind = 'wa_click' AND created_at > now() - interval '7 days' AND service IS NOT NULL
    GROUP BY service ORDER BY n DESC LIMIT 8`;
  const clicksByDest = await sql`
    SELECT destination, count(*)::int AS n FROM events
    WHERE kind = 'wa_click' AND created_at > now() - interval '7 days' AND destination IS NOT NULL
    GROUP BY destination ORDER BY n DESC LIMIT 8`;
  const topOffers = await sql`
    SELECT offer_slug, count(*)::int AS n FROM leads
    WHERE offer_slug IS NOT NULL AND created_at > now() - interval '30 days'
    GROUP BY offer_slug ORDER BY n DESC LIMIT 5`;
  const liveOffers = await sql`SELECT slug, title_fr, ends_at, slots_total, slots_taken, featured FROM offers WHERE ${liveOffersQuery(sql)} ORDER BY ends_at ASC NULLS LAST`;
  return { leadsWeek: leadsWeek.n, clicksWeek: clicksWeek.n, clicksByService, clicksByDest, topOffers, liveOffers };
}
