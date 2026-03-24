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
}

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type as Notification['type'],
    isRead: row.is_read,
    link: row.link || undefined,
    createdAt: row.created_at,
  };
}

export const notificationService = {
  /**
   * Fetch recent notifications for the current user.
   * Returns [] gracefully if the table doesn't exist yet.
   */
  async getNotifications(profileId: string, limit = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Table may not exist yet — return empty instead of crashing
    if (error) {
      console.warn('[notificationService] getNotifications:', error.message);
      return [];
    }

    return (data as unknown as NotificationRow[]).map(mapRow);
  },

  /**
   * Get unread count for the current user.
   */
  async getUnreadCount(profileId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications' as any)
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_read', false);

    if (error) {
      console.warn('[notificationService] getUnreadCount:', error.message);
      return 0;
    }

    return count || 0;
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.warn('[notificationService] markAsRead:', error.message);
    }
  },

  /**
   * Mark all notifications as read for the current user.
   */
  async markAllAsRead(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('profile_id', profileId)
      .eq('is_read', false);

    if (error) {
      console.warn('[notificationService] markAllAsRead:', error.message);
    }
  },

  /**
   * Subscribe to realtime inserts for this user's notifications.
   * Returns an unsubscribe function.
   */
  subscribeToNew(profileId: string, onNew: (notification: Notification) => void) {
    const channel = supabase
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default notificationService;
