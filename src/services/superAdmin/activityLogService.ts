import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export type AuditLogRow = Database['smartstay']['Tables']['audit_logs']['Row'];

export async function listLogsForUser(userId: string, limit = 50): Promise<AuditLogRow[]> {
  return unwrap(
    supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
}

export async function listRecentLogsForOrgUserIds(userIds: string[], limit = 10): Promise<AuditLogRow[]> {
  if (userIds.length === 0) return [];
  return unwrap(
    supabase
      .from('audit_logs')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
}

export async function listRecentAuditLogs(limit = 10): Promise<AuditLogRow[]> {
  return unwrap(
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit),
  );
}

export interface AuditLogQuery {
  actionContains?: string;
  entityType?: string;
  userId?: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
  offset?: number;
}

export async function listAuditLogs(filters: AuditLogQuery = {}): Promise<AuditLogRow[]> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
  if (filters.actionContains?.trim()) {
    q = q.ilike('action', `%${filters.actionContains.trim().replace(/%/g, '')}%`);
  }
  if (filters.entityType?.trim()) {
    q = q.eq('entity_type', filters.entityType.trim());
  }
  if (filters.userId?.trim()) {
    q = q.eq('user_id', filters.userId.trim());
  }
  if (filters.fromIso) {
    q = q.gte('created_at', filters.fromIso);
  }
  if (filters.toIso) {
    q = q.lte('created_at', filters.toIso);
  }
  q = q.range(offset, offset + limit - 1);
  return unwrap(q);
}
