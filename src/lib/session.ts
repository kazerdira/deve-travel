// Signed admin session cookie: HMAC(expiry.nonce) with APP_SALT. No user table.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_DAYS = 7;

const salt = () => process.env.APP_SALT ?? 'dev-salt';
const sign = (payload: string) => createHmac('sha256', salt()).update(payload).digest('hex');

/** Create a signed session cookie value valid for 7 days. */
export function createSession(): string {
  const expiry = Date.now() + SESSION_DAYS * 24 * 3600_000;
  const nonce = randomBytes(8).toString('hex');
  const payload = `${expiry}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [expiry, nonce, mac] = parts;
  const expected = sign(`${expiry}.${nonce}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(expiry) > Date.now();
}
