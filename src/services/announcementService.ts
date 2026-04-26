import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementStatus,
  AnnouncementTargetGroup,
  AnnouncementType,
} from '@/types/announcement';
import {
  ANNOUNCEMENT_STATUS_FROM_DB,
  ANNOUNCEMENT_STATUS_TO_DB,
  ANNOUNCEMENT_TARGET_GROUP_FROM_DB,
  ANNOUNCEMENT_TARGET_GROUP_TO_DB,
  ANNOUNCEMENT_TYPE_FROM_DB,
  ANNOUNCEMENT_TYPE_TO_DB,
} from '@/types/announcement';

type AnnouncementRow = Database['smartstay']['Tables']['announcements']['Row'];

function mapAnnouncementStatus(value: string): AnnouncementStatus {
  return ANNOUNCEMENT_STATUS_FROM_DB[value] || 'Draft';
}

function mapAnnouncementType(value: string): AnnouncementType {
  return ANNOUNCEMENT_TYPE_FROM_DB[value] || 'General';
}

function mapAnnouncementTargetGroups(value: string[]): AnnouncementTargetGroup[] {
  return value
    .map((group) => ANNOUNCEMENT_TARGET_GROUP_FROM_DB[group])
    .filter((group): group is AnnouncementTargetGroup => Boolean(group));
}

function mapAnnouncementRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    type: mapAnnouncementType(row.type),
    status: mapAnnouncementStatus(row.status),
    publishAt: row.publish_at,
    targetGroups: mapAnnouncementTargetGroups(row.target_groups),
    buildingIds: row.building_ids.map((value) => String(value)),
    isPinned: row.is_pinned,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeBuildingIds(buildingIds: string[]): number[] {
  if (buildingIds.length === 0 || buildingIds.some((value) => value.toLowerCase() === 'all')) {
    return [];
  }

  return Array.from(
    new Set(
      buildingIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

function normalizeTargetGroups(targetGroups: AnnouncementTargetGroup[]): string[] {
  const groups = Array.from(
    new Set(targetGroups.map((group) => ANNOUNCEMENT_TARGET_GROUP_TO_DB[group]).filter(Boolean)),
  );

  if (groups.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một nhóm nhận thông báo.');
  }

  return groups;
}

function normalizePublishAt(status: AnnouncementStatus, publishAt: string | null): string | null {
  if (status === 'Draft' || status === 'Archived') {
    return null;
  }

  if (status === 'Published') {
    const candidate = publishAt ? new Date(publishAt) : new Date();
    if (Number.isNaN(candidate.getTime())) {
      throw new Error('Thời điểm hiển thị thông báo không hợp lệ.');
    }

    return candidate.toISOString();
  }

  if (!publishAt) {
    throw new Error('Vui lòng chọn ngày giờ phát cho thông báo hẹn giờ.');
  }

  const candidate = new Date(publishAt);
  if (Number.isNaN(candidate.getTime())) {
    throw new Error('Ngày giờ phát thông báo không hợp lệ.');
  }

  return candidate.toISOString();
}

function buildPayload(input: AnnouncementInput) {
  const title = input.title.trim();
  const content = input.content.trim();

  if (!title) {
    throw new Error('Tiêu đề thông báo không được để trống.');
  }

  if (!content) {
    throw new Error('Nội dung thông báo không được để trống.');
  }

  return {
    title,
    content,
    type: ANNOUNCEMENT_TYPE_TO_DB[input.type],
    status: ANNOUNCEMENT_STATUS_TO_DB[input.status],
    publish_at: normalizePublishAt(input.status, input.publishAt),
    is_pinned: input.isPinned,
    target_groups: normalizeTargetGroups(input.targetGroups),
    building_ids: normalizeBuildingIds(input.buildingIds),
  };
}

async function getCurrentProfileId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export const announcementService = {
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('publish_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Không thể tải danh sách thông báo.');
    }

    return ((data ?? []) as AnnouncementRow[]).map(mapAnnouncementRow);
  },

  async getAnnouncementDetail(id: string): Promise<Announcement | undefined> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Không thể tải chi tiết thông báo.');
    }

    return data ? mapAnnouncementRow(data as AnnouncementRow) : undefined;
  },

  async createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
    const payload = buildPayload(input);
    const createdBy = await getCurrentProfileId();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...payload,
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Không thể tạo thông báo.');
    }

    return mapAnnouncementRow(data as AnnouncementRow);
  },

  async updateAnnouncement(id: string, input: AnnouncementInput): Promise<Announcement> {
    const payload = buildPayload(input);
    const { data, error } = await supabase
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Không thể cập nhật thông báo.');
    }

    return mapAnnouncementRow(data as AnnouncementRow);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').delete().eq('id', id);

    if (error) {
      throw new Error(error.message || 'Không thể xóa thông báo.');
    }
  },
};

export default announcementService;
