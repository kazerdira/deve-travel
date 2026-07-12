export type Locale = 'fr' | 'ar';
export const locales: Locale[] = ['fr', 'ar'];
export const defaultLocale: Locale = 'fr';
export const dir = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr');
export const langName: Record<Locale, string> = { fr: 'FR', ar: 'ع' };

// A bilingual value stored in content frontmatter.
export type Bi = { fr: string; ar?: string };
/** Pick a localized string, falling back to FR when the AR field is missing. */
export const pick = (v: Bi | undefined, l: Locale): string =>
  !v ? '' : l === 'ar' ? (v.ar && v.ar.trim() ? v.ar : v.fr) : v.fr;

const S = {
  'brand.tag':          { fr: 'Accompagnement immigration & études', ar: 'مرافقة الهجرة والدراسة' },
  'nav.services':       { fr: 'Services', ar: 'الخدمات' },
  'nav.destinations':   { fr: 'Destinations', ar: 'الوجهات' },
  'nav.offers':         { fr: 'Offres', ar: 'العروض' },
  'nav.process':        { fr: 'Comment ça marche', ar: 'كيف نعمل' },
  'nav.about':          { fr: 'À propos', ar: 'من نحن' },
  'nav.contact':        { fr: 'Contact', ar: 'اتصل بنا' },
  'cta.whatsapp':       { fr: 'Contacter sur WhatsApp', ar: 'تواصل عبر واتساب' },
  'cta.quote':          { fr: 'Demander un devis', ar: 'اطلب عرض سعر' },
  'cta.info':           { fr: 'Plus d’informations', ar: 'مزيد من المعلومات' },
  'cta.discover':       { fr: 'Découvrir', ar: 'اكتشف' },
  'cta.call':           { fr: 'Appeler', ar: 'اتصل' },
  'label.soon':         { fr: 'Bientôt', ar: 'قريباً' },
  'label.free':         { fr: 'Réponse sous 24h · Accompagnement personnalisé', ar: 'رد خلال 24 ساعة · مرافقة شخصية' },
  'home.hero.title':    { fr: 'Votre projet France ou Canada, accompagné de bout en bout.', ar: 'مشروعك نحو فرنسا أو كندا، بمرافقة كاملة من البداية إلى النهاية.' },
  'home.hero.lede':     { fr: 'Inscription aux tests, dossiers de visa, rendez-vous, traductions et billets : une agence, un interlocuteur, un dossier suivi jusqu’au départ.', ar: 'التسجيل في الاختبارات، ملفات التأشيرة، المواعيد، الترجمة والتذاكر: وكالة واحدة، مرافق واحد، ملف متابع حتى السفر.' },
  'home.dest.title':    { fr: 'Où souhaitez-vous partir ?', ar: 'إلى أين تريد السفر؟' },
  'home.dest.lede':     { fr: 'Étudiants, travailleurs ou installation : nous couvrons chaque parcours.', ar: 'طلبة، عمال أو إقامة: نرافق كل مسار.' },
  'home.services.title':{ fr: 'Nos services', ar: 'خدماتنا' },
  'home.services.lede': { fr: 'Chaque étape de votre démarche, prise en charge.', ar: 'كل خطوة في مشروعك، بين أيدٍ أمينة.' },
  'home.process.title': { fr: 'Un parcours clair, sans mauvaises surprises', ar: 'مسار واضح، دون مفاجآت' },
  'home.trust.title':   { fr: 'Pourquoi nous faire confiance', ar: 'لماذا تثق بنا' },
  'services.title':     { fr: 'Nos services', ar: 'خدماتنا' },
  'services.lede':      { fr: 'De l’inscription au test jusqu’au billet d’avion, nous gérons chaque étape.', ar: 'من التسجيل في الاختبار إلى تذكرة الطائرة، نتكفل بكل خطوة.' },
  'service.included':   { fr: 'Ce qui est inclus', ar: 'ما يشمله' },
  'service.dest':       { fr: 'Destinations concernées', ar: 'الوجهات المعنية' },
  'service.related':    { fr: 'Services liés', ar: 'خدمات ذات صلة' },
  'offers.badge':       { fr: '🔥 Offre limitée', ar: '🔥 عرض محدود' },
  'offers.title':       { fr: 'Offres exclusives', ar: 'عروض حصرية' },
  'offers.lede':        { fr: 'Des offres limitées dans le temps, négociées pour vous. Premier arrivé, premier servi.', ar: 'عروض محدودة في الوقت، تفاوضنا عليها من أجلك. الأولوية لمن يسبق.' },
  'offers.none':        { fr: 'Aucune offre en cours pour le moment. Revenez bientôt, ou écrivez-nous sur WhatsApp.', ar: 'لا توجد عروض حالياً. عد قريباً أو راسلنا على واتساب.' },
  'offers.until':       { fr: 'Valable jusqu’au', ar: 'صالح حتى' },
  'offers.slots':       { fr: 'places restantes', ar: 'أماكن متبقية' },
  'offers.slot':        { fr: 'place restante', ar: 'مكان متبقٍ' },
  'offers.interested':  { fr: 'Je suis intéressé(e)', ar: 'أنا مهتم' },
  'offers.see':         { fr: 'Voir l’offre', ar: 'شاهد العرض' },
  'offers.all':         { fr: 'Toutes les offres', ar: 'كل العروض' },
  'dest.title':         { fr: 'Destinations', ar: 'الوجهات' },
  'dest.lede':          { fr: 'Choisissez votre destination et votre profil.', ar: 'اختر وجهتك وملفك.' },
  'dest.services':      { fr: 'Services pour cette destination', ar: 'خدمات لهذه الوجهة' },
  'dest.soonbody':      { fr: 'Cette destination arrive bientôt. Laissez-nous vos coordonnées pour être prévenu en priorité.', ar: 'هذه الوجهة قريباً. اترك بياناتك لإعلامك أولاً.' },
  'process.title':      { fr: 'Comment ça marche', ar: 'كيف نعمل' },
  'process.lede':       { fr: 'Cinq étapes, un interlocuteur, votre dossier suivi jusqu’au bout.', ar: 'خمس خطوات، مرافق واحد، ملفك متابع حتى النهاية.' },
  'about.title':        { fr: 'À propos de nous', ar: 'من نحن' },
  'contact.title':      { fr: 'Contactez-nous', ar: 'اتصل بنا' },
  'contact.lede':       { fr: 'Le plus simple : écrivez-nous sur WhatsApp. Ou laissez vos coordonnées, on vous rappelle.', ar: 'الأسهل: راسلنا على واتساب. أو اترك بياناتك ونعاود الاتصال بك.' },
  'contact.hours':      { fr: 'Horaires', ar: 'أوقات العمل' },
  'contact.follow':     { fr: 'Suivez-nous', ar: 'تابعنا' },
  'form.title':         { fr: 'Demander un devis gratuit', ar: 'اطلب عرض سعر مجاني' },
  'form.name':          { fr: 'Nom complet', ar: 'الاسم الكامل' },
  'form.phone':         { fr: 'Téléphone / WhatsApp', ar: 'الهاتف / واتساب' },
  'form.email':         { fr: 'E-mail (facultatif)', ar: 'البريد الإلكتروني (اختياري)' },
  'form.dest':          { fr: 'Destination', ar: 'الوجهة' },
  'form.service':       { fr: 'Service souhaité', ar: 'الخدمة المطلوبة' },
  'form.audience':      { fr: 'Vous êtes', ar: 'أنت' },
  'form.message':       { fr: 'Votre message', ar: 'رسالتك' },
  'form.choose':        { fr: 'Choisir…', ar: 'اختر…' },
  'form.submit':        { fr: 'Envoyer ma demande', ar: 'إرسال الطلب' },
  'form.sending':       { fr: 'Envoi…', ar: 'جارٍ الإرسال…' },
  'form.ok':            { fr: 'Merci ! Votre demande est bien reçue, nous vous recontactons rapidement.', ar: 'شكراً! تم استلام طلبك، سنتواصل معك قريباً.' },
  'form.err':           { fr: 'Un problème est survenu. Réessayez ou écrivez-nous sur WhatsApp.', ar: 'حدث خطأ. أعد المحاولة أو راسلنا على واتساب.' },
  'aud.student':        { fr: 'Étudiant', ar: 'طالب' },
  'aud.worker':         { fr: 'Travailleur', ar: 'عامل' },
  'aud.pr':             { fr: 'Résidence / Immigration', ar: 'إقامة / هجرة' },
  'aud.tourist':        { fr: 'Touriste', ar: 'سائح' },
  'footer.services':    { fr: 'Services', ar: 'الخدمات' },
  'footer.dest':        { fr: 'Destinations', ar: 'الوجهات' },
  'footer.rights':      { fr: 'Tous droits réservés.', ar: 'جميع الحقوق محفوظة.' },
  'footer.legal':       { fr: 'Mentions légales', ar: 'الإشعارات القانونية' },
  'footer.privacy':     { fr: 'Confidentialité', ar: 'الخصوصية' },
  'footer.disclaimer':  { fr: 'Agence d’accompagnement administratif. Nous ne délivrons pas de visas et ne garantissons aucune décision consulaire.', ar: 'وكالة مرافقة إدارية. لا نصدر التأشيرات ولا نضمن أي قرار قنصلي.' },
} as const;

export type UiKey = keyof typeof S;
export const t = (l: Locale, k: UiKey): string => {
  const v = S[k] as { fr: string; ar?: string };
  return l === 'ar' ? (v.ar ?? v.fr) : v.fr;
};

/** Prefix a path with the locale (FR at root, AR under /ar). */
export const localize = (l: Locale, path: string): string => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return l === 'ar' ? (p === '/' ? '/ar' : `/ar${p}`) : p;
};
/** Same path in the other locale, for the language switch + hreflang. */
export const swapLocale = (current: Locale, path: string): string => {
  const stripped = path.replace(/^\/ar(?=\/|$)/, '') || '/';
  return current === 'ar' ? stripped : (stripped === '/' ? '/ar' : `/ar${stripped}`);
};
