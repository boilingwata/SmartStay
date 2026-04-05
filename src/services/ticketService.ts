import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { DbTicketStatus, DbPriorityType } from '@/types/supabase';
import { mapTicketStatus, mapPriority, mapRole } from '@/lib/enumMaps';
import { z } from 'zod';
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

const optionalNumericId = z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((value, ctx) => {
  if (value == null || value === '') return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expected a positive integer id',
    });
    return z.NEVER;
  }

  return parsed;
});

const optionalUuid = z.union([z.string(), z.null(), z.undefined()]).transform((value, ctx) => {
  if (!value) return null;

  if (!z.string().uuid().safeParse(value).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expected a valid UUID',
    });
    return z.NEVER;
  }

  return value;
});

const createTicketInputSchema = z.object({
  tenantId: optionalNumericId,
  roomId: optionalNumericId,
  title: z.string().trim().min(3, 'Title is required'),
  description: z.string().trim().max(5000).optional().default(''),
  type: z.string().trim().min(1, 'Category is required'),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  status: z.enum(['Open', 'InProgress', 'Resolved', 'Closed', 'Cancelled']).optional().default('Open'),
  assignedToId: optionalUuid.optional().default(null),
});

export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;

const DB_TICKET_STATUSES = ['new', 'in_progress', 'pending_confirmation', 'resolved', 'closed'] as const;

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

