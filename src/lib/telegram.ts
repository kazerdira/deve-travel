// Telegram admin bot: raw fetch against the Bot API, one long-polling worker
// inside the same Node process. If TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID
// is unset the bot silently does not start — the site runs with zero setup.
// Every call is wrapped so Telegram being down can never crash the site.
import { getSql } from './db';
import { getLiveOffers } from './offers';

function creds(): { token: string; chat: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  return token && chat ? { token, chat } : null;
}

async function tg(method: string, payload: Record<string, unknown>): Promise<any | null> {
  const c = creds();
  if (!c) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${c.token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j: any = await r.json();
    if (!j.ok) { console.error('[telegram]', method, j.description); return null; }
    return j.result;
  } catch (e) {
    console.error('[telegram]', method, e);
    return null;
  }
}

export function send(text: string, extra: Record<string, unknown> = {}) {
  const c = creds();
  if (!c) return Promise.resolve(null);
  return tg('sendMessage', { chat_id: c.chat, text, parse_mode: 'Markdown', disable_web_page_preview: true, ...extra });
}

export function editMessage(messageId: number, text: string, extra: Record<string, unknown> = {}) {
  const c = creds();
  if (!c) return Promise.resolve(null);
  return tg('editMessageText', { chat_id: c.chat, message_id: messageId, text, parse_mode: 'Markdown', disable_web_page_preview: true, ...extra });
}

