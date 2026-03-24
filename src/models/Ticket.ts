export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed' | 'Cancelled';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TicketType = 'Maintenance' | 'Complaint' | 'ServiceRequest' | 'Inquiry' | 'Emergency';

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
  type: TicketType;
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
  
  slaDeadline: string;
  resolvedAt?: string;
  closedAt?: string;
  
  resolutionNote?: string;
  rootCause?: string;
  cancellationReason?: string;
  
  estimatedCost?: number;
  actualCost?: number;
  
  staffRating?: number;
  staffComment?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface TicketSummary {
  id: string;
  ticketCode: string;
  title: string;
  priority: TicketPriority;
  type: TicketType;
  status: TicketStatus;
  roomName?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  slaDeadline: string;
  createdAt: string;
}

export interface StaffServiceRating {
  id: string;
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  staffRole: string;
  rating: number; // 1-5
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
  resolved: number;
  cancelled: number;
  slaBreached: number;
  avgResolutionTimeHours: number;
  satisfactionRate: number;
}
