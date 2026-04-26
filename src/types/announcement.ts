export type AnnouncementStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';
export type AnnouncementType = 'General' | 'Maintenance' | 'Security' | 'Event' | 'Holiday' | 'Urgent';
export type AnnouncementTargetGroup = 'Resident' | 'Owner' | 'Staff';

export interface AnnouncementInput {
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  publishAt: string | null;
  targetGroups: AnnouncementTargetGroup[];
  buildingIds: string[];
  isPinned: boolean;
}

export interface Announcement extends AnnouncementInput {
  id: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalAnnouncement extends Announcement {
  summary: string;
}

export const ANNOUNCEMENT_STATUS_OPTIONS: AnnouncementStatus[] = [
  'Published',
  'Scheduled',
  'Draft',
  'Archived',
];

export const ANNOUNCEMENT_TYPE_OPTIONS: AnnouncementType[] = [
  'General',
  'Urgent',
  'Maintenance',
  'Event',
  'Holiday',
  'Security',
];

export const ANNOUNCEMENT_TARGET_GROUP_OPTIONS: AnnouncementTargetGroup[] = [
  'Resident',
  'Owner',
  'Staff',
];

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  Draft: 'Bản nháp',
  Published: 'Đang hiển thị',
  Scheduled: 'Hẹn giờ',
  Archived: 'Đã lưu',
};

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  General: 'Thông báo chung',
  Maintenance: 'Bảo trì',
  Security: 'An ninh',
  Event: 'Sự kiện',
  Holiday: 'Ngày lễ',
  Urgent: 'Khẩn cấp',
};

export const ANNOUNCEMENT_TARGET_GROUP_LABELS: Record<AnnouncementTargetGroup, string> = {
  Resident: 'Cư dân',
  Owner: 'Chủ nhà',
  Staff: 'Nhân viên',
};

export const ANNOUNCEMENT_STATUS_TO_DB: Record<AnnouncementStatus, string> = {
  Draft: 'draft',
  Published: 'published',
  Scheduled: 'scheduled',
  Archived: 'archived',
};

export const ANNOUNCEMENT_STATUS_FROM_DB: Record<string, AnnouncementStatus> = {
  draft: 'Draft',
  published: 'Published',
  scheduled: 'Scheduled',
  archived: 'Archived',
};

export const ANNOUNCEMENT_TYPE_TO_DB: Record<AnnouncementType, string> = {
  General: 'general',
  Maintenance: 'maintenance',
  Security: 'security',
  Event: 'event',
  Holiday: 'holiday',
  Urgent: 'urgent',
};

export const ANNOUNCEMENT_TYPE_FROM_DB: Record<string, AnnouncementType> = {
  general: 'General',
  maintenance: 'Maintenance',
  security: 'Security',
  event: 'Event',
  holiday: 'Holiday',
  urgent: 'Urgent',
};

export const ANNOUNCEMENT_TARGET_GROUP_TO_DB: Record<AnnouncementTargetGroup, string> = {
  Resident: 'resident',
  Owner: 'owner',
  Staff: 'staff',
};

export const ANNOUNCEMENT_TARGET_GROUP_FROM_DB: Record<string, AnnouncementTargetGroup> = {
  resident: 'Resident',
  owner: 'Owner',
  staff: 'Staff',
};

export function getAnnouncementSummary(content: string, maxLength = 160): string {
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}
