import { Asset, AssetCondition, AssetType } from '@/models/Asset';
import { mapAssetStatus } from '@/lib/enumMaps';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';

interface RoomAssetRow {
  id: number;
  room_id: number | null;
  status: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  last_maintenance: string | null;
  serial_number: string | null;
  quantity: number | null;
  assigned_at: string | null;
  is_billable: boolean | null;
  billing_label: string | null;
  monthly_charge: number | null;
  billing_start_date: string | null;
  billing_end_date: string | null;
  billing_status: string | null;
  billing_notes: string | null;
  broken_reported_at: string | null;
  assets: {
    id: number;
    name: string;
    qr_code: string | null;
    category: string | null;
    unit_cost: number | null;
    brand: string | null;
    model: string | null;
  } | null;
  rooms: {
    id: number;
    room_code: string;
    buildings: {
      name: string;
    } | null;
  } | null;
}

export interface AssignAssetOptions {
  isBillable?: boolean;
  monthlyCharge?: number;
  billingStartDate?: string;
  billingEndDate?: string | null;
  billingLabel?: string;
  billingStatus?: Asset['billingStatus'];
  billingNotes?: string;
}

function mapAssetCondition(dbStatus: string | null): AssetCondition {
  if (!dbStatus) return 'Good';
  const mapped = mapAssetStatus.fromDb(dbStatus);
  const valid: AssetCondition[] = ['New', 'Good', 'Fair', 'Poor'];
  return valid.includes(mapped as AssetCondition) ? (mapped as AssetCondition) : 'Good';
}

function mapAssetType(category: string | null): AssetType {
  if (!category) return 'Other';
  const lower = category.toLowerCase();
  if (lower.includes('furniture') || lower.includes('noi that')) return 'Furniture';
  if (lower.includes('appliance') || lower.includes('thiet bi')) return 'Appliance';
  if (lower.includes('electronic') || lower.includes('dien tu')) return 'Electronics';
  if (lower.includes('fixture') || lower.includes('co dinh')) return 'Fixture';
  return 'Other';
}

function mapBillingStatusFromDb(status: string | null): Asset['billingStatus'] {
  switch (status) {
    case 'active':
      return 'Active';
    case 'suspended':
      return 'Suspended';
    case 'stopped':
      return 'Stopped';
    default:
      return 'Inactive';
  }
}

function mapBillingStatusToDb(status: Asset['billingStatus'] | undefined): string | undefined {
  switch (status) {
    case 'Active':
      return 'active';
    case 'Suspended':
      return 'suspended';
    case 'Stopped':
      return 'stopped';
    case 'Inactive':
      return 'inactive';
    default:
      return undefined;
  }
}

function rowToAsset(row: RoomAssetRow): Asset {
  return {
    id: String(row.id),
    assetName: row.assets?.name ?? '',
    assetCode: row.assets?.qr_code ?? String(row.id),
    type: mapAssetType(row.assets?.category ?? null),
    condition: mapAssetCondition(row.status),
    roomId: row.rooms ? String(row.rooms.id) : undefined,
    roomCode: row.rooms?.room_code ?? undefined,
    buildingName: row.rooms?.buildings?.name ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    purchasePrice: row.assets?.unit_cost ?? undefined,
    warrantyExpiry: row.warranty_expiry ?? undefined,
    lastMaintenance: row.last_maintenance ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    brand: row.assets?.brand ?? undefined,
    model: row.assets?.model ?? undefined,
    quantity: row.quantity ?? 1,
    assignedAt: row.assigned_at ?? undefined,
    isBillable: row.is_billable ?? false,
    billingLabel: row.billing_label ?? undefined,
    monthlyCharge: row.monthly_charge ?? undefined,
    billingStartDate: row.billing_start_date ?? undefined,
    billingEndDate: row.billing_end_date ?? undefined,
    billingStatus: mapBillingStatusFromDb(row.billing_status),
    billingNotes: row.billing_notes ?? undefined,
    brokenReportedAt: row.broken_reported_at ?? undefined,
  };
}

const SELECT_QUERY = `
  id,
  room_id,
  status,
  purchase_date,
  warranty_expiry,
  last_maintenance,
  serial_number,
  quantity,
  assigned_at,
  is_billable,
  billing_label,
  monthly_charge,
  billing_start_date,
  billing_end_date,
  billing_status,
  billing_notes,
  broken_reported_at,
  assets (
    id,
    name,
    qr_code,
    category,
    unit_cost,
    brand,
    model
  ),
  rooms (
    id,
    room_code,
    buildings (
      name
    )
  )
`;

