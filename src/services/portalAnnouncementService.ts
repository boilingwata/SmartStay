// No announcements table exists in the DB yet.
// Methods return empty data so the UI renders gracefully.

// PA-01 FIX: Define typed interface instead of any[] to preserve type safety.
export interface PortalAnnouncement {
  id: string;
  title: string;
  content: string;
  type?: string;
  createdAt: string;
  isRead: boolean;
}

export const portalAnnouncementService = {
  getAnnouncements: async (_params?: { type?: string }): Promise<{ items: PortalAnnouncement[] }> => {
    // No announcements table in DB — returns empty list until table is created.
    return { items: [] };
  },

  markAsRead: async (_id: string): Promise<void> => {
    // No-op until an announcements table is added to the schema.
  },
};

export default portalAnnouncementService;
