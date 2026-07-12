// Custom SVG "postcards" per destination — brand-consistent, lightweight,
// no stock imagery. Same warm-dusk sky + orange sun + charcoal landmark.
const sky = `
  <defs>
    <linearGradient id="pcSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE7C2"/><stop offset="55%" stop-color="#FAC98C"/><stop offset="100%" stop-color="#F3AE6A"/>
    </linearGradient>
    <radialGradient id="pcSun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD08A"/><stop offset="60%" stop-color="#F5913A"/><stop offset="100%" stop-color="#E45424"/>
    </radialGradient>
  </defs>
  <rect width="320" height="220" fill="url(#pcSky)"/>`;

const INK = '#241a2e';

const france = `
  <circle cx="232" cy="86" r="52" fill="url(#pcSun)"/>
  <rect x="0" y="176" width="320" height="44" fill="${INK}" opacity="0.9"/>
  <g fill="${INK}">
    <path d="M138 176 L152 92 Q155 82 158 92 L172 176 Z"/>
    <path d="M150 120 L160 120 L164 138 L146 138 Z" fill="#FAC98C"/>
    <path d="M143 150 L167 150 L170 164 L140 164 Z" fill="#FAC98C"/>
    <path d="M155 92 L152 70 L158 70 L155 92 Z"/>
  </g>
  <g fill="${INK}" opacity="0.75">
    <rect x="40" y="150" width="26" height="26"/><rect x="70" y="140" width="20" height="36"/>
    <rect x="250" y="146" width="30" height="30"/><rect x="286" y="156" width="18" height="20"/>
  </g>`;

const canada = `
  <circle cx="60" cy="70" r="42" fill="url(#pcSun)"/>
  <path d="M0 176 L70 96 L120 150 L180 80 L250 160 L320 110 L320 220 L0 220 Z" fill="${INK}" opacity="0.9"/>
  <path d="M120 150 L180 80 L250 160 Z" fill="#3a2740" opacity="0.9"/>
  <g fill="#E45424">
    <path d="M230 120 l6 -14 l6 14 l14 -4 l-8 12 l14 6 l-14 4 l4 14 l-16 -8 l-16 8 l4 -14 l-14 -4 l14 -6 l-8 -12 l14 4 z"/>
  </g>
  <g fill="${INK}"><path d="M44 176 l10 -26 l10 26 z"/><path d="M60 176 l8 -20 l8 20 z"/></g>`;

const spain = `
  <circle cx="240" cy="80" r="50" fill="url(#pcSun)"/>
  <rect x="0" y="182" width="320" height="38" fill="#C67A3D"/>
  <g fill="${INK}" opacity="0.9">
    <path d="M70 182 L70 120 Q70 100 84 100 Q98 100 98 120 L98 182 Z"/>
    <path d="M110 182 L110 108 Q110 86 126 86 Q142 86 142 108 L142 182 Z"/>
    <path d="M154 182 L154 120 Q154 100 168 100 Q182 100 182 120 L182 182 Z"/>
    <circle cx="84" cy="98" r="6"/><circle cx="126" cy="84" r="7"/><circle cx="168" cy="98" r="6"/>
  </g>`;

const portugal = `
  <circle cx="70" cy="78" r="46" fill="url(#pcSun)"/>
  <path d="M0 150 L120 150 L150 130 L320 130 L320 182 L0 182 Z" fill="${INK}" opacity="0.9"/>
  <g fill="${INK}">
    <rect x="210" y="86" width="20" height="56"/><path d="M206 86 L234 86 L226 72 L214 72 Z"/>
    <rect x="214" y="60" width="12" height="14"/>
  </g>
  <path d="M0 182 Q80 168 160 182 T320 182 L320 220 L0 220 Z" fill="#2E86A8" opacity="0.55"/>
  <path d="M0 196 Q80 184 160 196 T320 196 L320 220 L0 220 Z" fill="#1F6A88" opacity="0.6"/>`;

const generic = `
  <circle cx="230" cy="84" r="50" fill="url(#pcSun)"/>
  <path d="M0 150 L90 96 L160 150 L240 100 L320 156 L320 220 L0 220 Z" fill="${INK}" opacity="0.9"/>`;

const arts: Record<string, string> = { france, canada, spain, portugal };

export function postcard(id: string): string {
  const art = arts[id] ?? generic;
  return `<svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${sky}${art}</svg>`;
}
