import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapTicketStatus, mapPriority } from '@/lib/enumMaps';
import type { DbTicketStatus, DbPriorityType } from '@/types/supabase';
import {
  Ticket,
  TicketComment,
  TicketStatistics,
  TicketStatus,
  TicketPriority,
  TicketType,
  StaffServiceRating,
} from '@/models/Ticket';

// ---------------------------------------------------------------------------
// Internal DB row shapes
// ---------------------------------------------------------------------------

interface DbTicketRow {
  id: number;
  uuid: string;
  ticket_code: string;
  tenant_id: number | null;
  room_id: number | null;
  room_asset_id: number | null;
  subject: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  resolution_cost: number | null;
  satisfaction_rating: number | null;
  created_at: string | null;
  updated_at: string | null;
  rooms: {
    room_code: string;
    building_id: number;
    buildings: { id: number; name: string };
  } | null;
  tenants: { full_name: string } | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

interface DbTicketCommentRow {
  id: number;
  ticket_id: number;
  author_id: string | null;
  content: string;
  is_internal: boolean | null;
  attachments: unknown;
  created_at: string | null;
  profiles: { full_name: string; avatar_url: string | null; role: string } | null;
}

// ---------------------------------------------------------------------------
// Select strings
// ---------------------------------------------------------------------------

const TICKET_SELECT = `
  id,
  uuid,
  ticket_code,
  tenant_id,
  room_id,
  room_asset_id,
  subject,
  description,
  category,
  priority,
  status,
  assigned_to,
  resolved_at,
  resolution_notes,
  resolution_cost,
  satisfaction_rating,
  created_at,
  updated_at,
  rooms (
    room_code,
    building_id,
    buildings ( id, name )
  ),
  tenants ( full_name ),
  profiles:assigned_to ( full_name, avatar_url )
`.trim();

const COMMENT_SELECT = `
  id,
  ticket_id,
  author_id,
  content,
  is_internal,
  attachments,
  created_at,
  profiles:author_id ( full_name, avatar_url, role )
`.trim();

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

// SLA deadline: 24h for Critical/High, 72h for Medium, 7 days for Low
function calcSlaDeadline(createdAt: string, priority: string | null): string {
  const created = new Date(createdAt);
  const hours =
    priority === 'urgent'
      ? 24
      : priority === 'high'
      ? 48
      : priority === 'normal'
      ? 72
      : 168;
  created.setHours(created.getHours() + hours);
  return created.toISOString();
}

function mapDbRowToTicket(row: DbTicketRow): Ticket {
  const createdAt = row.created_at ?? new Date().toISOString();
  const room = row.rooms;
  const building = room?.buildings;
  const assignedProfile = row.profiles as unknown as { full_name: string; avatar_url: string | null } | null;

  return {
    id: String(row.id),
    ticketCode: row.ticket_code,
    title: row.subject,
    description: row.description ?? '',
    type: (row.category as TicketType) ?? 'Maintenance',
    priority: mapPriority.fromDb(row.priority ?? 'normal') as TicketPriority,
    status: mapTicketStatus.fromDb(row.status ?? 'new') as TicketStatus,

    buildingId: String(building?.id ?? ''),
    buildingName: building?.name ?? '',
    roomId: room ? String(row.room_id) : undefined,
    roomCode: room?.room_code ?? undefined,

    tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
    tenantName: (row.tenants as unknown as { full_name: string } | null)?.full_name ?? undefined,

    assignedToId: row.assigned_to ?? undefined,
    assignedToName: assignedProfile?.full_name ?? undefined,
    assignedToAvatar: assignedProfile?.avatar_url ?? undefined,

    slaDeadline: calcSlaDeadline(createdAt, row.priority),
    resolvedAt: row.resolved_at ?? undefined,

    resolutionNote: row.resolution_notes ?? undefined,
    actualCost: row.resolution_cost ?? undefined,
    staffRating: row.satisfaction_rating ?? undefined,

    createdAt,
    updatedAt: row.updated_at ?? createdAt,
  };
}

function mapDbCommentToTicketComment(row: DbTicketCommentRow): TicketComment {
  const profile = row.profiles as unknown as { full_name: string; avatar_url: string | null; role: string } | null;
  const attachments = Array.isArray(row.attachments)
    ? (row.attachments as unknown[]).map((a: unknown) => a as import('@/models/Ticket').TicketAttachment)
    : [];

  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    content: row.content,
    authorId: row.author_id ?? '',
    authorName: profile?.full_name ?? 'Unknown',
    authorAvatar: profile?.avatar_url ?? undefined,
    authorRole: profile?.role ?? 'Staff',
    isInternal: row.is_internal ?? false,
    attachments,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const ticketService = {
  getTickets: async (filters?: {
    status?: string | string[];
    priority?: string | string[];
    assignedTo?: string;
    search?: string;
    buildingId?: string | number | null;
    type?: string | string[];
    slaBreached?: boolean;
  }): Promise<Ticket[]> => {
    let query = supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'All') {
      if (Array.isArray(filters.status)) {
        const dbStatuses = filters.status.map(s => mapTicketStatus.toDb(s) as DbTicketStatus);
        query = query.in('status', dbStatuses);
      } else {
        query = query.eq('status', mapTicketStatus.toDb(filters.status) as DbTicketStatus);
      }
    }

    if (filters?.priority && filters.priority !== 'All') {
      if (Array.isArray(filters.priority)) {
        const dbPriorities = filters.priority.map(p => mapPriority.toDb(p) as DbPriorityType);
        query = query.in('priority', dbPriorities);
      } else {
        query = query.eq('priority', mapPriority.toDb(filters.priority) as DbPriorityType);
      }
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const rows = (await unwrap(query)) as unknown as DbTicketRow[];
    let tickets = rows.map(mapDbRowToTicket);

    // Building filter: applied in-memory since it's a nested join field
    if (filters?.buildingId) {
      tickets = tickets.filter((t) => t.buildingId === filters.buildingId);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(s) ||
          t.title.toLowerCase().includes(s) ||
          (t.tenantName ?? '').toLowerCase().includes(s)
      );
    }

    return tickets;
  },

  getTicketDetail: async (id: string): Promise<Ticket> => {
    const row = (await unwrap(
      supabase
        .from('tickets')
        .select(TICKET_SELECT)
        .eq('id', Number(id))
        .single()
    )) as unknown as DbTicketRow;

    return mapDbRowToTicket(row);
  },

  getTicketComments: async (ticketId: string): Promise<TicketComment[]> => {
    const rows = (await unwrap(
      supabase
        .from('ticket_comments')
        .select(COMMENT_SELECT)
        .eq('ticket_id', Number(ticketId))
        .order('created_at', { ascending: true })
    )) as unknown as DbTicketCommentRow[];

    return rows.map(mapDbCommentToTicketComment);
  },

  getTicketStatistics: async (): Promise<TicketStatistics> => {
    // Aggregate via a single select of status + resolved_at
    const rows = (await unwrap(
      supabase
        .from('tickets')
        .select('status, resolved_at, created_at, satisfaction_rating, priority')
    )) as unknown as {
      status: string | null;
      resolved_at: string | null;
      created_at: string | null;
      satisfaction_rating: number | null;
      priority: string | null;
    }[];

    const total = rows.length;
    let open = 0, inProgress = 0, resolved = 0, cancelled = 0, slaBreached = 0;
    let resolutionHoursSum = 0, resolutionCount = 0;
    let ratingSum = 0, ratingCount = 0;

    const now = new Date();

    for (const r of rows) {
      const fe = mapTicketStatus.fromDb(r.status ?? 'new') as TicketStatus;
      if (fe === 'Open') open++;
      else if (fe === 'InProgress') inProgress++;
      else if (fe === 'Resolved') resolved++;
      else if (fe === 'Cancelled') cancelled++;

      if (r.resolved_at && r.created_at) {
        const hours =
          (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) /
          3600000;
        resolutionHoursSum += hours;
        resolutionCount++;
      }

      // SLA breach: open/in-progress tickets past their deadline
      if (fe === 'Open' || fe === 'InProgress') {
        const deadline = new Date(calcSlaDeadline(r.created_at ?? '', r.priority));
        if (now > deadline) slaBreached++;
      }

      if (r.satisfaction_rating != null) {
        ratingSum += r.satisfaction_rating;
        ratingCount++;
      }
    }

    return {
      total,
      open,
      inProgress,
      resolved,
      cancelled,
      slaBreached,
      avgResolutionTimeHours:
        resolutionCount > 0 ? Math.round(resolutionHoursSum / resolutionCount) : 0,
      satisfactionRate: ratingCount > 0 ? ratingSum / ratingCount : 0,
    };
  },

  createTicket: async (
    ticket: Omit<Ticket, 'id' | 'ticketCode' | 'createdAt' | 'updatedAt'>
  ): Promise<Ticket> => {
    const row = (await unwrap(
      supabase
        .from('tickets')
        .insert({
          tenant_id: ticket.tenantId ? Number(ticket.tenantId) : null,
          room_id: ticket.roomId ? Number(ticket.roomId) : null,
          subject: ticket.title,
          description: ticket.description,
          category: ticket.type,
          priority: mapPriority.toDb(ticket.priority) as import('@/types/supabase').DbPriorityType,
          status: mapTicketStatus.toDb(ticket.status) as import('@/types/supabase').DbTicketStatus,
          assigned_to: ticket.assignedToId ?? null,
        })
        .select(TICKET_SELECT)
        .single()
    )) as unknown as DbTicketRow;

    return mapDbRowToTicket(row);
  },

  updateTicketStatus: async (id: string, status: TicketStatus): Promise<boolean> => {
    await unwrap(
      supabase
        .from('tickets')
        .update({
          status: mapTicketStatus.toDb(status) as import('@/types/supabase').DbTicketStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', Number(id))
    );
    return true;
  },

  updateStatus: async (
    id: string,
    status: TicketStatus,
    resolution?: {
      notes?: string;
      resolutionNote?: string;
      rootCause?: string;
      cost?: number;
      rating?: number;
    }
  ): Promise<boolean> => {
    const updates: Record<string, unknown> = {
      status: mapTicketStatus.toDb(status) as DbTicketStatus,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Resolved' || status === 'Closed') {
      updates.resolved_at = new Date().toISOString();
    }

    const notesText = resolution?.notes ?? resolution?.resolutionNote;
    if (notesText) {
      updates.resolution_notes = notesText;
    }
    if (resolution?.cost != null) {
      updates.resolution_cost = resolution.cost;
    }
    if (resolution?.rating != null) {
      updates.satisfaction_rating = resolution.rating;
    }

    await unwrap(
      supabase
        .from('tickets')
        .update(updates as Record<string, unknown>)
        .eq('id', Number(id))
    );
    return true;
  },

  addComment: async (
    ticketId: string,
    content: string,
    isInternal: boolean = false
  ): Promise<TicketComment> => {
    const { data: user } = await supabase.auth.getUser();

    const row = (await unwrap(
      supabase
        .from('ticket_comments')
        .insert({
          ticket_id: Number(ticketId),
          author_id: user.user?.id ?? null,
          content,
          is_internal: isInternal,
        })
        .select(COMMENT_SELECT)
        .single()
    )) as unknown as DbTicketCommentRow;

    return mapDbCommentToTicketComment(row);
  },

  // Staff ratings are not stored in a dedicated table — return empty
  getStaffRatings: async (
    _staffId: string
  ): Promise<{ average: number; summary: Record<number, number>; list: StaffServiceRating[] }> => {
    return { average: 0, summary: {}, list: [] };
  },
};

export default ticketService;