// TK-01: SLA deadline is a computed client-side field — it is NOT stored in the DB.
// Business rule: deadlines are measured from ticket creation time.
//   Priority 'urgent' (Critical) → 24 hours
//   Priority 'high'              → 48 hours
//   Priority 'normal'            → 72 hours
//   Priority 'low'               → 168 hours (7 days)
// TO PERSIST: add `sla_deadline_at TIMESTAMPTZ` to the `tickets` table,
// populate it via a DB trigger or service-side logic on insert,
// and remove this computation from the frontend.
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

    buildingId: building?.id ? String(building.id) : '',
    buildingName: building?.name ?? '',
    roomId: row.room_id ? String(row.room_id) : undefined,
    roomCode: room?.room_code ?? undefined,

    tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
    tenantName: (row.tenants as any)?.full_name ?? undefined,

    assignedToId: row.assigned_to ?? undefined,
    assignedToName: assignedProfile?.full_name ?? undefined,
    assignedToAvatar: assignedProfile?.avatar_url ?? undefined,

    slaDeadline: row.resolved_at ? row.resolved_at : (row as any).sla_deadline_at || calcSlaDeadline(createdAt, row.priority),
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
    tenantId?: string | number | null;
    buildingId?: string | number | null;
    roomId?: string | number | null;
    type?: string | string[];
    slaBreached?: boolean;
    dateRange?: { from?: string; to?: string };
  }): Promise<Ticket[]> => {
    let query = supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .order('created_at', { ascending: false });

    // Server-side status filter
    if (filters?.status && filters.status !== 'All') {
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        const dbStatuses = filters.status.map((status) => {
          return DB_TICKET_STATUSES.includes(status as (typeof DB_TICKET_STATUSES)[number])
            ? (status as DbTicketStatus)
            : (mapTicketStatus.toDb(status) as DbTicketStatus);
        });
        query = query.in('status', dbStatuses);
      } else if (!Array.isArray(filters.status)) {
        const dbStatus = DB_TICKET_STATUSES.includes(filters.status as (typeof DB_TICKET_STATUSES)[number])
          ? (filters.status as DbTicketStatus)
          : (mapTicketStatus.toDb(filters.status) as DbTicketStatus);
        query = query.eq('status', dbStatus);
      }
    }

    // Server-side priority filter
    if (filters?.priority && filters.priority !== 'All') {
      if (Array.isArray(filters.priority) && filters.priority.length > 0) {
        const dbPriorities = filters.priority.map(p => mapPriority.toDb(p) as DbPriorityType);
        query = query.in('priority', dbPriorities);
      } else if (!Array.isArray(filters.priority)) {
        query = query.eq('priority', mapPriority.toDb(filters.priority) as DbPriorityType);
      }
    }

    // Server-side type (category) filter
    if (filters?.type && filters.type !== 'All') {
      if (Array.isArray(filters.type) && filters.type.length > 0) {
        query = query.in('category', filters.type);
      } else if (!Array.isArray(filters.type)) {
        query = query.eq('category', filters.type);
      }
    }

    // Server-side assignedTo filter
    if (filters?.assignedTo && filters.assignedTo !== 'All') {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters?.tenantId != null && filters.tenantId !== '') {
      query = query.eq('tenant_id', Number(filters.tenantId));
    }

    // Server-side roomId filter
    if (filters?.roomId != null && filters.roomId !== '') {
      query = query.eq('room_id', Number(filters.roomId));
    }

    // Server-side Date Range filter
    if (filters?.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from);
    }
    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to);
    }

    const rows = (await unwrap(query)) as unknown as DbTicketRow[];
    let tickets = rows.map(mapDbRowToTicket);

    // Building filter: applied in-memory (Supabase nested filter is complex for this schema)
    if (filters?.buildingId != null && filters.buildingId !== '') {
      const targetBuildingId = String(filters.buildingId);
      tickets = tickets.filter((t) => t.buildingId === targetBuildingId);
    }

    // Client-side text search
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(s) ||
          t.title.toLowerCase().includes(s) ||
          (t.tenantName ?? '').toLowerCase().includes(s)
      );
    }

    // SLA breach filter: applied in-memory
    if (filters?.slaBreached !== undefined) {
      const now = new Date();
      tickets = tickets.filter((t) => {
        const deadline = new Date(t.slaDeadline ?? '');
        const isBreached = !isNaN(deadline.getTime()) && now > deadline && t.status !== 'Resolved' && t.status !== 'Closed';
        return filters.slaBreached ? isBreached : !isBreached;
      });
    }

    return tickets;
  },

  getTicketDetail: async (id: string, tenantId?: string | number | null): Promise<Ticket> => {
    let query = supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('id', Number(id));

    if (tenantId != null && tenantId !== '') {
      query = query.eq('tenant_id', Number(tenantId));
    }

    const row = (await unwrap(query.single())) as unknown as DbTicketRow;

    return mapDbRowToTicket(row);
  },

  getTicketComments: async (ticketId: string, tenantId?: string | number | null): Promise<TicketComment[]> => {
    if (tenantId != null && tenantId !== '') {
      await unwrap(
        supabase
          .from('tickets')
          .select('id')
          .eq('id', Number(ticketId))
          .eq('tenant_id', Number(tenantId))
          .single()
      );
    }

    const rows = (await unwrap(
      supabase
        .from('ticket_comments')
        .select(COMMENT_SELECT)
        .eq('ticket_id', Number(ticketId))
        .order('created_at', { ascending: true })
    )) as unknown as DbTicketCommentRow[];

    return rows.map(mapDbCommentToTicketComment);
  },

  getTicketStatistics: async (filters?: { buildingId?: string | number | null }): Promise<TicketStatistics> => {
    // 10 CRITICAL DATABASE RULES -- RULE-02: Use views for counts? 
    // Actually, for stats we want status/priority distribution, so we fetch records.
    let query = supabase
      .from('tickets')
      .select('status, resolved_at, created_at, satisfaction_rating, priority, rooms!inner(building_id)');

    if (filters?.buildingId != null && filters.buildingId !== '') {
      query = query.eq('rooms.building_id', Number(filters.buildingId));
    }

    const rows = (await unwrap(query)) as unknown as {
      status: string | null;
      resolved_at: string | null;
      created_at: string | null;
      satisfaction_rating: number | null;
      priority: string | null;
      rooms: { building_id: number };
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

  createTicket: async (ticket: CreateTicketInput): Promise<Ticket> => {
    const parsedTicket = createTicketInputSchema.parse(ticket);
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      throw new Error('Bạn cần đăng nhập lại trước khi gửi yêu cầu.');
    }

    const { data: newRow, error: insertError } = await supabase
      .from('tickets')
      .insert({
        tenant_id: parsedTicket.tenantId,
        room_id: parsedTicket.roomId,
        subject: parsedTicket.title,
        description: parsedTicket.description || null,
        category: parsedTicket.type,
        priority: mapPriority.toDb(parsedTicket.priority) as DbPriorityType,
        status: mapTicketStatus.toDb(parsedTicket.status || 'Open') as DbTicketStatus,
        assigned_to: parsedTicket.assignedToId,
      })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.message.toLowerCase().includes('row-level security')) {
        throw new Error('Tài khoản hiện tại không có quyền tạo ticket cho hồ sơ cư dân này.');
      }

      throw new Error(insertError.message);
    }

    return ticketService.getTicketDetail(String(newRow.id));
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

  // B40 FIX: Assign ticket to a staff user by their UUID
  assignTicket: async (ticketId: string, assigneeId: string | null): Promise<boolean> => {
    await unwrap(
      supabase
        .from('tickets')
        .update({
          assigned_to: assigneeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', Number(ticketId))
    );
    return true;
  },

  // Fetch all profiles with staff/admin role
  getStaff: async (): Promise<{ id: string; fullName: string; avatarUrl: string | null; role: string }[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .in('role', ['staff', 'admin'])
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    return data.map(d => ({
      id: d.id,
      fullName: d.full_name,
      avatarUrl: d.avatar_url,
      role: mapRole.fromDb(d.role),
    }));
  },

  getStaffRatings: async (
    _staffId: string
  ): Promise<{ average: number; summary: Record<number, number>; list: StaffServiceRating[] }> => {
    return { average: 0, summary: {}, list: [] };
  },
};

export default ticketService;
