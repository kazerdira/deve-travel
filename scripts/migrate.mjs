import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set — nothing to migrate.'); process.exit(1); }
const sql = postgres(url);
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  console.log('applying', f);
  await sql.unsafe(readFileSync(join(dir, f), 'utf8'));
}
console.log('done');
await sql.end();
