import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/notification';

interface NotificationRow {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  created_by: string | null;
}

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    link: row.link || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || undefined,
  };
}

let notificationsTableAvailable: boolean | null = null;
let notificationsTableCheckPromise: Promise<boolean> | null = null;

function isMissingNotificationsTableError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;

  const message = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST205' ||
    message.includes("could not find the table") ||
    message.includes('schema cache') ||
    message.includes("relation 'smartstay.notifications' does not exist") ||
    message.includes('relation "smartstay.notifications" does not exist')
  );
}

async function ensureNotificationsTable(): Promise<boolean> {
  if (notificationsTableAvailable !== null) return notificationsTableAvailable;
  if (notificationsTableCheckPromise) return notificationsTableCheckPromise;

  notificationsTableCheckPromise = (async () => {
    const client = supabase as any;
    const { error } = await client
      .from('notifications')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    notificationsTableAvailable = !error;
    if (error) {
      if (isMissingNotificationsTableError(error)) {
        notificationsTableAvailable = false;
      }
      console.warn('[notificationService] notifications table unavailable:', error.message);
    }

    notificationsTableCheckPromise = null;
    return notificationsTableAvailable;
  })();

  return notificationsTableCheckPromise;
}

async function getCurrentProfileId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export const notificationService = {
  async getNotifications(profileId: string, limit = 20): Promise<Notification[]> {
    if (!(await ensureNotificationsTable())) return [];

    const client = supabase as any;
    const { data, error } = await client
      .from('notifications')
      .select('id, profile_id, title, message, type, is_read, link, created_at, created_by')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingNotificationsTableError(error)) {
        notificationsTableAvailable = false;
      }
      console.warn('[notificationService] getNotifications:', error.message);
      return [];
    }

    return (data as NotificationRow[]).map(mapRow);
  },

  async getUnreadCount(profileId: string): Promise<number> {
    if (!(await ensureNotificationsTable())) return 0;

    const client = supabase as any;
    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_read', false);

    if (error) {
      if (isMissingNotificationsTableError(error)) {
        notificationsTableAvailable = false;
      }
      console.warn('[notificationService] getUnreadCount:', error.message);
      return 0;
    }

    return count || 0;
  },

  async markAsRead(id: string): Promise<void> {
    if (!(await ensureNotificationsTable())) return;

    const client = supabase as any;
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      if (isMissingNotificationsTableError(error)) {
        notificationsTableAvailable = false;
      }
      console.warn('[notificationService] markAsRead:', error.message);
    }
  },

  async markAllAsRead(profileId: string): Promise<void> {
    if (!(await ensureNotificationsTable())) return;

    const client = supabase as any;
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', profileId)
      .eq('is_read', false);

    if (error) {
      if (isMissingNotificationsTableError(error)) {
        notificationsTableAvailable = false;
      }
      console.warn('[notificationService] markAllAsRead:', error.message);
    }
  },

  async sendToProfile(input: {
    profileId: string;
    title: string;
    message: string;
    type?: string;
    link?: string | null;
  }): Promise<Notification> {
    if (!(await ensureNotificationsTable())) {
      throw new Error('Schema Supabase hiện tại chưa có bảng notifications.');
    }

    const createdBy = await getCurrentProfileId();
    const client = supabase as any;
    const { data, error } = await client
      .from('notifications')
      .insert({
        profile_id: input.profileId,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type ?? 'admin_message',
        link: input.link ?? null,
        created_by: createdBy,
      })
      .select('id, profile_id, title, message, type, is_read, link, created_at, created_by')
      .single();

    if (error) {
      if (isMissingNotificationsTableError(error)) {
        notificationsTableAvailable = false;
      }
      throw new Error(error.message || 'Không thể gửi thông báo tới cư dân.');
    }

    return mapRow(data as NotificationRow);
  },

  subscribeToNew(profileId: string, onNew: (notification: Notification) => void) {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void ensureNotificationsTable().then((isAvailable) => {
      if (!isAvailable || cancelled) return;

      channel = supabase
        .channel(`notifications:${profileId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'smartstay',
            table: 'notifications',
            filter: `profile_id=eq.${profileId}`,
          },
          (payload) => {
            onNew(mapRow(payload.new as NotificationRow));
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  },
};

export default notificationService;
