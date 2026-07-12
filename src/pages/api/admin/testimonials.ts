import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSql } from '../../../lib/db';
import { str, opt, bool, int, backOk, backErr } from '../../../lib/admin-forms';

export const prerender = false;
const LIST = '/admin/testimonials';

const schema = z.object({
  sort_order: z.number().int(),
  published: z.boolean(),
  name: z.string().min(1).max(120),
  city: z.string().max(120),
  destination_id: z.string().max(60).nullable(),
  quote_fr: z.string().min(1).max(1000),
  quote_ar: z.string().max(1000).nullable(),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const sql = getSql();
  if (!sql) return backErr(redirect, LIST, 'DATABASE_URL non configuré');
  const form = await request.formData();
  const action = str(form, '_action');

  try {
    if (action === 'delete') {
      await sql`DELETE FROM testimonials WHERE id = ${Number(str(form, 'id'))}`;
      return backOk(redirect, LIST);
    }
    if (action === 'toggle-published') {
      await sql`UPDATE testimonials SET published = NOT published WHERE id = ${Number(str(form, 'id'))}`;
      return backOk(redirect, LIST);
    }

    const parsed = schema.safeParse({
      sort_order: int(form, 'sort_order', 100),
      published: bool(form, 'published'),
      name: str(form, 'name'),
      city: str(form, 'city'),
      destination_id: opt(form, 'destination_id'),
      quote_fr: str(form, 'quote_fr'),
      quote_ar: opt(form, 'quote_ar'),
    });
    if (!parsed.success) return backErr(redirect, LIST, 'champs invalides (nom et citation FR requis)');
    const d = parsed.data;

    if (action === 'create') {
      await sql`
        INSERT INTO testimonials (sort_order, published, name, city, destination_id, quote_fr, quote_ar)
        VALUES (${d.sort_order}, ${d.published}, ${d.name}, ${d.city}, ${d.destination_id}, ${d.quote_fr}, ${d.quote_ar})`;
      return backOk(redirect, LIST);
    }
    if (action === 'update') {
      await sql`
        UPDATE testimonials SET
          sort_order = ${d.sort_order}, published = ${d.published}, name = ${d.name}, city = ${d.city},
          destination_id = ${d.destination_id}, quote_fr = ${d.quote_fr}, quote_ar = ${d.quote_ar}
        WHERE id = ${Number(str(form, 'id'))}`;
      return backOk(redirect, LIST);
    }
    return backErr(redirect, LIST, 'action inconnue');
  } catch (e) {
    console.error('[admin:testimonials]', e);
    return backErr(redirect, LIST, 'erreur base de données');
  }
};
