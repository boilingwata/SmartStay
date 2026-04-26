export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  createdBy?: string;
}

export interface NotificationLogItem extends Notification {
  profileId: string;
  recipientName?: string;
  createdByName?: string;
}
