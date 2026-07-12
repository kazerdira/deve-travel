import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSql } from '../../../lib/db';
import { SLUG_RE, str, opt, bool, int, lines, backOk, backErr } from '../../../lib/admin-forms';

export const prerender = false;
const LIST = '/admin/destinations';
const TRACK_KEYS = ['student', 'worker', 'pr', 'tourist'] as const;

const schema = z.object({
  sort_order: z.number().int(),
  available: z.boolean(),
  flag: z.string().max(16),
  title_fr: z.string().min(1).max(120),
  title_ar: z.string().max(120).nullable(),
  intro_fr: z.string().min(1).max(1000),
  intro_ar: z.string().max(1000).nullable(),
  seo_title_fr: z.string().max(200).nullable(),
  seo_title_ar: z.string().max(200).nullable(),
  seo_desc_fr: z.string().max(300).nullable(),
  seo_desc_ar: z.string().max(300).nullable(),
  image_3d: z.string().max(300).nullable(),
  image_hero: z.string().max(300).nullable(),
  mesh_from: z.string().max(30),
  mesh_to: z.string().max(30),
});

async function saveTracksAndServices(sql: any, id: string, form: FormData) {
  // tracks: three fixed audience blocks; an empty FR title removes the track
  for (const [i, key] of TRACK_KEYS.entries()) {
    const titleFr = str(form, `track_${key}_title_fr`);
    if (!titleFr) {
      await sql`DELETE FROM destination_tracks WHERE destination_id = ${id} AND key = ${key}`;
      continue;
    }
    const titleAr = opt(form, `track_${key}_title_ar`);
    const pointsFr = lines(form, `track_${key}_points_fr`);
    const pointsAr = lines(form, `track_${key}_points_ar`);
    await sql`
      INSERT INTO destination_tracks (destination_id, key, sort_order, title_fr, title_ar, points_fr, points_ar)
      VALUES (${id}, ${key}, ${(i + 1) * 10}, ${titleFr}, ${titleAr}, ${pointsFr}, ${pointsAr})
      ON CONFLICT (destination_id, key) DO UPDATE SET
        sort_order = EXCLUDED.sort_order, title_fr = EXCLUDED.title_fr, title_ar = EXCLUDED.title_ar,
        points_fr = EXCLUDED.points_fr, points_ar = EXCLUDED.points_ar`;
  }
  // linked services: checkbox list, ordered by the services' own sort_order
  const picked = form.getAll('services').map(String).filter((s) => SLUG_RE.test(s));
  await sql`DELETE FROM destination_services WHERE destination_id = ${id}`;
  if (picked.length > 0) {
    await sql`
      INSERT INTO destination_services (destination_id, service_id, sort_order)
      SELECT ${id}, s.id, row_number() OVER (ORDER BY s.sort_order, s.id) * 10
      FROM services s WHERE s.id = ANY(${picked})`;
  }
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const sql = getSql();
  if (!sql) return backErr(redirect, LIST, 'DATABASE_URL non configuré');
  const form = await request.formData();
  const action = str(form, '_action');

  try {
    if (action === 'delete') {
      await sql`DELETE FROM destinations WHERE id = ${str(form, 'id')}`;
      return backOk(redirect, LIST);
    }
    if (action === 'toggle-available') {
      await sql`UPDATE destinations SET available = NOT available, updated_at = now() WHERE id = ${str(form, 'id')}`;
      return backOk(redirect, LIST);
    }

    const parsed = schema.safeParse({
      sort_order: int(form, 'sort_order', 100),
      available: bool(form, 'available'),
      flag: str(form, 'flag'),
      title_fr: str(form, 'title_fr'),
      title_ar: opt(form, 'title_ar'),
      intro_fr: str(form, 'intro_fr'),
      intro_ar: opt(form, 'intro_ar'),
      seo_title_fr: opt(form, 'seo_title_fr'),
      seo_title_ar: opt(form, 'seo_title_ar'),
      seo_desc_fr: opt(form, 'seo_desc_fr'),
      seo_desc_ar: opt(form, 'seo_desc_ar'),
      image_3d: opt(form, 'image_3d'),
      image_hero: opt(form, 'image_hero'),
      mesh_from: str(form, 'mesh_from') || '#E45424',
      mesh_to: str(form, 'mesh_to') || '#F7B450',
    });
    if (!parsed.success) return backErr(redirect, LIST, 'champs invalides (titre FR et intro FR requis)');
    const d = parsed.data;

    if (action === 'create') {
      const id = str(form, 'slug');
      if (!SLUG_RE.test(id)) return backErr(redirect, LIST, 'slug invalide (a-z, 0-9 et tirets uniquement)');
      await sql`
        INSERT INTO destinations (id, sort_order, available, flag, title_fr, title_ar, intro_fr, intro_ar,
                                  seo_title_fr, seo_title_ar, seo_desc_fr, seo_desc_ar,
                                  image_3d, image_hero, mesh_from, mesh_to)
        VALUES (${id}, ${d.sort_order}, ${d.available}, ${d.flag}, ${d.title_fr}, ${d.title_ar},
                ${d.intro_fr}, ${d.intro_ar}, ${d.seo_title_fr}, ${d.seo_title_ar}, ${d.seo_desc_fr}, ${d.seo_desc_ar},
                ${d.image_3d}, ${d.image_hero}, ${d.mesh_from}, ${d.mesh_to})`;
      await saveTracksAndServices(sql, id, form);
      return backOk(redirect, LIST);
    }
    if (action === 'update') {
      const id = str(form, 'id'); // slug is immutable after creation
      await sql`
        UPDATE destinations SET
          sort_order = ${d.sort_order}, available = ${d.available}, flag = ${d.flag},
          title_fr = ${d.title_fr}, title_ar = ${d.title_ar}, intro_fr = ${d.intro_fr}, intro_ar = ${d.intro_ar},
          seo_title_fr = ${d.seo_title_fr}, seo_title_ar = ${d.seo_title_ar},
          seo_desc_fr = ${d.seo_desc_fr}, seo_desc_ar = ${d.seo_desc_ar},
          image_3d = ${d.image_3d}, image_hero = ${d.image_hero},
          mesh_from = ${d.mesh_from}, mesh_to = ${d.mesh_to}, updated_at = now()
        WHERE id = ${id}`;
      await saveTracksAndServices(sql, id, form);
      return backOk(redirect, LIST);
    }
    return backErr(redirect, LIST, 'action inconnue');
  } catch (e: any) {
    console.error('[admin:destinations]', e);
    const msg = e?.code === '23505' ? 'ce slug existe déjà' : 'erreur base de données';
    return backErr(redirect, LIST, msg);
  }
};
