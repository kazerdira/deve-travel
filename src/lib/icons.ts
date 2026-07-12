// Minimal inline SVG icon set (stroke-based, currentColor). Keeps zero deps.
const p = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const icons: Record<string, string> = {
  'file-check': p('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>'),
  'graduation': p('<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5"/>'),
  'passport':   p('<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8.5 17h7"/>'),
  'calendar':   p('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  'languages':  p('<path d="M4 5h7M9 3v2c0 4-2 7-5 9"/><path d="M6 9c1.5 3 4 5 6 6"/><path d="m13 20 4-9 4 9M15 17h4"/>'),
  'plane':      p('<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.7.7 0 0 0-.7 1.1l4.3 4.3-2.4 2.4-2-.5-1 1 3 1.7 1.7 3 1-1-.5-2 2.4-2.4 4.3 4.3a.7.7 0 0 0 1.1-.7Z"/>'),
  'home':       p('<path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'),
  'pen':        p('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  'whatsapp':   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.15-.64.15s-.74.94-.9 1.13-.34.22-.63.08a8.2 8.2 0 0 1-2.4-1.48 9 9 0 0 1-1.67-2.07c-.17-.3 0-.46.13-.6l.43-.5c.14-.17.19-.3.29-.5s.05-.36-.02-.5c-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55a1 1 0 0 0-.77.36 3.13 3.13 0 0 0-.98 2.34 5.44 5.44 0 0 0 1.14 2.89c.14.19 1.98 3.03 4.8 4.25.67.29 1.19.46 1.6.59.67.22 1.28.19 1.76.11.54-.08 1.66-.68 1.9-1.33.23-.66.23-1.22.16-1.33s-.26-.19-.55-.34ZM12 21.5a9.5 9.5 0 0 1-4.84-1.32l-.35-.2-3.6.94.96-3.5-.23-.36A9.5 9.5 0 1 1 12 21.5Z"/></svg>`,
  'arrow-right':p('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  'phone':      p('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.44c.9.33 1.84.57 2.8.7a2 2 0 0 1 1.7 2Z"/>'),
  'menu':       p('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  'close':      p('<path d="M18 6 6 18M6 6l12 12"/>'),
  'shield':     p('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>'),
  'clock':      p('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  'users':      p('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>'),
  'route':      p('<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a3 3 0 0 0 0-6h-6a3 3 0 0 1 0-6h0"/>'),
};
export const icon = (name: string) => icons[name] ?? icons['file-check'];