function buildRoomAssetPayload(data: Partial<Asset> & { roomId?: string | number }): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    room_id: data.roomId ? Number(data.roomId) : null,
    purchase_date: data.purchaseDate ?? null,
    warranty_expiry: data.warrantyExpiry ?? null,
    serial_number: data.serialNumber ?? null,
    quantity: Number(data.quantity ?? 1),
    status: mapAssetStatus.toDb(data.condition || 'Good'),
    assigned_at: data.roomId ? (data.assignedAt ?? data.billingStartDate ?? new Date().toISOString().slice(0, 10)) : null,
    is_billable: Boolean(data.isBillable),
    billing_label: data.billingLabel?.trim() || null,
    monthly_charge: Number(data.monthlyCharge ?? 0),
    billing_start_date: data.billingStartDate ?? null,
    billing_end_date: data.billingEndDate ?? null,
    billing_notes: data.billingNotes?.trim() || null,
    broken_reported_at: data.brokenReportedAt ?? null,
  };

  const mappedBillingStatus = mapBillingStatusToDb(data.billingStatus);
  if (mappedBillingStatus) {
    payload.billing_status = mappedBillingStatus;
  }

  if (data.condition === 'Poor' && data.isBillable) {
    payload.billing_status = payload.billing_status ?? 'suspended';
    payload.broken_reported_at = data.brokenReportedAt ?? new Date().toISOString();
  }

  return payload;
}

