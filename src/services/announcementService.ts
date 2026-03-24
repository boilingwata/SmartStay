import { Announcement } from '@/types/announcement';

// No announcements table exists in the current database schema.
// These methods return empty / stub results and will be wired up once
// the table is provisioned.

export const announcementService = {
  getAnnouncements: async (_filters?: unknown): Promise<Announcement[]> => {
    return [];
  },

  getAnnouncementDetail: async (_id: string | number): Promise<Announcement | undefined> => {
    return undefined;
  },

  createAnnouncement: async (
    announcement: Omit<Announcement, 'id' | 'createdAt'>
  ): Promise<Announcement> => {
    return {
      ...announcement,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    } as Announcement;
  },

  deleteAnnouncement: async (_id: number | string): Promise<boolean> => {
    return true;
  },
};

export default announcementService;
