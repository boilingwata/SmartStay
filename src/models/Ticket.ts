export type TicketStatus =
  | 'Open'
  | 'InProgress'
  | 'PendingConfirmation'
  | 'Resolved'
  | 'Closed';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TicketType =
  | 'Maintenance'
  | 'Complaint'
  | 'ServiceRequest'
  | 'Inquiry'
  | 'Emergency';

export type TicketCategoryValue = TicketType | (string & {});

export interface TicketTimelineItem {
  id: string;
  ticketId: string;
  action: string;
  performedBy: string;
  performedByAvatar?: string;
  performedByRole: string;
  note?: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  isInternal: boolean;
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  type: TicketCategoryValue;
  priority: TicketPriority;
  status: TicketStatus;

  buildingId: string;
  buildingName: string;
  roomId?: string;
  roomCode?: string;

  tenantId?: string;
  tenantName?: string;
  tenantAvatar?: string;

  assignedToId?: string;
  assignedToName?: string;
  assignedToAvatar?: string;

  // Computed reference deadline from created_at + priority.
  // This is a UI hint only because the live schema does not persist SLA.
  slaDeadline?: string;
  resolvedAt?: string;

  resolutionNote?: string;
  actualCost?: number;

  staffRating?: number;

  createdAt: string;
  updatedAt: string;
}

export interface TicketSummary {
  id: string;
  ticketCode: string;
  title: string;
  priority: TicketPriority;
  type: TicketCategoryValue;
  status: TicketStatus;
  roomName?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  slaDeadline?: string;
  createdAt: string;
}

export interface StaffServiceRating {
  id: string;
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  staffRole: string;
  rating: number;
  comment?: string;
  tenantId: string;
  tenantName: string;
  ticketId: string;
  ticketCode: string;
  createdAt: string;
}

export interface TicketStatistics {
  total: number;
  open: number;
  inProgress: number;
  pendingConfirmation: number;
  resolved: number;
  closed: number;
  active: number;
  slaBreached: number;
  avgResolutionTimeHours: number;
  satisfactionRate: number;
}
