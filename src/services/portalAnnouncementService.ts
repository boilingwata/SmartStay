// No announcements table exists in the DB yet.
// Methods return empty data so the UI renders gracefully.

export const portalAnnouncementService = {
  getAnnouncements: async (params?: { type?: string }): Promise<{ items: any[] }> => {
    return { items: [] };
  },

  markAsRead: async (id: string): Promise<void> => {
    // No-op until an announcements table is added to the schema.
  },
};

export default portalAnnouncementService;
