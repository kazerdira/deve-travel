// Serves uploaded images from UPLOAD_DIR. Needed on Railway where the upload
// volume (/data/uploads) lives outside the static ./public directory.
import type { APIRoute } from 'astro';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { basename, join } from 'node:path';

export const prerender = false;

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

export const GET: APIRoute = async ({ params }) => {
  const raw = params.file ?? '';
  // uploads are always flat random names — basename() kills any traversal attempt
  const name = basename(raw);
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!name || name !== raw || !MIME[ext]) return new Response(null, { status: 404 });

  const path = join(process.env.UPLOAD_DIR || './public/uploads', name);
  if (!existsSync(path) || !statSync(path).isFile()) return new Response(null, { status: 404 });

  return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, {
    headers: {
      'Content-Type': MIME[ext],
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
