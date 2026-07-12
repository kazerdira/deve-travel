import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSql } from '../../../lib/db';
import { SLUG_RE, slugify, str, opt, bool, intOpt, dateOpt, backOk, backErr } from '../../../lib/admin-forms';

export const prerender = false;
const LIST = '/admin/offers';

const schema = z.object({
  destination_id: z.string().max(60).nullable(),
  country_label: z.string().max(80),
  flag: z.string().max(16),
  active: z.boolean(),
  featured: z.boolean(),
  starts_at: z.date().nullable(),
  ends_at: z.date().nullable(),
  slots_total: z.number().int().min(1).nullable(),
  slots_taken: z.number().int().min(0),
  title_fr: z.string().min(1).max(200),
  title_ar: z.string().max(200).nullable(),
  summary_fr: z.string().min(1).max(500),
  summary_ar: z.string().max(500).nullable(),
  body_fr: z.string().max(8000).nullable(),
  body_ar: z.string().max(8000).nullable(),
  image: z.string().max(300).nullable(),
  whatsapp_fr: z.string().max(500),
  whatsapp_ar: z.string().max(500).nullable(),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const sql = getSql();
  if (!sql) return backErr(redirect, LIST, 'DATABASE_URL non configuré');
  const form = await request.formData();
  const action = str(form, '_action');

  try {
    if (action === 'delete') {
      await sql`DELETE FROM offers WHERE id = ${Number(str(form, 'id'))}`;
      return backOk(redirect, LIST);
    }
    if (action === 'toggle-active' || action === 'toggle-featured') {
      const col = action === 'toggle-active' ? sql`active = NOT active` : sql`featured = NOT featured`;
      await sql`UPDATE offers SET ${col}, updated_at = now() WHERE id = ${Number(str(form, 'id'))}`;
      return backOk(redirect, LIST);
    }

    const parsed = schema.safeParse({
      destination_id: opt(form, 'destination_id'),
      country_label: str(form, 'country_label'),
      flag: str(form, 'flag'),
      active: bool(form, 'active'),
      featured: bool(form, 'featured'),
      starts_at: dateOpt(form, 'starts_at'),
      ends_at: dateOpt(form, 'ends_at'),
      slots_total: intOpt(form, 'slots_total'),
      slots_taken: intOpt(form, 'slots_taken') ?? 0,
      title_fr: str(form, 'title_fr'),
      title_ar: opt(form, 'title_ar'),
      summary_fr: str(form, 'summary_fr'),
      summary_ar: opt(form, 'summary_ar'),
      body_fr: opt(form, 'body_fr'),
      body_ar: opt(form, 'body_ar'),
      image: opt(form, 'image'),
      whatsapp_fr: str(form, 'whatsapp_fr'),
      whatsapp_ar: opt(form, 'whatsapp_ar'),
    });
    if (!parsed.success) return backErr(redirect, LIST, 'champs invalides (titre FR et résumé FR requis)');
    const d = parsed.data;

    if (action === 'create') {
      const slug = slugify(str(form, 'slug'));
      if (!SLUG_RE.test(slug)) return backErr(redirect, LIST, 'slug invalide (a-z, 0-9 et tirets uniquement)');
      await sql`
        INSERT INTO offers (slug, destination_id, country_label, flag, active, featured, starts_at, ends_at,
                            slots_total, slots_taken, title_fr, title_ar, summary_fr, summary_ar,
                            body_fr, body_ar, image, whatsapp_fr, whatsapp_ar)
        VALUES (${slug}, ${d.destination_id}, ${d.country_label}, ${d.flag}, ${d.active}, ${d.featured},
                ${d.starts_at}, ${d.ends_at}, ${d.slots_total}, ${d.slots_taken},
                ${d.title_fr}, ${d.title_ar}, ${d.summary_fr}, ${d.summary_ar},
                ${d.body_fr}, ${d.body_ar}, ${d.image}, ${d.whatsapp_fr}, ${d.whatsapp_ar})`;
      return backOk(redirect, LIST);
    }
    if (action === 'update') {
      // slug is immutable after creation — it is deliberately not updated here
      await sql`
        UPDATE offers SET
          destination_id = ${d.destination_id}, country_label = ${d.country_label}, flag = ${d.flag},
          active = ${d.active}, featured = ${d.featured}, starts_at = ${d.starts_at}, ends_at = ${d.ends_at},
          slots_total = ${d.slots_total}, slots_taken = ${d.slots_taken},
          title_fr = ${d.title_fr}, title_ar = ${d.title_ar},
          summary_fr = ${d.summary_fr}, summary_ar = ${d.summary_ar},
          body_fr = ${d.body_fr}, body_ar = ${d.body_ar}, image = ${d.image},
          whatsapp_fr = ${d.whatsapp_fr}, whatsapp_ar = ${d.whatsapp_ar}, updated_at = now()
        WHERE id = ${Number(str(form, 'id'))}`;
      return backOk(redirect, LIST);
    }
    return backErr(redirect, LIST, 'action inconnue');
  } catch (e: any) {
    console.error('[admin:offers]', e);
    const msg = e?.code === '23505' ? 'ce slug existe déjà' : 'erreur base de données';
    return backErr(redirect, LIST, msg);
  }
};
