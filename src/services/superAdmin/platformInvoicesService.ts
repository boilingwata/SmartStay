import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';
import {
  computeMrrEstimate,
  listOrganizations,
} from '@/services/superAdmin/organizationsService';
import { getPlanById } from '@/services/superAdmin/subscriptionPlansService';
import { getPlatformInvoiceGraceDays } from '@/services/superAdmin/systemSettingsService';

export type PlatformInvoiceRow = Database['smartstay']['Tables']['platform_invoices']['Row'];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(isoDate: string, days: number): string {
  const [y, m, da] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, da);
  dt.setDate(dt.getDate() + days);
  return ymd(dt);
}

export async function listPlatformInvoices(filters?: {
  status?: string;
  organizationId?: string;
}): Promise<PlatformInvoiceRow[]> {
  let q = supabase.from('platform_invoices').select('*').order('due_date', { ascending: true });
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.organizationId) q = q.eq('organization_id', filters.organizationId);
  return unwrap(q);
}

export async function markInvoicePaid(id: string): Promise<void> {
  const inv = await unwrap(supabase.from('platform_invoices').select('*').eq('id', id).single());
  const row = inv as PlatformInvoiceRow;
  await unwrap(
    supabase
      .from('platform_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_amount: row.amount_due,
      })
      .eq('id', id),
  );
}

export async function cancelInvoice(id: string): Promise<void> {
  await unwrap(supabase.from('platform_invoices').update({ status: 'cancelled' }).eq('id', id));
}

export async function adjustInvoice(
  id: string,
  patch: Partial<Pick<PlatformInvoiceRow, 'amount_due' | 'due_date' | 'notes' | 'paid_amount'>>,
): Promise<void> {
  await unwrap(supabase.from('platform_invoices').update(patch).eq('id', id));
}

/** Generate one invoice per active org for the current calendar month (skip if exists). */
export async function generateCurrentMonthInvoices(): Promise<number> {
  const orgs = await listOrganizations({ status: 'active', includeArchived: false });
  const grace = await getPlatformInvoiceGraceDays();
  const now = new Date();
  const ps = ymd(startOfMonth(now));
  const pe = ymd(endOfMonth(now));
  const due = addDays(pe, grace);

  let created = 0;
  for (const o of orgs) {
    if (!o.plan_id) continue;
    const plan = await getPlanById(o.plan_id);
    if (!plan) continue;

    const dup = await unwrap(
      supabase
        .from('platform_invoices')
        .select('id')
        .eq('organization_id', o.id)
        .eq('period_start', ps)
        .maybeSingle(),
    );
    if (dup) continue;

    const amount = Number(plan.monthly_price ?? 0);
    await unwrap(
      supabase.from('platform_invoices').insert({
        organization_id: o.id,
        period_start: ps,
        period_end: pe,
        amount_due: amount,
        paid_amount: 0,
        currency: 'VND',
        status: amount <= 0 ? 'paid' : 'pending',
        due_date: due,
        notes: `Tu dong: gói ${plan.name}`,
      }),
    );
    created += 1;
  }
  return created;
}

export async function refreshOverdueStatus(): Promise<number> {
  const today = ymd(new Date());
  const pending = await unwrap(
    supabase.from('platform_invoices').select('id, due_date, status').eq('status', 'pending'),
  );
  let n = 0;
  for (const row of pending as { id: string; due_date: string | null }[]) {
    if (!row.due_date) continue;
    if (row.due_date < today) {
      await unwrap(supabase.from('platform_invoices').update({ status: 'overdue' }).eq('id', row.id));
      n += 1;
    }
  }
  return n;
}

export async function summarizeBilling(): Promise<{
  mrr: number;
  overdueCount: number;
  overdueAmount: number;
  pendingCount: number;
}> {
  const mrr = await computeMrrEstimate();
  const overdue = await unwrap(
    supabase.from('platform_invoices').select('amount_due, paid_amount').eq('status', 'overdue'),
  );
  const pending = await unwrap(supabase.from('platform_invoices').select('id').eq('status', 'pending'));

  let overdueAmount = 0;
  const overdueRows = overdue as { amount_due: number; paid_amount: number }[];
  for (const r of overdueRows) {
    overdueAmount += Math.max(0, Number(r.amount_due) - Number(r.paid_amount ?? 0));
  }

  return {
    mrr,
    overdueCount: overdueRows.length,
    overdueAmount,
    pendingCount: (pending as { id: string }[]).length,
  };
}