export const assetService = {
  getAssets: async (params?: {
    search?: string;
    type?: AssetType | string | null;
    status?: AssetCondition | string | null;
    roomId?: string | number;
    unassignedOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Asset[]> => {
    let query = (supabase as any)
      .from('room_assets')
      .select(SELECT_QUERY)
      .order('id', { ascending: false });

    if (params?.roomId) {
      query = query.eq('room_id', Number(params.roomId));
    } else if (params?.unassignedOnly) {
      query = query.is('room_id', null);
    }

    const rows = (await unwrap(query)) as RoomAssetRow[];

    let assets = rows.map(rowToAsset);

    if (params?.type && params.type !== 'All') {
      assets = assets.filter((asset) => asset.type === params.type);
    }

    if (params?.status && params.status !== 'All') {
      assets = assets.filter((asset) => asset.condition === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      assets = assets.filter(
        (asset) =>
          asset.assetName.toLowerCase().includes(search) ||
          asset.assetCode.toLowerCase().includes(search) ||
          asset.roomCode?.toLowerCase().includes(search) ||
          asset.serialNumber?.toLowerCase().includes(search) ||
          asset.brand?.toLowerCase().includes(search) ||
          asset.model?.toLowerCase().includes(search)
      );
    }

    if (params?.minPrice !== undefined) {
      const minPrice = params.minPrice;
      assets = assets.filter((asset) => (asset.purchasePrice || 0) >= minPrice);
    }

    if (params?.maxPrice !== undefined) {
      const maxPrice = params.maxPrice;
      assets = assets.filter((asset) => (asset.purchasePrice || 0) <= maxPrice);
    }

    if (params?.startDate) {
      const start = new Date(params.startDate);
      assets = assets.filter((asset) => (asset.purchaseDate ? new Date(asset.purchaseDate) >= start : false));
    }

    if (params?.endDate) {
      const end = new Date(params.endDate);
      assets = assets.filter((asset) => (asset.purchaseDate ? new Date(asset.purchaseDate) <= end : false));
    }

    if (params?.sortBy) {
      const order = params.sortOrder === 'desc' ? -1 : 1;
      assets.sort((left, right) => {
        const leftValue = (left as unknown as Record<string, unknown>)[params.sortBy!] ?? '';
        const rightValue = (right as unknown as Record<string, unknown>)[params.sortBy!] ?? '';

        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
          return (leftValue - rightValue) * order;
        }

        return String(leftValue).localeCompare(String(rightValue)) * order;
      });
    }

    return assets;
  },

  getAssetDetail: async (id: string | number): Promise<Asset | null> => {
    const row = (await unwrap(
      (supabase as any)
        .from('room_assets')
        .select(SELECT_QUERY)
        .eq('id', Number(id))
        .maybeSingle()
    )) as RoomAssetRow | null;

    return row ? rowToAsset(row) : null;
  },

  createAsset: async (data: Partial<Asset> & { assetId?: number; roomId?: string | number }): Promise<Asset> => {
    let assetId = data.assetId;

    if (!assetId) {
      const assetDefinition = (await unwrap(
        (supabase as any)
          .from('assets')
          .insert({
            name: data.assetName || 'Tai san moi',
            category: data.type || 'Other',
            unit_cost: data.purchasePrice || 0,
            brand: data.brand || null,
            model: data.model || null,
            qr_code: data.assetCode || null,
          })
          .select('id')
          .single()
      )) as { id: number };
      assetId = assetDefinition.id;
    }

    const row = (await unwrap(
      (supabase as any)
        .from('room_assets')
        .insert({
          asset_id: assetId,
          ...buildRoomAssetPayload(data),
        })
        .select(SELECT_QUERY)
        .single()
    )) as RoomAssetRow;

    return rowToAsset(row);
  },

  assignAssetsToRoom: async (
    assetIds: Array<string | number>,
    roomId: string | number,
    options?: AssignAssetOptions
  ): Promise<boolean> => {
    const updatePayload: Record<string, unknown> = {
      room_id: Number(roomId),
      assigned_at: options?.billingStartDate ?? new Date().toISOString().slice(0, 10),
      is_billable: Boolean(options?.isBillable),
      monthly_charge: Number(options?.monthlyCharge ?? 0),
      billing_label: options?.billingLabel?.trim() || null,
      billing_start_date: options?.billingStartDate ?? null,
      billing_end_date: options?.billingEndDate ?? null,
      billing_notes: options?.billingNotes?.trim() || null,
    };

    const mappedBillingStatus = mapBillingStatusToDb(options?.billingStatus);
    if (mappedBillingStatus) {
      updatePayload.billing_status = mappedBillingStatus;
    }

    await unwrap(
      (supabase as any)
        .from('room_assets')
        .update(updatePayload)
        .in(
          'id',
          assetIds.map((id) => Number(id))
        )
    );

    return true;
  },

  updateAsset: async (id: string | number, data: Partial<Asset>): Promise<Asset> => {
    const updatePayload: Record<string, unknown> = {};
    if (data.purchaseDate !== undefined) updatePayload.purchase_date = data.purchaseDate;
    if (data.warrantyExpiry !== undefined) updatePayload.warranty_expiry = data.warrantyExpiry;
    if (data.serialNumber !== undefined) updatePayload.serial_number = data.serialNumber;
    if (data.quantity !== undefined) updatePayload.quantity = Number(data.quantity);
    if (data.condition !== undefined) updatePayload.status = mapAssetStatus.toDb(data.condition);
    if (data.roomId !== undefined) updatePayload.room_id = data.roomId ? Number(data.roomId) : null;
    if (data.assignedAt !== undefined) updatePayload.assigned_at = data.assignedAt;
    if (data.isBillable !== undefined) updatePayload.is_billable = data.isBillable;
    if (data.billingLabel !== undefined) updatePayload.billing_label = data.billingLabel?.trim() || null;
    if (data.monthlyCharge !== undefined) updatePayload.monthly_charge = Number(data.monthlyCharge ?? 0);
    if (data.billingStartDate !== undefined) updatePayload.billing_start_date = data.billingStartDate || null;
    if (data.billingEndDate !== undefined) updatePayload.billing_end_date = data.billingEndDate || null;
    if (data.billingNotes !== undefined) updatePayload.billing_notes = data.billingNotes?.trim() || null;
    if (data.brokenReportedAt !== undefined) updatePayload.broken_reported_at = data.brokenReportedAt || null;

    const mappedBillingStatus = mapBillingStatusToDb(data.billingStatus);
    if (mappedBillingStatus) {
      updatePayload.billing_status = mappedBillingStatus;
    }

    if (data.condition === 'Poor' && data.isBillable !== false) {
      updatePayload.billing_status = updatePayload.billing_status ?? 'suspended';
      updatePayload.broken_reported_at = data.brokenReportedAt ?? new Date().toISOString();
    }

    const roomAsset = await unwrap(
      (supabase as any)
        .from('room_assets')
        .update(updatePayload)
        .eq('id', Number(id))
        .select('asset_id')
        .single()
    ) as { asset_id: number | null };

    if (
      roomAsset.asset_id &&
      (data.assetName !== undefined ||
        data.assetCode !== undefined ||
        data.type !== undefined ||
        data.purchasePrice !== undefined ||
        data.brand !== undefined ||
        data.model !== undefined)
    ) {
      const assetUpdate: Record<string, unknown> = {};
      if (data.assetName !== undefined) assetUpdate.name = data.assetName;
      if (data.assetCode !== undefined) assetUpdate.qr_code = data.assetCode;
      if (data.type !== undefined) assetUpdate.category = data.type;
      if (data.purchasePrice !== undefined) assetUpdate.unit_cost = Number(data.purchasePrice);
      if (data.brand !== undefined) assetUpdate.brand = data.brand;
      if (data.model !== undefined) assetUpdate.model = data.model;

      await unwrap(
        (supabase as any)
          .from('assets')
          .update(assetUpdate)
          .eq('id', roomAsset.asset_id)
      );
    }

    const updatedRow = (await unwrap(
      (supabase as any)
        .from('room_assets')
        .select(SELECT_QUERY)
        .eq('id', Number(id))
        .single()
    )) as RoomAssetRow;

    return rowToAsset(updatedRow);
  },

  deleteAsset: async (id: string | number): Promise<boolean> => {
    await unwrap(
      (supabase as any)
        .from('room_assets')
        .delete()
        .eq('id', Number(id))
    );
    return true;
  },
};
