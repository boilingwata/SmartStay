import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapPriority, mapRole, mapTicketStatus } from '@/lib/enumMaps';
import { fileService } from '@/services/fileService';
import type { DbPriorityType, DbTicketStatus, Json } from '@/types/supabase';
import {
  expandTicketCategoryFilter,
  getTicketReferenceDeadline,
  isTicketReferenceOverdue,
  normalizeTicketStatus,
} from '@/features/tickets/ticketPresentation';
import type {
  StaffServiceRating,
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketPriority,
  TicketStatistics,
  TicketStatus,
  TicketType,
} from '@/models/Ticket';

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
  rooms:
    | {
        room_code: string | null;
        building_id: number | null;
        buildings:
          | {
              id: number;
              name: string;
            }
          | {
              id: number;
              name: string;
            }[]
          | null;
      }
    | null;
  tenants:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
  profiles:
    | {
        full_name: string | null;
        avatar_url: string | null;
      }
    | {
        full_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
}

interface DbTicketCommentRow {
  id: number;
  ticket_id: number;
  author_id: string | null;
  content: string;
  is_internal: boolean | null;
  attachments: unknown;
  created_at: string | null;
  profiles:
    | {
        full_name: string | null;
        avatar_url: string | null;
        role: string | null;
      }
    | {
        full_name: string | null;
        avatar_url: string | null;
        role: string | null;
      }[]
    | null;
}

interface DbStaffRatingRow {
  id: number;
  ticket_code: string;
  tenant_id: number | null;
  assigned_to: string | null;
  satisfaction_rating: number | null;
  resolution_notes: string | null;
  updated_at: string | null;
  created_at: string | null;
  tenants:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
  profiles:
    | {
        full_name: string | null;
        avatar_url: string | null;
        role: string | null;
      }
    | {
        full_name: string | null;
        avatar_url: string | null;
        role: string | null;
      }[]
    | null;
}

const DB_TICKET_STATUSES = ['new', 'in_progress', 'pending_confirmation', 'resolved', 'closed'] as const;

const optionalNumericId = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null || value === '') return null;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giá trị mã số không hợp lệ.',
      });
      return z.NEVER;
    }

    return parsed;
  });

const optionalUuid = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (!value) return null;

    if (!z.string().uuid().safeParse(value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mã người dùng không hợp lệ.',
      });
      return z.NEVER;
    }

    return value;
  });

const createTicketInputSchema = z.object({
  tenantId: optionalNumericId,
  roomId: optionalNumericId,
  title: z.string().trim().min(3, 'Vui lòng nhập tiêu đề yêu cầu.'),
  description: z.string().trim().max(5000).optional().default(''),
  type: z.string().trim().min(1, 'Vui lòng chọn phân loại yêu cầu.'),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  status: z.enum(['Open', 'InProgress', 'PendingConfirmation', 'Resolved', 'Closed']).optional().default('Open'),
  assignedToId: optionalUuid.optional().default(null),
});

export type CreateTicketInput = z.infer<typeof createTicketInputSchema> & {
  attachments?: File[];
};

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

const STAFF_RATING_SELECT = `
  id,
  ticket_code,
  tenant_id,
  assigned_to,
  satisfaction_rating,
  resolution_notes,
  updated_at,
  created_at,
  tenants ( full_name ),
  profiles:assigned_to ( full_name, avatar_url, role )
`.trim();

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function firstRecord<T>(value: T | T[] | null | undefined): T | null {
  return toArray(value)[0] ?? null;
}

function toDbTicketStatus(status: string): DbTicketStatus {
  if (DB_TICKET_STATUSES.includes(status as DbTicketStatus)) {
    return status as DbTicketStatus;
  }

  return mapTicketStatus.toDb(normalizeTicketStatus(status)) as DbTicketStatus;
}

function toDbPriority(priority: string): DbPriorityType {
  return mapPriority.toDb(priority) as DbPriorityType;
}

