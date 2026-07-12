import { defineMiddleware } from 'astro:middleware';
import { verifySession, SESSION_COOKIE } from './lib/session';
import { startTelegramBot } from './lib/telegram';

// Astro only exposes .env values via import.meta.env; the runtime code reads
// process.env (DATABASE_URL, ADMIN_PASSWORD, ...), so load .env here too.
// Production hosts (Railway) set real env vars and have no .env file.
try { process.loadEnvFile(); } catch { /* no .env — rely on the environment */ }

// Start the Telegram worker once per process (no-op if TELEGRAM_* is unset).
startTelegramBot();

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  if (!isAdminPage && !isAdminApi) return next();
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return next();

  if (verifySession(context.cookies.get(SESSION_COOKIE)?.value)) return next();
  if (isAdminApi) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return context.redirect('/admin/login', 302);
});
