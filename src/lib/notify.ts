// Telegram admin notification for new leads. Silently no-ops if env is unset.
import { send, leadKeyboard } from './telegram';

type Lead = {
  name: string; phone: string; email?: string;
  destination?: string; service?: string; audience?: string;
  message?: string; locale: string; page_path?: string; offer_slug?: string;
};

export async function notifyLead(lead: Lead, agencyName: string, leadId?: number): Promise<void> {
  const digits = lead.phone.replace(/[^\d]/g, '');
  const text = [
    `🆕 *Nouveau lead* — ${agencyName}`,
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
    lead.email ? `✉️ ${lead.email}` : '',
    `🌍 ${lead.destination ?? '—'} · ${lead.audience ?? '—'}`,
    `🧩 ${lead.service ?? '—'}`,
    lead.offer_slug ? `🏷 Offre : ${lead.offer_slug}` : '',
    lead.message ? `💬 ${lead.message}` : '',
    `🕒 ${new Date().toLocaleString('fr-FR')} · ${lead.locale} · ${lead.page_path ?? ''}`,
    digits ? `➡️ https://wa.me/${digits}` : '',
  ].filter(Boolean).join('\n');
  // inline status buttons only when the lead has a DB row to update
  await send(text, leadId ? { reply_markup: leadKeyboard(leadId) } : {});
}
