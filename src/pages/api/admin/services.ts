import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSql } from '../../../lib/db';
import { SLUG_RE, slugify, str, opt, bool, int, lines, backOk, backErr } from '../../../lib/admin-forms';

export const prerender = false;
const LIST = '/admin/services';

const schema = z.object({
  sort_order: z.number().int(),
  available: z.boolean(),
  is_global: z.boolean(),
  icon: z.string().min(1).max(40),
  icon_image: z.string().max(300).nullable(),
  title_fr: z.string().min(1).max(160),
  title_ar: z.string().max(160).nullable(),
  tagline_fr: z.string().min(1).max(300),
  tagline_ar: z.string().max(300).nullable(),
  summary_fr: z.string().min(1).max(2000),
  summary_ar: z.string().max(2000).nullable(),
  includes_fr: z.array(z.string().max(300)),
  includes_ar: z.array(z.string().max(300)),
  whatsapp_fr: z.string().max(500),
  whatsapp_ar: z.string().max(500).nullable(),
  seo_title_fr: z.string().max(200).nullable(),
  seo_title_ar: z.string().max(200).nullable(),
  seo_desc_fr: z.string().max(300).nullable(),
  seo_desc_ar: z.string().max(300).nullable(),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const sql = getSql();
  if (!sql) return backErr(redirect, LIST, 'DATABASE_URL non configuré');
  const form = await request.formData();
  const action = str(form, '_action');

  try {
    if (action === 'delete') {
      await sql`DELETE FROM services WHERE id = ${str(form, 'id')}`;
      return backOk(redirect, LIST);
    }
    if (action === 'toggle-available' || action === 'toggle-global') {
      const col = action === 'toggle-available' ? sql`available = NOT available` : sql`is_global = NOT is_global`;
      await sql`UPDATE services SET ${col}, updated_at = now() WHERE id = ${str(form, 'id')}`;
      return backOk(redirect, LIST);
    }

    const parsed = schema.safeParse({
      sort_order: int(form, 'sort_order', 100),
      available: bool(form, 'available'),
      is_global: bool(form, 'is_global'),
      icon: str(form, 'icon') || 'file-check',
      icon_image: opt(form, 'icon_image'),
      title_fr: str(form, 'title_fr'),
      title_ar: opt(form, 'title_ar'),
      tagline_fr: str(form, 'tagline_fr'),
      tagline_ar: opt(form, 'tagline_ar'),
      summary_fr: str(form, 'summary_fr'),
      summary_ar: opt(form, 'summary_ar'),
      includes_fr: lines(form, 'includes_fr'),
      includes_ar: lines(form, 'includes_ar'),
      whatsapp_fr: str(form, 'whatsapp_fr'),
      whatsapp_ar: opt(form, 'whatsapp_ar'),
      seo_title_fr: opt(form, 'seo_title_fr'),
      seo_title_ar: opt(form, 'seo_title_ar'),
      seo_desc_fr: opt(form, 'seo_desc_fr'),
      seo_desc_ar: opt(form, 'seo_desc_ar'),
    });
    if (!parsed.success) return backErr(redirect, LIST, 'champs invalides (titre, tagline et résumé FR requis)');
    const d = parsed.data;

    if (action === 'create') {
      const id = slugify(str(form, 'slug'));
      if (!SLUG_RE.test(id)) return backErr(redirect, LIST, 'slug invalide (a-z, 0-9 et tirets uniquement)');
      await sql`
        INSERT INTO services (id, sort_order, available, is_global, icon, icon_image,
                              title_fr, title_ar, tagline_fr, tagline_ar, summary_fr, summary_ar,
                              includes_fr, includes_ar, whatsapp_fr, whatsapp_ar,
                              seo_title_fr, seo_title_ar, seo_desc_fr, seo_desc_ar)
        VALUES (${id}, ${d.sort_order}, ${d.available}, ${d.is_global}, ${d.icon}, ${d.icon_image},
                ${d.title_fr}, ${d.title_ar}, ${d.tagline_fr}, ${d.tagline_ar}, ${d.summary_fr}, ${d.summary_ar},
                ${d.includes_fr}, ${d.includes_ar}, ${d.whatsapp_fr}, ${d.whatsapp_ar},
                ${d.seo_title_fr}, ${d.seo_title_ar}, ${d.seo_desc_fr}, ${d.seo_desc_ar})`;
      return backOk(redirect, LIST);
    }
    if (action === 'update') {
      await sql`
        UPDATE services SET
          sort_order = ${d.sort_order}, available = ${d.available}, is_global = ${d.is_global},
          icon = ${d.icon}, icon_image = ${d.icon_image},
          title_fr = ${d.title_fr}, title_ar = ${d.title_ar},
          tagline_fr = ${d.tagline_fr}, tagline_ar = ${d.tagline_ar},
          summary_fr = ${d.summary_fr}, summary_ar = ${d.summary_ar},
          includes_fr = ${d.includes_fr}, includes_ar = ${d.includes_ar},
          whatsapp_fr = ${d.whatsapp_fr}, whatsapp_ar = ${d.whatsapp_ar},
          seo_title_fr = ${d.seo_title_fr}, seo_title_ar = ${d.seo_title_ar},
          seo_desc_fr = ${d.seo_desc_fr}, seo_desc_ar = ${d.seo_desc_ar}, updated_at = now()
        WHERE id = ${str(form, 'id')}`;
      return backOk(redirect, LIST);
    }
    return backErr(redirect, LIST, 'action inconnue');
  } catch (e: any) {
    console.error('[admin:services]', e);
    const msg = e?.code === '23505' ? 'ce slug existe déjà' : 'erreur base de données';
    return backErr(redirect, LIST, msg);
  }
};
