import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSql } from '../../lib/db';
import { notifyLead } from '../../lib/notify';
import { SITE } from '../../consts';
import { createHash } from 'node:crypto';

export const prerender = false;

const schema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(5).max(40),
  email: z.string().email().max(160).optional().or(z.literal('')),
  destination: z.string().max(40).optional().or(z.literal('')),
  service: z.string().max(40).optional().or(z.literal('')),
  audience: z.enum(['student', 'worker', 'pr']).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  locale: z.enum(['fr', 'ar']).default('fr'),
  page_path: z.string().max(300).optional(),
  source: z.string().max(300).optional(),
  company: z.string().optional(), // honeypot: bots fill this; humans never see it
});

const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// naive in-memory rate limit (per process). Good enough for a small marketing site.
const hits = new Map<string, { n: number; t: number }>();
function limited(ipHash: string): boolean {
  const now = Date.now();
  const rec = hits.get(ipHash);
  if (!rec || now - rec.t > 3600_000) { hits.set(ipHash, { n: 1, t: now }); return false; }
  rec.n += 1;
  return rec.n > 6;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let data: unknown;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  const parsed = schema.safeParse(data);
  if (!parsed.success) return json({ ok: false, error: 'invalid' }, 400);
  const d = parsed.data;
  if (d.company) return json({ ok: true }); // silently swallow bots

  const salt = process.env.APP_SALT ?? 'dev-salt';
  const ipHash = createHash('sha256').update((clientAddress ?? '0') + salt).digest('hex').slice(0, 32);
  if (limited(ipHash)) return json({ ok: false, error: 'rate' }, 429);

  const lead = {
    name: d.name.trim(),
    phone: d.phone.trim(),
    email: clean(d.email),
    destination: clean(d.destination),
    service: clean(d.service),
    audience: clean(d.audience),
    message: clean(d.message),
    locale: d.locale,
    page_path: clean(d.page_path),
    source: clean(d.source),
  };

  const sql = getSql();
  try {
    if (sql) {
      await sql`
        INSERT INTO leads (name, phone, email, destination, service, audience, message, locale, source, page_path, ip_hash, user_agent)
        VALUES (${lead.name}, ${lead.phone}, ${lead.email ?? null}, ${lead.destination ?? null},
                ${lead.service ?? null}, ${lead.audience ?? null}, ${lead.message ?? null},
                ${lead.locale}, ${lead.source ?? null}, ${lead.page_path ?? null}, ${ipHash},
                ${request.headers.get('user-agent') ?? null})`;
      await sql`
        INSERT INTO events (kind, destination, service, locale, page_path, source)
        VALUES ('form_submit', ${lead.destination ?? null}, ${lead.service ?? null}, ${lead.locale}, ${lead.page_path ?? null}, ${lead.source ?? null})`;
    } else {
      // Dev / no-DB mode: log so the site is fully usable without Postgres.
      console.log('[lead:dev]', JSON.stringify(lead));
    }
  } catch (e) {
    console.error('[lead:db-error]', e);
    // fall through — still try to notify so no lead is lost
  }

  await notifyLead(lead, SITE.name);
  return json({ ok: true });
};