function mapDbRowToTicket(row: DbTicketRow): Ticket {
  const createdAt = row.created_at ?? new Date().toISOString();
  const room = firstRecord(row.rooms);
  const building = firstRecord(room?.buildings ?? null);
  const tenant = firstRecord(row.tenants);
  const assignedProfile = firstRecord(row.profiles);

  return {
    id: String(row.id),
    ticketCode: row.ticket_code,
    title: row.subject,
    description: row.description ?? '',
    type: row.category ?? 'Maintenance',
    priority: mapPriority.fromDb(row.priority ?? 'normal') as TicketPriority,
    status: mapTicketStatus.fromDb(row.status ?? 'new') as TicketStatus,
    buildingId: building?.id ? String(building.id) : '',
    buildingName: building?.name ?? '',
    roomId: row.room_id ? String(row.room_id) : undefined,
    roomCode: room?.room_code ?? undefined,
    tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
    tenantName: tenant?.full_name ?? undefined,
    assignedToId: row.assigned_to ?? undefined,
    assignedToName: assignedProfile?.full_name ?? undefined,
    assignedToAvatar: assignedProfile?.avatar_url ?? undefined,
    slaDeadline: getTicketReferenceDeadline(createdAt, row.priority),
    resolvedAt: row.resolved_at ?? undefined,
    resolutionNote: row.resolution_notes ?? undefined,
    actualCost: row.resolution_cost ?? undefined,
    staffRating: row.satisfaction_rating ?? undefined,
    createdAt,
    updatedAt: row.updated_at ?? createdAt,
  };
}

function mapDbCommentToTicketComment(row: DbTicketCommentRow): TicketComment {
  const profile = firstRecord(row.profiles);
  const attachments = Array.isArray(row.attachments)
    ? row.attachments.map((item) => item as TicketAttachment)
    : [];

  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    content: row.content,
    authorId: row.author_id ?? '',
    authorName: profile?.full_name ?? 'Người dùng SmartStay',
    authorAvatar: profile?.avatar_url ?? undefined,
    authorRole: profile?.role ? mapRole.fromDb(profile.role) : 'Staff',
    isInternal: row.is_internal ?? false,
    attachments,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

async function uploadTicketAttachments(files: File[], uploadedBy: string): Promise<TicketAttachment[]> {
  return Promise.all(
    files.map(async (file) => {
      const fileUrl = await fileService.uploadFile(file, file.name, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 5 * 1024 * 1024,
        pathPrefix: `tickets/${uploadedBy}`,
      });

      return {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy,
        createdAt: new Date().toISOString(),
      };
    })
  );
}

function composeResolutionNotes(resolution?: {
  notes?: string;
  resolutionNote?: string;
  rootCause?: string;
}): string | null {
  if (!resolution) return null;

  const notes = resolution.notes?.trim() || resolution.resolutionNote?.trim() || '';
  const rootCause = resolution.rootCause?.trim() || '';

  if (!notes && !rootCause) return null;
  if (!rootCause) return notes;
  if (!notes) return `Nguyên nhân gốc: ${rootCause}`;

  return `${notes}\n\nNguyên nhân gốc: ${rootCause}`;
}

function buildEmptyTicketStats(): TicketStatistics {
  return {
    total: 0,
    open: 0,
    inProgress: 0,
    pendingConfirmation: 0,
    resolved: 0,
    closed: 0,
    active: 0,
    slaBreached: 0,
    avgResolutionTimeHours: 0,
    satisfactionRate: 0,
  };
}

