// Small helpers shared by the /api/admin/* form endpoints.
export const SLUG_RE = /^[a-z0-9-]{1,60}$/;

export const str = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
/** Optional text field: '' becomes null. */
export const opt = (form: FormData, key: string): string | null => str(form, key) || null;
/** Checkbox: present means true. */
export const bool = (form: FormData, key: string): boolean => form.get(key) != null;
/** Optional integer field: '' becomes null. */
export const intOpt = (form: FormData, key: string): number | null => {
  const v = str(form, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
export const int = (form: FormData, key: string, fallback: number): number => intOpt(form, key) ?? fallback;
/** Textarea → TEXT[]: one bullet per line, blank lines dropped. */
export const lines = (form: FormData, key: string): string[] =>
  str(form, key).split('\n').map((l) => l.trim()).filter(Boolean);
/** datetime-local input → Date | null. */
export const dateOpt = (form: FormData, key: string): Date | null => {
  const v = str(form, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 303 redirect back to a list page with a flash. */
export const backOk = (redirect: (p: string, s?: number) => Response, path: string) => redirect(`${path}?ok=1`, 303);
export const backErr = (redirect: (p: string, s?: number) => Response, path: string, msg: string) =>
  redirect(`${path}?err=${encodeURIComponent(msg)}`, 303);
