import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

const MAX_BYTES = 4 * 1024 * 1024;
const uploadDir = () => process.env.UPLOAD_DIR || './public/uploads';

// magic-byte sniffing — the extension alone is never trusted
function sniff(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'multipart attendu' }, 400); }
  const file = form.get('file');
  if (!(file instanceof File)) return json({ ok: false, error: 'champ "file" manquant' }, 400);
  if (file.size > MAX_BYTES) return json({ ok: false, error: 'fichier trop lourd (max 4 Mo)' }, 413);

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return json({ ok: false, error: 'format non supporté (png, jpg ou webp)' }, 415);

  const name = `${randomBytes(10).toString('hex')}.${kind.ext}`;
  try {
    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), buf);
  } catch (e) {
    console.error('[admin:upload]', e);
    return json({ ok: false, error: 'écriture impossible' }, 500);
  }
  return json({ ok: true, path: `/uploads/${name}` });
};
