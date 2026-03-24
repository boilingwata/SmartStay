import { AuditLog } from '@/types';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

interface AuditLogRow {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  profiles: {
    full_name: string;
  } | null;
}

function rowToAuditLog(row: AuditLogRow): AuditLog {
  // Build a human-readable details string from new_values / old_values
  let details = '';
  if (row.new_values && typeof row.new_values === 'object') {
    details = Object.entries(row.new_values as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  } else if (row.old_values && typeof row.old_values === 'object') {
    details = Object.entries(row.old_values as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  return {
    id: row.id,
    timestamp: row.created_at ?? new Date().toISOString(),
    userId: row.user_id ?? '',
    username: row.profiles?.full_name ?? row.user_id ?? 'Unknown',
    action: row.action,
    module: row.entity_type,
    details: details || `${row.action} on ${row.entity_type}${row.entity_id ? ` #${row.entity_id}` : ''}`,
    ipAddress: row.ip_address ?? undefined,
  };
}

export const auditService = {
  getLogs: async (filters?: Record<string, unknown>): Promise<AuditLog[]> => {
    let query = supabase
      .from('audit_logs')
      .select('id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters?.action && typeof filters.action === 'string') {
      query = query.eq('action', filters.action);
    }

    if (filters?.entityType && typeof filters.entityType === 'string') {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters?.userId && typeof filters.userId === 'string') {
      query = query.eq('user_id', filters.userId);
    }

    const rows = await unwrap(query) as unknown as AuditLogRow[];

    let logs = rows.map(rowToAuditLog);

    if (filters?.search && typeof filters.search === 'string') {
      const s = filters.search.toLowerCase();
      logs = logs.filter(
        l =>
          l.username.toLowerCase().includes(s) ||
          l.action.toLowerCase().includes(s) ||
          l.details.toLowerCase().includes(s)
      );
    }

    return logs;
  },
};
