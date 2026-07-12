import type { APIRoute } from 'astro';
import { getSql } from '../../../lib/db';
import { str, backOk, backErr } from '../../../lib/admin-forms';
import { LEAD_STATUSES } from '../../../lib/telegram';

export const prerender = false;
const LIST = '/admin/leads';

export const POST: APIRoute = async ({ request, redirect }) => {
  const sql = getSql();
  if (!sql) return backErr(redirect, LIST, 'DATABASE_URL non configuré');
  const form = await request.formData();
  const id = Number(str(form, 'id'));
  const status = str(form, 'status');
  if (!Number.isInteger(id) || !(LEAD_STATUSES as readonly string[]).includes(status)) {
    return backErr(redirect, LIST, 'statut invalide');
  }
  try {
    await sql`UPDATE leads SET status = ${status} WHERE id = ${id}`;
    return backOk(redirect, LIST);
  } catch (e) {
    console.error('[admin:leads]', e);
    return backErr(redirect, LIST, 'erreur base de données');
  }
};
