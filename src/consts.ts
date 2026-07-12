// Central config, read from PUBLIC_* env with dev-safe fallbacks.
const env = import.meta.env;

export const SITE = {
  name:      env.PUBLIC_AGENCY_NAME  ?? 'Deve Travel',
  city:      env.PUBLIC_AGENCY_CITY  ?? 'Alger',
  url:       env.PUBLIC_SITE_URL     ?? 'http://localhost:4321',
  whatsapp:  (env.PUBLIC_WHATSAPP_NUMBER ?? '213770000000').replace(/[^\d]/g, ''),
  phoneDisplay: env.PUBLIC_PHONE_DISPLAY ?? '+213 770 00 00 00',
  fb:        env.PUBLIC_FB_URL       ?? 'https://facebook.com/',
  ig:        env.PUBLIC_IG_URL       ?? 'https://instagram.com/',
  hours:     env.PUBLIC_HOURS        ?? 'Dim–Jeu · 9h00–17h00',
};

// Trust numbers — swap for the agency's real figures before launch.
// `n` is the numeric target for the count-up; `suffix`/`prefix` frame it.
export const TRUST = [
  { n: 500, prefix: '+', suffix: '',  fr: 'dossiers accompagnés', ar: 'ملف مرافَق' },
  { n: 8,   prefix: '',  suffix: '',  fr: 'ans d’expérience',      ar: 'سنوات خبرة' },
  { n: 2,   prefix: '',  suffix: '',  fr: 'destinations actives',  ar: 'وجهات نشطة' },
  { n: 24,  prefix: '',  suffix: 'h', fr: 'délai de réponse',      ar: 'مدة الرد' },
];
