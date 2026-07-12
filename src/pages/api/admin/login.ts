import type { APIRoute } from 'astro';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createSession, SESSION_COOKIE, SESSION_DAYS } from '../../../lib/session';
import { createLimiter } from '../../../lib/ratelimit';

export const prerender = false;

// 10 attempts per 15 minutes per ip_hash
const limited = createLimiter(10, 15 * 60_000);
const sha = (s: string) => createHash('sha256').update(s).digest();

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
  const salt = process.env.APP_SALT ?? 'dev-salt';
  const ipHash = createHash('sha256').update((clientAddress ?? '0') + salt).digest('hex').slice(0, 32);
  const err = (msg: string) => redirect(`/admin/login?err=${encodeURIComponent(msg)}`, 303);

  if (limited(ipHash)) return err('Trop de tentatives. Réessayez dans 15 minutes.');

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return err('ADMIN_PASSWORD non configuré sur le serveur.');

  let form: FormData;
  try { form = await request.formData(); } catch { return err('Requête invalide.'); }
  const password = String(form.get('password') ?? '');
  // compare hashes so lengths always match; never log the password
  if (!password || !timingSafeEqual(sha(password), sha(expected))) return err('Mot de passe incorrect.');

  cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  });
  return redirect('/admin', 303);
};
