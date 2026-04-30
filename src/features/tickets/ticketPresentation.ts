import { formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { vi } from 'date-fns/locale';

import type {
  Ticket,
  TicketCategoryValue,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '@/models/Ticket';
import { PRIORITY_LABELS_VI, TICKET_CATEGORY_META } from '@/features/tickets/ticketMetadata';

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const STATUS_LABELS: Record<TicketStatus, string> = {
  Open: 'Mới tạo',
  InProgress: 'Đang xử lý',
  PendingConfirmation: 'Chờ cư dân xác nhận',
  Resolved: 'Đã xử lý',
  Closed: 'Đã đóng',
};

const CATEGORY_ALIASES: Record<string, TicketType> = {
  complaint: 'Complaint',
  electrical: 'Maintenance',
  elevator: 'Maintenance',
  emergency: 'Emergency',
  Inquiry: 'Inquiry',
  inquiry: 'Inquiry',
  maintenance: 'Maintenance',
  Maintenance: 'Maintenance',
  network: 'Maintenance',
  noise: 'Complaint',
  parking: 'Complaint',
  pest_control: 'ServiceRequest',
  plumbing: 'Maintenance',
  request: 'ServiceRequest',
  service_request: 'ServiceRequest',
};

const CATEGORY_FILTER_VALUES: Record<TicketType, string[]> = {
  Maintenance: ['Maintenance', 'maintenance', 'electrical', 'plumbing', 'elevator', 'network'],
  Complaint: ['Complaint', 'complaint', 'noise', 'parking'],
  ServiceRequest: ['ServiceRequest', 'service_request', 'request', 'pest_control'],
  Inquiry: ['Inquiry', 'inquiry'],
  Emergency: ['Emergency', 'emergency'],
};

export const ticketQueryKeys = {
  portalCreateContext: ['ticket', 'portal', 'create-context'] as const,
  portalCurrentTenant: ['ticket', 'portal', 'tenant'] as const,
  portalList: (tenantId: number | null | undefined, tab: string) =>
    ['ticket', 'portal', 'list', tenantId ?? 'none', tab] as const,
  portalDetail: (ticketId: string | undefined, tenantId: number | null | undefined) =>
    ['ticket', 'portal', 'detail', ticketId ?? 'none', tenantId ?? 'none'] as const,
  portalComments: (ticketId: string | undefined, tenantId: number | null | undefined) =>
    ['ticket', 'portal', 'comments', ticketId ?? 'none', tenantId ?? 'none'] as const,
  ownerList: (filters: unknown) => ['ticket', 'owner', 'list', filters] as const,
  ownerDetail: (ticketId: string | undefined) => ['ticket', 'owner', 'detail', ticketId ?? 'none'] as const,
  ownerComments: (ticketId: string | undefined) => ['ticket', 'owner', 'comments', ticketId ?? 'none'] as const,
  ownerStats: (buildingId: string | number | null | undefined) =>
    ['ticket', 'owner', 'stats', buildingId ?? 'all'] as const,
  staffList: ['ticket', 'staff', 'members'] as const,
  myTickets: (userId: string | undefined, search: string, tab: string) =>
    ['ticket', 'staff', 'mine', userId ?? 'none', search, tab] as const,
  staffRatings: (staffId: string | undefined) => ['ticket', 'staff', 'ratings', staffId ?? 'none'] as const,
};

export function normalizeTicketStatus(value?: string | null): TicketStatus {
  switch (value) {
    case 'new':
    case 'Open':
      return 'Open';
    case 'in_progress':
    case 'InProgress':
      return 'InProgress';
    case 'pending_confirmation':
    case 'PendingConfirmation':
      return 'PendingConfirmation';
    case 'resolved':
    case 'Resolved':
      return 'Resolved';
    case 'closed':
    case 'Closed':
      return 'Closed';
    default:
      return 'Open';
  }
}

export function getTicketStatusLabel(status?: string | null): string {
  return STATUS_LABELS[normalizeTicketStatus(status)];
}

export function getTicketPriorityLabel(priority?: TicketPriority | null): string {
  if (!priority) return 'Chưa xác định';
  return PRIORITY_LABELS_VI[priority] ?? priority;
}

export function normalizeTicketCategory(category?: string | null): TicketType | null {
  if (!category) return null;
  return CATEGORY_ALIASES[category] ?? null;
}

export function expandTicketCategoryFilter(category: TicketType): string[] {
  return CATEGORY_FILTER_VALUES[category] ?? [category];
}

export function getTicketCategoryLabel(category?: TicketCategoryValue | null): string {
  if (!category) return 'Chưa phân loại';

  const normalized = normalizeTicketCategory(category);
  if (normalized) {
    return TICKET_CATEGORY_META[normalized].label;
  }

  return 'Chưa phân loại';
}

export function getTicketCategoryShortLabel(category?: TicketCategoryValue | null): string {
  if (!category) return 'Khác';

  const normalized = normalizeTicketCategory(category);
  if (normalized) {
    return TICKET_CATEGORY_META[normalized].shortLabel;
  }

  return 'Khác';
}

export function getTicketReferenceDeadline(createdAt: string, priority?: string | null): string {
  const base = new Date(createdAt);
  const hours =
    priority === 'urgent' || priority === 'Critical'
      ? 24
      : priority === 'high' || priority === 'High'
        ? 48
        : priority === 'low' || priority === 'Low'
          ? 168
          : 72;

  return new Date(base.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isTicketFinished(status?: string | null): boolean {
  const normalized = normalizeTicketStatus(status);
  return normalized === 'Resolved' || normalized === 'Closed';
}

export function isTicketReferenceOverdue(ticket: Pick<Ticket, 'slaDeadline' | 'status'>): boolean {
  if (!ticket.slaDeadline || isTicketFinished(ticket.status)) return false;
  return new Date(ticket.slaDeadline).getTime() < Date.now();
}

export function formatTicketDate(value?: string | null): string {
  if (!value) return '--';
  return formatInTimeZone(new Date(value), VN_TIMEZONE, 'dd/MM/yyyy', { locale: vi });
}

export function formatTicketDateTime(value?: string | null): string {
  if (!value) return '--';
  return formatInTimeZone(new Date(value), VN_TIMEZONE, 'dd/MM/yyyy HH:mm', { locale: vi });
}

export function formatTicketRelativeTime(value?: string | null): string {
  if (!value) return '--';
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: vi });
}
