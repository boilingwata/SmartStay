import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';

export type PlatformBroadcastRow = Database['smartstay']['Tables']['platform_broadcasts']['Row'];

export async function listBroadcasts(limit = 50): Promise<PlatformBroadcastRow[]> {
  return unwrap(
    supabase.from('platform_broadcasts').select('*').order('created_at', { ascending: false }).limit(limit),
  );
}

export async function createBroadcastDraft(input: {
  title: string;
  content: string;
  target_scope: 'all' | 'orgs';
  target_org_ids: string[];
  audience: 'owners' | 'owners_staff';
  created_by?: string | null;
}): Promise<PlatformBroadcastRow> {
  const row = await unwrap(
    supabase
      .from('platform_broadcasts')
      .insert({
        title: input.title.trim(),
        content: input.content.trim(),
        target_scope: input.target_scope,
        target_org_ids: input.target_org_ids,
        audience: input.audience,
        status: 'draft',
        created_by: input.created_by ?? null,
      })
      .select('*')
      .single(),
  );
  return row as PlatformBroadcastRow;
}

export async function sendBroadcastEmails(broadcastId: string): Promise<{ sent: number }> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; sent?: number }>('send-broadcast', {
    body: { announcementId: broadcastId, broadcastId },
  });
  if (error) throw error;
  return { sent: Number(data?.sent ?? 0) };
}

export async function sendTestEmail(toEmail: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-broadcast', {
    body: { testEmail: toEmail.trim().toLowerCase() },
  });
  if (error) throw error;
}
