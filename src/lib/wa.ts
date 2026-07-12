import { SITE } from '../consts';
/** Build a click-to-chat WhatsApp URL with a prefilled message. */
export function waUrl(text?: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
