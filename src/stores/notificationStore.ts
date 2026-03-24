import { create } from 'zustand';
import { Notification } from '@/types/notification';
import { notificationService } from '@/services/notificationService';

interface NotificationState {
  // State
  unreadCount: number;
  notifications: Notification[];
  hasNew: boolean;
  _unsubscribe: (() => void) | null;

  // Actions
  fetchNotifications: (profileId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (profileId: string) => Promise<void>;
  subscribe: (profileId: string) => void;
  cleanup: () => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  hasNew: false,
  _unsubscribe: null,

  fetchNotifications: async (profileId: string) => {
    const [notifications, unreadCount] = await Promise.all([
      notificationService.getNotifications(profileId),
      notificationService.getUnreadCount(profileId),
    ]);
    set({ notifications, unreadCount, hasNew: unreadCount > 0 });
  },

  markRead: async (id: string) => {
    await notificationService.markAsRead(id);
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const newCount = updated.filter((n) => !n.isRead).length;
      return { notifications: updated, unreadCount: newCount, hasNew: newCount > 0 };
    });
  },

  markAllRead: async (profileId: string) => {
    await notificationService.markAllAsRead(profileId);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
      hasNew: false,
    }));
  },

  subscribe: (profileId: string) => {
    // Clean up any existing subscription
    get()._unsubscribe?.();

    const unsubscribe = notificationService.subscribeToNew(profileId, (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        hasNew: true,
      }));
    });

    set({ _unsubscribe: unsubscribe });
  },

  cleanup: () => {
    get()._unsubscribe?.();
    set({ _unsubscribe: null, notifications: [], unreadCount: 0, hasNew: false });
  },
}));

export default useNotificationStore;
