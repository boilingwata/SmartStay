/**
 * send-broadcast — Super admin only.
 * - POST { broadcastId?: string; announcementId?: string } — same id (plan name: announcementId).
 * - POST { testEmail: string } — one-off test using system_settings from_*.
 */

import '../_shared/deno-globals.d.ts';
import { handleOptions } from '../_shared/cors.ts';
import { requireSuperAdmin } from '../_shared/auth.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

function prefsEmail(prefs: unknown): string | null {
  if (!prefs || typeof prefs !== 'object') return null;
  const e = (prefs as Record<string, unknown>).email;
  return typeof e === 'string' && e.includes('@') ? e.trim().toLowerCase() : null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getSetting(admin: ReturnType<typeof createAdminClient>, key: string): Promise<string> {
  const { data, error } = await admin.from('system_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  const v = data?.value;
  if (typeof v === 'string') return v;
  if (v != null && typeof v === 'object') return JSON.stringify(v);
  return String(v ?? '');
}

async function resolveFromHeader(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const nameRaw = await getSetting(admin, 'email.from_name');
  const addrRaw = await getSetting(admin, 'email.from_address');
  const name = nameRaw.replace(/^"|"$/g, '').trim() || 'SmartStay';
  const addr = addrRaw.replace(/^"|"$/g, '').trim();
  if (!addr || !addr.includes('@')) {
    throw new Error('Chua cau hinh email.from_address trong system_settings');
  }
  return `${name} <${addr}>`;
}

async function sendResend(
  admin: ReturnType<typeof createAdminClient>,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) {
    throw new Error('Chua cau hinh RESEND_API_KEY (Edge Function secrets)');
  }
  const from = await resolveFromHeader(admin);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const { denied } = await requireSuperAdmin(req);
  if (denied) return denied;

  let body: { broadcastId?: string; announcementId?: string; testEmail?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const admin = createAdminClient();

  if (body.testEmail?.trim()) {
    const to = body.testEmail.trim().toLowerCase();
    if (!to.includes('@')) return errorResponse('testEmail khong hop le', 400);
    try {
      const html = `<p>Day la email thu tu SmartStay Super Admin.</p><p>Neu ban nhan duoc, cau hinh Resend da hoat dong.</p>`;
      await sendResend(admin, to, 'SmartStay — Thu email', html);
      return successResponse({ sent: 1 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Loi gui email';
      return errorResponse(msg, 500);
    }
  }

  const broadcastId = (body.broadcastId ?? body.announcementId)?.trim();
  if (!broadcastId) {
    return errorResponse('Can broadcastId, announcementId hoac testEmail', 400);
  }

  const { data: row, error: rowErr } = await admin
    .from('platform_broadcasts')
    .select('*')
    .eq('id', broadcastId)
    .maybeSingle();

  if (rowErr) return errorResponse(rowErr.message, 500);
  if (!row) return errorResponse('Khong tim thay broadcast', 404);
  if (row.status === 'sent') {
    return errorResponse('Broadcast da duoc gui truoc do', 409);
  }

  let orgIds: string[] = [];
  if (row.target_scope === 'all') {
    const { data: orgs, error: oErr } = await admin
      .from('organizations')
      .select('id')
      .eq('status', 'active')
      .is('deleted_at', null);
    if (oErr) return errorResponse(oErr.message, 500);
    orgIds = (orgs ?? []).map((o: { id: string }) => o.id);
  } else {
    orgIds = Array.isArray(row.target_org_ids) ? row.target_org_ids.filter(Boolean) : [];
  }

  if (orgIds.length === 0) {
    return errorResponse('Khong co to chuc muc tieu', 400);
  }

  const emails = new Set<string>();

  if (row.audience === 'owners') {
    const { data: profs, error: pErr } = await admin
      .from('profiles')
      .select('id, preferences')
      .eq('role', 'owner')
      .in('organization_id', orgIds);
    if (pErr) return errorResponse(pErr.message, 500);
    for (const p of profs ?? []) {
      const em = prefsEmail(p.preferences);
      if (em) emails.add(em);
    }
  } else {
    const { data: members, error: mErr } = await admin
      .from('organization_members')
      .select('user_id')
      .in('organization_id', orgIds)
      .eq('is_active', true)
      .in('member_role', ['owner', 'admin', 'staff']);
    if (mErr) return errorResponse(mErr.message, 500);
    const userIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];
    if (userIds.length === 0) {
      return errorResponse('Khong co thanh vien owner/admin/staff trong cac to chuc muc tieu', 400);
    }
    const { data: profs, error: prErr } = await admin
      .from('profiles')
      .select('preferences')
      .in('id', userIds);
    if (prErr) return errorResponse(prErr.message, 500);
    for (const p of profs ?? []) {
      const em = prefsEmail(p.preferences);
      if (em) emails.add(em);
    }
  }

  const list = [...emails];
  if (list.length === 0) {
    return errorResponse('Khong tim thay email nguoi nhan (preferences.email)', 400);
  }

  const subject = row.title;
  const html = `<h1>${escapeHtml(row.title)}</h1><div style="white-space:pre-wrap">${escapeHtml(row.content)}</div>`;

  let sent = 0;
  try {
    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) {
      return errorResponse('Chua cau hinh RESEND_API_KEY (Edge Function secrets)', 503);
    }
    const from = await resolveFromHeader(admin);
    for (const to of list) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });
      if (!res.ok) {
        const t = await res.text();
        return errorResponse(`Resend ${res.status}: ${t}`, 502);
      }
      sent += 1;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Loi gui email';
    return errorResponse(msg, 500);
  }

  const now = new Date().toISOString();
  const { error: upErr } = await admin
    .from('platform_broadcasts')
    .update({
      status: 'sent',
      sent_at: now,
      recipient_count: sent,
    })
    .eq('id', broadcastId);

  if (upErr) return errorResponse(upErr.message, 500);

  return successResponse({ sent, broadcastId });
});
