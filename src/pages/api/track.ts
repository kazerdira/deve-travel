import type { APIRoute } from 'astro';
import { getSql } from '../../lib/db';

export const prerender = false;

const KINDS = new Set(['wa_click', 'form_view', 'call_click']);
const s = (v: unknown, max = 60) => (typeof v === 'string' && v ? v.slice(0, max) : null);

export const POST: APIRoute = async ({ request }) => {
  let data: any;
  try { data = await request.json(); } catch { return new Response(null, { status: 204 }); }
  const kind = typeof data?.kind === 'string' ? data.kind : '';
  if (!KINDS.has(kind)) return new Response(null, { status: 204 });

  const sql = getSql();
  const row = {
    kind,
    destination: s(data.destination),
    service: s(data.service),
    locale: s(data.locale, 4),
    page_path: s(data.page_path, 300),
    source: s(data.source, 300),
  };
  try {
    if (sql) {
      await sql`
        INSERT INTO events (kind, destination, service, locale, page_path, source)
        VALUES (${row.kind}, ${row.destination}, ${row.service}, ${row.locale}, ${row.page_path}, ${row.source})`;
    } else {
      console.log('[event:dev]', JSON.stringify(row));
    }
  } catch (e) {
    console.error('[track:db-error]', e);
  }
  return new Response(null, { status: 204 });
};
