export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'overdue' | 'ticket' | 'system' | 'contract';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
