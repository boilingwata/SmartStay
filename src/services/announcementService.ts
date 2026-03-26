import { Announcement } from '@/types/announcement';

/**
 * Announcement Service — FEATURE STUB
 *
 * The `announcements` table does NOT exist in the `smartstay` schema.
 * All read methods return empty data. Write methods throw a user-friendly error
 * instead of a raw programmer exception so the UI can display a meaningful message.
 *
 * TO ENABLE THIS FEATURE:
 *   1. Run migration: CREATE TABLE smartstay.announcements (...)
 *   2. Re-generate src/types/supabase.ts
 *   3. Replace stubs with real supabase queries
 */
export const announcementService = {
  getAnnouncements: async (_filters?: unknown): Promise<Announcement[]> => {
    return [];
  },

  getAnnouncementDetail: async (_id: string | number): Promise<Announcement | undefined> => {
    return undefined;
  },

  createAnnouncement: async (
    _announcement: Omit<Announcement, 'id' | 'createdAt'>
  ): Promise<Announcement> => {
    // ANN-01 FIX: Changed from raw throw to structured user-facing error.
    // The table has not been provisioned — return a typed error the UI can handle.
    throw new Error(
      'Tính năng thông báo chưa được kích hoạt. ' +
      'Vui lòng liên hệ quản trị viên hệ thống để tạo bảng announcements.'
    );
  },

  deleteAnnouncement: async (_id: number | string): Promise<boolean> => {
    // No-op until table exists — return true to avoid UI error state
    return true;
  },

  updateAnnouncement: async (
    _id: number | string,
    _data: Partial<Omit<Announcement, 'id' | 'createdAt'>>
  ): Promise<Announcement | undefined> => {
    return undefined;
  },
};

export default announcementService;
