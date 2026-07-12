import postgres from 'postgres';

// Lazy, optional Postgres. If DATABASE_URL is unset, returns null and callers
// fall back to console logging — so the site runs locally with zero setup.
let _sql: postgres.Sql | null | undefined;
export function getSql(): postgres.Sql | null {
  if (_sql !== undefined) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) { _sql = null; return _sql; }
  _sql = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
  return _sql;
}