export const ticketService = {
  async getTickets(filters?: {
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
  }): Promise<Ticket[]> {
    let query = supabase.from('tickets').select(TICKET_SELECT).order('created_at', { ascending: false });

    const statuses =
      filters?.status && filters.status !== 'All'
        ? (Array.isArray(filters.status) ? filters.status : [filters.status]).filter(Boolean)
        : [];

    if (statuses.length > 0) {
      query = query.in('status', statuses.map(toDbTicketStatus));
    }

    const priorities =
      filters?.priority && filters.priority !== 'All'
        ? (Array.isArray(filters.priority) ? filters.priority : [filters.priority]).filter(Boolean)
        : [];

    if (priorities.length > 0) {
      query = query.in('priority', priorities.map(toDbPriority));
    }

    const requestedTypes =
      filters?.type && filters.type !== 'All'
        ? (Array.isArray(filters.type) ? filters.type : [filters.type]).filter(Boolean)
        : [];

    if (requestedTypes.length > 0) {
      const categoryValues = [...new Set(requestedTypes.flatMap((value) => expandTicketCategoryFilter(value as TicketType)))];
      query = query.in('category', categoryValues);
    }

    if (filters?.assignedTo && filters.assignedTo !== 'All') {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters?.tenantId != null && filters.tenantId !== '') {
      query = query.eq('tenant_id', Number(filters.tenantId));
    }

    if (filters?.roomId != null && filters.roomId !== '') {
      query = query.eq('room_id', Number(filters.roomId));
    }

    if (filters?.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from);
    }

    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to);
    }

    const rows = (await unwrap(query)) as unknown as DbTicketRow[];
    let tickets = rows.map(mapDbRowToTicket);

    if (filters?.buildingId != null && filters.buildingId !== '') {
      const targetBuildingId = String(filters.buildingId);
      tickets = tickets.filter((ticket) => ticket.buildingId === targetBuildingId);
    }

    if (filters?.search) {
      const keyword = filters.search.toLowerCase();
      tickets = tickets.filter((ticket) => {
        return (
          ticket.ticketCode.toLowerCase().includes(keyword) ||
          ticket.title.toLowerCase().includes(keyword) ||
          (ticket.tenantName ?? '').toLowerCase().includes(keyword) ||
          (ticket.roomCode ?? '').toLowerCase().includes(keyword)
        );
      });
    }

    if (filters?.slaBreached === true) {
      tickets = tickets.filter((ticket) => {
        return isTicketReferenceOverdue(ticket);
      });
    }

    return tickets;
  },

  async getTicketDetail(id: string, tenantId?: string | number | null): Promise<Ticket> {
    let query = supabase.from('tickets').select(TICKET_SELECT).eq('id', Number(id));

    if (tenantId != null && tenantId !== '') {
      query = query.eq('tenant_id', Number(tenantId));
    }

    const row = (await unwrap(query.single())) as unknown as DbTicketRow;
    return mapDbRowToTicket(row);
  },

  async getTicketComments(ticketId: string, tenantId?: string | number | null): Promise<TicketComment[]> {
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

  async getTicketStatistics(filters?: { buildingId?: string | number | null }): Promise<TicketStatistics> {
    let roomIds: number[] | null = null;

    if (filters?.buildingId != null && filters.buildingId !== '') {
      const roomRows = (await unwrap(
        supabase
          .from('rooms')
          .select('id')
          .eq('building_id', Number(filters.buildingId))
          .eq('is_deleted', false)
      )) as unknown as { id: number }[];

      roomIds = roomRows.map((row) => row.id);
      if (roomIds.length === 0) {
        return buildEmptyTicketStats();
      }
    }

    let query = supabase.from('tickets').select('status, resolved_at, created_at, satisfaction_rating, priority, room_id');
    if (roomIds) {
      query = query.in('room_id', roomIds);
    }

    const rows = (await unwrap(query)) as unknown as {
      status: string | null;
      resolved_at: string | null;
      created_at: string | null;
      satisfaction_rating: number | null;
      priority: string | null;
      room_id: number | null;
    }[];

    const stats = buildEmptyTicketStats();
    stats.total = rows.length;

    let resolutionHoursSum = 0;
    let resolutionCount = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const row of rows) {
      const status = mapTicketStatus.fromDb(row.status ?? 'new') as TicketStatus;

      if (status === 'Open') stats.open += 1;
      else if (status === 'InProgress') stats.inProgress += 1;
      else if (status === 'PendingConfirmation') stats.pendingConfirmation += 1;
      else if (status === 'Resolved') stats.resolved += 1;
      else if (status === 'Closed') stats.closed += 1;

      if (status === 'Open' || status === 'InProgress' || status === 'PendingConfirmation') {
        stats.active += 1;

        if (
          row.created_at &&
          isTicketReferenceOverdue({
            slaDeadline: getTicketReferenceDeadline(row.created_at, row.priority),
            status,
          })
        ) {
          stats.slaBreached += 1;
        }
      }

      if (row.created_at && row.resolved_at) {
        resolutionHoursSum +=
          (new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime()) / 3_600_000;
        resolutionCount += 1;
      }

      if (row.satisfaction_rating != null) {
        ratingSum += row.satisfaction_rating;
        ratingCount += 1;
      }
    }

    stats.avgResolutionTimeHours = resolutionCount > 0 ? Math.round(resolutionHoursSum / resolutionCount) : 0;
    stats.satisfactionRate = ratingCount > 0 ? ratingSum / ratingCount : 0;

    return stats;
  },

  async createTicket(ticket: CreateTicketInput): Promise<Ticket> {
    const parsedTicket = createTicketInputSchema.parse(ticket);
    const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
        priority: toDbPriority(parsedTicket.priority),
        status: toDbTicketStatus(parsedTicket.status ?? 'Open'),
        assigned_to: parsedTicket.assignedToId,
      })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.message.toLowerCase().includes('row-level security')) {
        throw new Error('Tài khoản hiện tại không có quyền tạo yêu cầu cho hồ sơ cư dân này.');
      }

      throw new Error(insertError.message);
    }

    if (attachments.length > 0 || parsedTicket.description.trim()) {
      const uploadedAttachments = attachments.length > 0 ? await uploadTicketAttachments(attachments, user.id) : [];

      await unwrap(
        supabase.from('ticket_comments').insert({
          ticket_id: newRow.id,
          author_id: user.id,
          content: parsedTicket.description.trim() || 'Đính kèm hình ảnh mô tả ban đầu.',
          is_internal: false,
          attachments: uploadedAttachments as unknown as Json,
        })
      );
    }

    return ticketService.getTicketDetail(String(newRow.id));
  },

  async updateTicketStatus(id: string, status: TicketStatus): Promise<boolean> {
    return ticketService.updateStatus(id, status);
  },

  async updateStatus(
    id: string,
    status: TicketStatus,
    resolution?: {
      notes?: string;
      resolutionNote?: string;
      rootCause?: string;
      cost?: number;
      rating?: number;
    }
  ): Promise<boolean> {
    const updates: Record<string, unknown> = {
      status: toDbTicketStatus(status),
      updated_at: new Date().toISOString(),
    };

    if (status === 'Resolved' || status === 'Closed') {
      updates.resolved_at = new Date().toISOString();
    } else {
      updates.resolved_at = null;
    }

    const resolutionNotes = composeResolutionNotes(resolution);
    if (resolutionNotes) {
      updates.resolution_notes = resolutionNotes;
    }

    if (resolution?.cost != null) {
      updates.resolution_cost = resolution.cost;
    }

    if (resolution?.rating != null) {
      updates.satisfaction_rating = resolution.rating;
    }

    await unwrap(supabase.from('tickets').update(updates).eq('id', Number(id)));
    return true;
  },

  async addComment(
    ticketId: string,
    content: string,
    isInternal: boolean = false,
    attachments: TicketAttachment[] = []
  ): Promise<TicketComment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const row = (await unwrap(
      supabase
        .from('ticket_comments')
        .insert({
          ticket_id: Number(ticketId),
          author_id: user?.id ?? null,
          content,
          is_internal: isInternal,
          attachments: attachments as unknown as Json,
        })
        .select(COMMENT_SELECT)
        .single()
    )) as unknown as DbTicketCommentRow;

    return mapDbCommentToTicketComment(row);
  },

  async assignTicket(ticketId: string, assigneeId: string | null): Promise<boolean> {
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

  async getStaff(): Promise<{ id: string; fullName: string; avatarUrl: string | null; role: string }[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .in('role', ['staff', 'owner'])
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    return data.map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      role: mapRole.fromDb(profile.role),
    }));
  },

  async getStaffRatings(
    staffId: string
  ): Promise<{ average: number; summary: Record<number, number>; list: StaffServiceRating[] }> {
    const rows = (await unwrap(
      supabase
        .from('tickets')
        .select(STAFF_RATING_SELECT)
        .eq('assigned_to', staffId)
        .not('satisfaction_rating', 'is', null)
        .order('updated_at', { ascending: false })
    )) as unknown as DbStaffRatingRow[];

    const summary: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let total = 0;
    let count = 0;

    const list = rows
      .filter((row) => row.satisfaction_rating != null)
      .map((row) => {
        const staffProfile = firstRecord(row.profiles);
        const tenant = firstRecord(row.tenants);
        const rating = Number(row.satisfaction_rating ?? 0);

        summary[rating] = (summary[rating] ?? 0) + 1;
        total += rating;
        count += 1;

        return {
          id: String(row.id),
          staffId: row.assigned_to ?? staffId,
          staffName: staffProfile?.full_name ?? 'Nhân viên SmartStay',
          staffAvatar: staffProfile?.avatar_url ?? undefined,
          staffRole: staffProfile?.role ? mapRole.fromDb(staffProfile.role) : 'Staff',
          rating,
          comment: undefined,
          tenantId: row.tenant_id ? String(row.tenant_id) : '',
          tenantName: tenant?.full_name ?? 'Cư dân SmartStay',
          ticketId: String(row.id),
          ticketCode: row.ticket_code,
          createdAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
        } satisfies StaffServiceRating;
      });

    return {
      average: count > 0 ? Number((total / count).toFixed(2)) : 0,
      summary,
      list,
    };
  },
};

export default ticketService;
