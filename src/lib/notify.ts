// Optional Telegram admin notification. Silently no-ops if env is unset.
type Lead = {
  name: string; phone: string; email?: string;
  destination?: string; service?: string; audience?: string;
  message?: string; locale: string; page_path?: string;
};

export async function notifyLead(lead: Lead, agencyName: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chat) return;
  const digits = lead.phone.replace(/[^\d]/g, '');
  const text = [
    `🆕 *Nouveau lead* — ${agencyName}`,
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
    lead.email ? `✉️ ${lead.email}` : '',
    `🌍 ${lead.destination ?? '—'} · ${lead.audience ?? '—'}`,
    `🧩 ${lead.service ?? '—'}`,
    lead.message ? `💬 ${lead.message}` : '',
    `🕒 ${new Date().toLocaleString('fr-FR')} · ${lead.locale} · ${lead.page_path ?? ''}`,
    digits ? `➡️ https://wa.me/${digits}` : '',
  ].filter(Boolean).join('\n');
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'Markdown', disable_web_page_preview: true }),
    });
  } catch { /* never let notification failure break the request */ }
}
