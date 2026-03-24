export type AnnouncementStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';
export type AnnouncementType = 'General' | 'Maintenance' | 'Security' | 'Event' | 'Holiday' | 'Urgent';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  publishAt: string;
  targetGroups: string[];
  buildingIds: string[];
  isPinned: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}