export function answerCallback(callbackQueryId: string, text?: string) {
  return tg('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

// ---------------------------------------------------------------- lead helpers

export const LEAD_STATUSES = ['new', 'contacted', 'won', 'lost'] as const;
const STATUS_LABEL: Record<string, string> = { new: '🆕 nouveau', contacted: '📞 contacté', won: '✅ gagné', lost: '❌ perdu' };

export function leadKeyboard(leadId: number) {
  return {
    inline_keyboard: [[
      { text: 'Contacté', callback_data: `lead:${leadId}:contacted` },
      { text: 'Gagné',    callback_data: `lead:${leadId}:won` },
      { text: 'Perdu',    callback_data: `lead:${leadId}:lost` },
    ]],
  };
}

const waLink = (phone: string) => {
  const digits = (phone ?? '').replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

// ---------------------------------------------------------------- polling worker

async function handleCallback(cb: any) {
  const c = creds()!;
  if (String(cb.message?.chat?.id) !== c.chat) return; // admin chat only
  const m = /^lead:(\d+):(contacted|won|lost)$/.exec(cb.data ?? '');
  if (!m) { await answerCallback(cb.id); return; }
  const [, id, status] = m;
  const sql = getSql();
  if (!sql) { await answerCallback(cb.id, 'DB indisponible'); return; }
  try {
    await sql`UPDATE leads SET status = ${status} WHERE id = ${Number(id)}`;
    // rewrite the status line at the bottom of the original notification
    const old: string = cb.message?.text ?? '';
    const body = old.split('\n').filter((l: string) => !l.startsWith('📌')).join('\n');
    await editMessage(cb.message.message_id, `${body}\n📌 Statut : ${STATUS_LABEL[status]}`, { reply_markup: leadKeyboard(Number(id)) });
    await answerCallback(cb.id, `Statut → ${status}`);
  } catch (e) {
    console.error('[telegram:callback]', e);
    await answerCallback(cb.id, 'Erreur');
  }
}

async function statsText(): Promise<string> {
  const sql = getSql();
  if (!sql) return 'DB indisponible.';
  const [leads] = await sql`SELECT count(*)::int AS n FROM leads WHERE created_at > now() - interval '7 days'`;
  const [clicks] = await sql`SELECT count(*)::int AS n FROM events WHERE kind = 'wa_click' AND created_at > now() - interval '7 days'`;
  const [dest] = await sql`
    SELECT destination, count(*)::int AS n FROM leads
    WHERE created_at > now() - interval '7 days' AND destination IS NOT NULL
    GROUP BY destination ORDER BY n DESC LIMIT 1`;
  const [offer] = await sql`
    SELECT offer_slug, count(*)::int AS n FROM leads
    WHERE created_at > now() - interval '7 days' AND offer_slug IS NOT NULL
    GROUP BY offer_slug ORDER BY n DESC LIMIT 1`;
  return [
    '📊 *Stats — 7 derniers jours*',
    `Leads : ${leads.n}`,
    `Clics WhatsApp : ${clicks.n}`,
    `Top destination : ${dest ? `${dest.destination} (${dest.n})` : '—'}`,
    `Top offre : ${offer ? `${offer.offer_slug} (${offer.n})` : '—'}`,
  ].join('\n');
}

async function handleCommand(text: string) {
  const sql = getSql();
  const [cmd, ...args] = text.trim().split(/\s+/);
  const bare = cmd.split('@')[0]; // strip @botname suffix

  if (bare === '/leads') {
    if (!sql) { await send('DB indisponible.'); return; }
    const rows = await sql`SELECT id, created_at, name, phone, destination, service, offer_slug, status FROM leads ORDER BY created_at DESC LIMIT 5`;
    if (rows.length === 0) { await send('Aucun lead.'); return; }
    const lines = rows.map((l: any) => {
      const wa = waLink(l.phone);
      return [
        `#${l.id} · ${new Date(l.created_at).toLocaleDateString('fr-FR')} · ${STATUS_LABEL[l.status] ?? l.status}`,
        `👤 ${l.name} · 🌍 ${l.destination ?? '—'} · 🧩 ${l.service ?? '—'}${l.offer_slug ? ` · 🏷 ${l.offer_slug}` : ''}`,
        wa ? `➡️ ${wa}` : `📞 ${l.phone}`,
      ].join('\n');
    });
    await send(`🗂 *5 derniers leads*\n\n${lines.join('\n\n')}`);
  } else if (bare === '/stats') {
    await send(await statsText());
  } else if (bare === '/offers') {
    const offers = await getLiveOffers();
    if (offers.length === 0) { await send('Aucune offre en cours.'); return; }
    const lines = offers.map((o) => {
      const end = o.endsAt ? ` · jusqu’au ${new Date(o.endsAt).toLocaleDateString('fr-FR')}` : '';
      const slots = o.slotsTotal != null ? ` · ${Math.max(0, o.slotsTotal - o.slotsTaken)} places` : '';
      return `🏷 ${o.slug} — ${o.title.fr}${end}${slots}`;
    });
    await send(`🔥 *Offres en cours*\n\n${lines.join('\n')}`);
  } else if (bare === '/offer_off') {
    const slug = args[0];
    if (!slug) { await send('Usage : /offer\\_off <slug>'); return; }
    if (!sql) { await send('DB indisponible.'); return; }
    const rows = await sql`UPDATE offers SET active = false, updated_at = now() WHERE slug = ${slug} RETURNING slug`;
    await send(rows.length ? `🛑 Offre *${slug}* désactivée.` : `Offre introuvable : ${slug}`);
  }
}

async function handleUpdate(u: any) {
  const c = creds()!;
  if (u.callback_query) { await handleCallback(u.callback_query); return; }
  const msg = u.message;
  if (!msg || String(msg.chat?.id) !== c.chat) return; // ignore everything but the admin chat, silently
  if (typeof msg.text === 'string' && msg.text.startsWith('/')) {
    try { await handleCommand(msg.text); } catch (e) { console.error('[telegram:command]', e); }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pollLoop() {
  let offset = 0;
  for (;;) {
    const updates = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
    if (updates === null) { await sleep(5000); continue; }
    for (const u of updates) {
      offset = u.update_id + 1;
      try { await handleUpdate(u); } catch (e) { console.error('[telegram:update]', e); }
    }
  }
}

// ---------------------------------------------------------------- daily digest

async function digestText(): Promise<string> {
  const sql = getSql();
  if (!sql) return '';
  const [leads] = await sql`SELECT count(*)::int AS n FROM leads WHERE created_at > now() - interval '24 hours'`;
  const [clicks] = await sql`SELECT count(*)::int AS n FROM events WHERE kind = 'wa_click' AND created_at > now() - interval '24 hours'`;
  const [offer] = await sql`
    SELECT offer_slug, count(*)::int AS n FROM leads
    WHERE created_at > now() - interval '7 days' AND offer_slug IS NOT NULL
    GROUP BY offer_slug ORDER BY n DESC LIMIT 1`;
  return `🌅 *Résumé du jour* : ${leads.n} nouveaux leads, ${clicks.n} clics WhatsApp, offre la plus performante : ${offer ? offer.offer_slug : '—'}.`;
}

function startDigest() {
  const hourRaw = process.env.TELEGRAM_DIGEST_HOUR;
  if (hourRaw === undefined || hourRaw === '') return;
  const hour = Number(hourRaw);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return;
  let lastSentDay = '';
  setInterval(async () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (now.getHours() !== hour || lastSentDay === day) return;
    lastSentDay = day;
    try {
      const text = await digestText();
      if (text) await send(text);
    } catch (e) { console.error('[telegram:digest]', e); }
  }, 60_000).unref?.();
}

// ---------------------------------------------------------------- startup

/** Start the bot once per process. No-op when Telegram env is unset. */
export function startTelegramBot() {
  if (!creds()) return;
  const g = globalThis as any;
  if (g.__tgBotStarted) return;
  g.__tgBotStarted = true;
  console.log('[telegram] bot worker started');
  pollLoop().catch((e) => console.error('[telegram:poll]', e));
  startDigest();
}
