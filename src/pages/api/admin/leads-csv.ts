import type { APIRoute } from 'astro';
import { getSql } from '../../../lib/db';

export const prerender = false;

const esc = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const GET: APIRoute = async () => {
  const sql = getSql();
  if (!sql) return new Response('DATABASE_URL non configuré', { status: 500 });
  const rows = await sql`
    SELECT id, created_at, name, phone, email, destination, service, audience, offer_slug, status, locale, page_path, message
    FROM leads ORDER BY created_at DESC`;
  const header = ['id', 'date', 'nom', 'telephone', 'email', 'destination', 'service', 'profil', 'offre', 'statut', 'langue', 'page', 'message'];
  const lines = rows.map((r) => [
    r.id, new Date(r.created_at).toISOString(), r.name, r.phone, r.email, r.destination,
    r.service, r.audience, r.offer_slug, r.status, r.locale, r.page_path, r.message,
  ].map(esc).join(','));
  // BOM so Excel opens the UTF-8 file correctly
  const csv = '\ufeff' + [header.join(','), ...lines].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
