import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { AnnouncementType, PortalAnnouncement } from '@/types/announcement';
import {
  ANNOUNCEMENT_TYPE_FROM_DB,
  ANNOUNCEMENT_TYPE_OPTIONS,
  ANNOUNCEMENT_TYPE_TO_DB,
  getAnnouncementSummary,
} from '@/types/announcement';

type AnnouncementRow = Database['smartstay']['Tables']['announcements']['Row'];

function mapPortalRow(row: AnnouncementRow): PortalAnnouncement {
  const type = ANNOUNCEMENT_TYPE_FROM_DB[row.type] || 'General';

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: getAnnouncementSummary(row.content),
    type,
    status: 'Published',
    publishAt: row.publish_at,
    targetGroups: [],
    buildingIds: row.building_ids.map((value) => String(value)),
    isPinned: row.is_pinned,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isAnnouncementType(value?: string): value is AnnouncementType {
  return ANNOUNCEMENT_TYPE_OPTIONS.includes(value as AnnouncementType);
}

export const portalAnnouncementService = {
  async getAnnouncements(params?: { type?: string }): Promise<{ items: PortalAnnouncement[] }> {
    let query = supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('publish_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    const requestedType = params?.type;
    if (requestedType && requestedType !== 'all' && requestedType !== 'pinned' && isAnnouncementType(requestedType)) {
      query = query.eq('type', ANNOUNCEMENT_TYPE_TO_DB[requestedType]);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Không thể tải bản tin cư dân.');
    }

    const items = ((data ?? []) as AnnouncementRow[]).map(mapPortalRow);
    if (requestedType === 'pinned') {
      return { items: items.filter((item) => item.isPinned) };
    }

    return { items };
  },
};

export default portalAnnouncementService;
