import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export const prerender = false;

export const GET: APIRoute = async () => {
  const base = SITE.url.replace(/\/$/, '');
  const services = await getCollection('services');
  const dests = (await getCollection('destinations')).filter((d) => d.data.available);
  const staticPaths = ['/', '/services', '/destinations', '/processus', '/a-propos', '/contact'];
  const paths = [
    ...staticPaths,
    ...services.map((s) => `/services/${s.id}`),
    ...dests.map((d) => `/destinations/${d.id}`),
  ];
  const urls = paths.flatMap((p) => [p, p === '/' ? '/ar' : `/ar${p}`]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
