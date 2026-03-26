import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/notification';

/**
 * Notification Service
 *
 * NOTE: The `notifications` table does NOT exist in the `smartstay` schema.
 * All methods gracefully return empty/zero results to prevent UI crashes.
 *
 * The realtime subscription is disabled to avoid creating dead channels.
 *
 * TO ENABLE THIS FEATURE:
 *   1. Run the migration in supabase/migrations/add_notifications_table.sql
 *   2. Re-generate src/types/supabase.ts
 *   3. Remove the FEATURE_DISABLED guard below
 */
const NOTIFICATIONS_TABLE_EXISTS = false;

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
    id:        row.id,
    title:     row.title,
    message:   row.message,
    type:      row.type as Notification['type'],
    isRead:    row.is_read,
    link:      row.link || undefined,
    createdAt: row.created_at,
  };
}

export const notificationService = {
  /**
   * Fetch recent notifications for the current user.
   * Returns [] when the table doesn't exist yet.
   */
  async getNotifications(profileId: string, limit = 20): Promise<Notification[]> {
    if (!NOTIFICATIONS_TABLE_EXISTS) return [];

    // C-05: Remove .schema('smartstay') — client already configured for this schema
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[notificationService] getNotifications:', error.message);
      return [];
    }

    return (data as NotificationRow[]).map(mapRow);
  },

  /**
   * Get unread count for the current user.
   */
  async getUnreadCount(profileId: string): Promise<number> {
    if (!NOTIFICATIONS_TABLE_EXISTS) return 0;

    const { count, error } = await (supabase as any)
      .from('notifications')
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
    if (!NOTIFICATIONS_TABLE_EXISTS) return;

    const { error } = await (supabase as any)
      .from('notifications')
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
    if (!NOTIFICATIONS_TABLE_EXISTS) return;

    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', profileId)
      .eq('is_read', false);

    if (error) {
      console.warn('[notificationService] markAllAsRead:', error.message);
    }
  },

  /**
   * Subscribe to realtime inserts for this user's notifications.
   * Returns a no-op unsubscribe function when the table doesn't exist.
   */
  subscribeToNew(profileId: string, onNew: (notification: Notification) => void) {
    if (!NOTIFICATIONS_TABLE_EXISTS) {
      // Feature not available — return a no-op cleanup function
      return () => undefined;
    }

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
