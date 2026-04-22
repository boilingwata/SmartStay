import { mapAssetStatus } from '@/lib/enumMaps';
import { mapAssetCondition, mapAssetType, mapBillingStatusFromDb, mapBillingStatusToDb } from '@/lib/assetMappers';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { Asset, AssetCondition, AssetType } from '@/models/Asset';

type AssetRecordKind = 'asset' | 'room-asset';

interface AssetDefinitionRow {
  id: number;
  name: string;
  qr_code: string | null;
  category: string | null;
  unit_cost: number | null;
  brand: string | null;
  model: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface RoomAssetRow {
  id: number;
  asset_id: number;
  room_id: number | null;
  status: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  last_maintenance: string | null;
  serial_number: string | null;
  quantity: number | null;
  assigned_at: string | null;
  removed_at: string | null;
  is_billable: boolean | null;
  billing_label: string | null;
  monthly_charge: number | null;
  billing_start_date: string | null;
  billing_end_date: string | null;
  billing_status: string | null;
  billing_notes: string | null;
  broken_reported_at: string | null;
  created_at: string | null;
  assets: AssetDefinitionRow | null;
  rooms: {
    id: number;
    building_id: number;
    room_code: string;
    buildings: {
      name: string;
    } | null;
  } | null;
}

export interface AssetQueryParams {
  search?: string;
  type?: AssetType | string | null;
  status?: AssetCondition | string | null;
  roomId?: string | number;
  buildingId?: string | number | null;
  unassignedOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssignableAssetParams {
  roomId?: string | number;
  search?: string;
  type?: AssetType | string | null;
  status?: AssetCondition | string | null;
  buildingId?: string | number | null;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

const ASSET_SELECT_QUERY = `
  id,
  name,
  qr_code,
  category,
  unit_cost,
  brand,
  model,
  description,
  created_at,
  updated_at
`;

const ROOM_ASSET_SELECT_QUERY = `
  id,
  asset_id,
  room_id,
  status,
  purchase_date,
  warranty_expiry,
  last_maintenance,
  serial_number,
  quantity,
  assigned_at,
  removed_at,
  is_billable,
  billing_label,
  monthly_charge,
  billing_start_date,
  billing_end_date,
  billing_status,
  billing_notes,
  broken_reported_at,
  created_at,
  assets (
    ${ASSET_SELECT_QUERY}
  ),
  rooms (
    id,
    building_id,
    room_code,
    buildings (
      name
    )
  )
`;

function toRecordId(kind: AssetRecordKind, id: number): string {
  return `${kind}:${id}`;
}

function parseRecordId(id: string | number): { kind: AssetRecordKind; id: number } {
  if (typeof id === 'number') {
    return { kind: 'room-asset', id };
  }

  if (id.startsWith('asset:')) {
    return { kind: 'asset', id: Number(id.slice('asset:'.length)) };
  }

  if (id.startsWith('room-asset:')) {
    return { kind: 'room-asset', id: Number(id.slice('room-asset:'.length)) };
  }

  if (id.startsWith('room_asset:')) {
    return { kind: 'room-asset', id: Number(id.slice('room_asset:'.length)) };
  }

  return { kind: 'room-asset', id: Number(id) };
}

function toNumericId(value: string | number | null | undefined): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function roomAssetRowToAsset(row: RoomAssetRow): Asset {
  return {
    id: toRecordId('room-asset', row.id),
    assetId: String(row.asset_id),
    roomAssetId: String(row.id),
    assignmentState: row.room_id ? 'Assigned' : 'Unassigned',
    assetName: row.assets?.name ?? '',
    assetCode: row.assets?.qr_code ?? undefined,
    type: mapAssetType(row.assets?.category ?? null),
    condition: mapAssetCondition(row.status),
    buildingId: row.rooms?.building_id ? String(row.rooms.building_id) : undefined,
    roomId: row.rooms ? String(row.rooms.id) : undefined,
    roomCode: row.rooms?.room_code ?? undefined,
    buildingName: row.rooms?.buildings?.name ?? undefined,
    createdAt: row.created_at ?? row.assets?.created_at ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    purchasePrice: row.assets?.unit_cost ?? undefined,
    warrantyExpiry: row.warranty_expiry ?? undefined,
    lastMaintenance: row.last_maintenance ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    brand: row.assets?.brand ?? undefined,
    model: row.assets?.model ?? undefined,
    quantity: row.quantity ?? 1,
    description: row.assets?.description ?? undefined,
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

function assetDefinitionRowToAsset(row: AssetDefinitionRow): Asset {
  return {
    id: toRecordId('asset', row.id),
    assetId: String(row.id),
    assignmentState: 'Unassigned',
    assetName: row.name,
    assetCode: row.qr_code ?? undefined,
    type: mapAssetType(row.category),
    condition: 'New',
    createdAt: row.created_at ?? undefined,
    purchasePrice: row.unit_cost ?? undefined,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    quantity: 1,
    description: row.description ?? undefined,
    isBillable: false,
    billingStatus: 'Inactive',
  };
}

function buildAssetDefinitionPayload(data: Partial<Asset>, requireName = false): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (requireName || data.assetName !== undefined) {
    payload.name = data.assetName?.trim() || 'Tai san moi';
  }
  if (data.assetCode !== undefined) {
    payload.qr_code = data.assetCode?.trim() || null;
  }
  if (data.type !== undefined) {
    payload.category = data.type;
  }
  if (data.purchasePrice !== undefined) {
    payload.unit_cost = Number(data.purchasePrice ?? 0);
  }
  if (data.brand !== undefined) {
    payload.brand = data.brand?.trim() || null;
  }
  if (data.model !== undefined) {
    payload.model = data.model?.trim() || null;
  }
  if (data.description !== undefined) {
    payload.description = data.description?.trim() || null;
  }

  return payload;
}

function buildRoomAssetPayload(data: Omit<Partial<Asset>, 'roomId'> & { roomId?: string | number }): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.roomId !== undefined) {
    const roomId = toNumericId(data.roomId);
    payload.room_id = roomId;
    payload.assigned_at = roomId ? (data.assignedAt ?? data.billingStartDate ?? new Date().toISOString().slice(0, 10)) : null;
  } else if (data.assignedAt !== undefined) {
    payload.assigned_at = data.assignedAt || null;
  }

  if (data.purchaseDate !== undefined) payload.purchase_date = data.purchaseDate || null;
  if (data.warrantyExpiry !== undefined) payload.warranty_expiry = data.warrantyExpiry || null;
  if (data.lastMaintenance !== undefined) payload.last_maintenance = data.lastMaintenance || null;
  if (data.serialNumber !== undefined) payload.serial_number = data.serialNumber?.trim() || null;
  if (data.quantity !== undefined) payload.quantity = Number(data.quantity ?? 1);
  if (data.condition !== undefined) payload.status = mapAssetStatus.toDb(data.condition);
  if (data.brokenReportedAt !== undefined) payload.broken_reported_at = data.brokenReportedAt || null;

  if (data.isBillable !== undefined) {
    const isBillable = Boolean(data.isBillable);
    payload.is_billable = isBillable;
    payload.billing_label = isBillable ? data.billingLabel?.trim() || null : null;
    payload.monthly_charge = isBillable ? Number(data.monthlyCharge ?? 0) : 0;
    payload.billing_start_date = isBillable ? data.billingStartDate || null : null;
    payload.billing_end_date = isBillable ? data.billingEndDate || null : null;
    payload.billing_notes = isBillable ? data.billingNotes?.trim() || null : null;
    payload.billing_status = isBillable ? mapBillingStatusToDb(data.billingStatus) ?? 'active' : 'inactive';

    if (data.condition === 'Poor' && isBillable) {
      payload.billing_status = payload.billing_status ?? 'suspended';
      payload.broken_reported_at = data.brokenReportedAt ?? new Date().toISOString();
    }
  } else {
    if (data.billingLabel !== undefined) payload.billing_label = data.billingLabel?.trim() || null;
    if (data.monthlyCharge !== undefined) payload.monthly_charge = Number(data.monthlyCharge ?? 0);
    if (data.billingStartDate !== undefined) payload.billing_start_date = data.billingStartDate || null;
    if (data.billingEndDate !== undefined) payload.billing_end_date = data.billingEndDate || null;
    if (data.billingNotes !== undefined) payload.billing_notes = data.billingNotes?.trim() || null;

    const billingStatus = mapBillingStatusToDb(data.billingStatus);
    if (billingStatus) {
      payload.billing_status = billingStatus;
    }
  }

  return payload;
}

function applyCommonFilters(assets: Asset[], params?: AssetQueryParams | AssignableAssetParams): Asset[] {
  let filtered = assets;

  if (params?.type && params.type !== 'All') {
    filtered = filtered.filter((asset) => asset.type === params.type);
  }

  if ('status' in (params ?? {}) && params?.status && params.status !== 'All') {
    filtered = filtered.filter((asset) => asset.condition === params.status);
  }

  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter((asset) =>
      [
        asset.assetName,
        asset.assetCode,
        asset.roomCode,
        asset.serialNumber,
        asset.brand,
        asset.model,
        asset.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }

  if ('minPrice' in (params ?? {}) && params?.minPrice !== undefined) {
    filtered = filtered.filter((asset) => (asset.purchasePrice || 0) >= params.minPrice!);
  }

  if ('maxPrice' in (params ?? {}) && params?.maxPrice !== undefined) {
    filtered = filtered.filter((asset) => (asset.purchasePrice || 0) <= params.maxPrice!);
  }

  if ('startDate' in (params ?? {}) && params?.startDate) {
    const start = new Date(params.startDate);
    filtered = filtered.filter((asset) => (asset.purchaseDate ? new Date(asset.purchaseDate) >= start : false));
  }

  if ('endDate' in (params ?? {}) && params?.endDate) {
    const end = new Date(params.endDate);
    filtered = filtered.filter((asset) => (asset.purchaseDate ? new Date(asset.purchaseDate) <= end : false));
  }

  if ('buildingId' in (params ?? {}) && params?.buildingId != null && params.buildingId !== '') {
    const buildingId = String(params.buildingId);
    filtered = filtered.filter((asset) => !asset.buildingId || asset.buildingId === buildingId);
  }

  return filtered;
}

function applySort(assets: Asset[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Asset[] {
  const order = sortOrder === 'desc' ? -1 : 1;
  const sorted = [...assets];

  sorted.sort((left, right) => {
    if (sortBy === 'createdAt') {
      const leftValue = left.createdAt ?? '';
      const rightValue = right.createdAt ?? '';
      return leftValue.localeCompare(rightValue) * order;
    }

    if (sortBy === 'id') {
      const leftValue = Number(parseRecordId(left.id).id);
      const rightValue = Number(parseRecordId(right.id).id);
      return (leftValue - rightValue) * order;
    }

    const leftValue = (left as unknown as Record<string, unknown>)[sortBy || 'createdAt'] ?? '';
    const rightValue = (right as unknown as Record<string, unknown>)[sortBy || 'createdAt'] ?? '';

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * order;
    }

    return String(leftValue).localeCompare(String(rightValue)) * order;
  });

  return sorted;
}

async function fetchAssetDefinition(assetId: number): Promise<AssetDefinitionRow> {
  return (await unwrap(
    supabase
      .from('assets')
      .select(ASSET_SELECT_QUERY)
      .eq('id', assetId)
      .single(),
  )) as AssetDefinitionRow;
}

export const assetService = {
  getAssets: async (params?: AssetQueryParams): Promise<Asset[]> => {
    if (params?.unassignedOnly) {
      return assetService.getAssignableAssets({
        roomId: params.roomId,
        search: params.search,
        type: params.type,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });
    }

    if (params?.roomId) {
      const roomId = toNumericId(params.roomId);
      const rows = (await unwrap(
        supabase
          .from('room_assets')
          .select(ROOM_ASSET_SELECT_QUERY)
          .eq('room_id', roomId)
          .order('id', { ascending: false }),
      )) as RoomAssetRow[];

      const assets = rows
        .filter((row) => !row.removed_at)
        .map(roomAssetRowToAsset);

      return applySort(applyCommonFilters(assets, params), params?.sortBy, params?.sortOrder);
    }

    const [roomAssetRows, assetRows] = await Promise.all([
      unwrap(
        supabase
          .from('room_assets')
          .select(ROOM_ASSET_SELECT_QUERY)
          .order('id', { ascending: false }),
      ) as Promise<RoomAssetRow[]>,
      unwrap(
        supabase
          .from('assets')
          .select(ASSET_SELECT_QUERY)
          .order('id', { ascending: false }),
      ) as Promise<AssetDefinitionRow[]>,
    ]);

    const activeRoomAssets = roomAssetRows.filter((row) => !row.removed_at);
    const assignedAssetIds = new Set(activeRoomAssets.map((row) => row.asset_id));
    const standaloneAssets = assetRows.filter((row) => !assignedAssetIds.has(row.id));

    const combinedAssets = [
      ...activeRoomAssets.map(roomAssetRowToAsset),
      ...standaloneAssets.map(assetDefinitionRowToAsset),
    ];

    return applySort(applyCommonFilters(combinedAssets, params), params?.sortBy, params?.sortOrder);
  },

  getAssignableAssets: async (params?: AssignableAssetParams): Promise<Asset[]> => {
    const [assetRows, roomAssetRows] = await Promise.all([
      unwrap(
        supabase
          .from('assets')
          .select(ASSET_SELECT_QUERY)
          .order('name', { ascending: true }),
      ) as Promise<AssetDefinitionRow[]>,
      params?.roomId
        ? (unwrap(
            supabase
              .from('room_assets')
              .select('asset_id')
              .eq('room_id', Number(params.roomId))
              .is('removed_at', null),
          ) as Promise<Array<{ asset_id: number }>>)
        : Promise.resolve([]),
    ]);

    const excludedAssetIds = new Set(roomAssetRows.map((row) => row.asset_id));
    const assignableAssets = assetRows
      .filter((row) => !excludedAssetIds.has(row.id))
      .map(assetDefinitionRowToAsset);

    return applySort(applyCommonFilters(assignableAssets, params), params?.sortBy ?? 'assetName', params?.sortOrder ?? 'asc');
  },

  getAssetDetail: async (id: string | number): Promise<Asset | null> => {
    const record = parseRecordId(id);

    if (!Number.isFinite(record.id)) {
      return null;
    }

    if (record.kind === 'asset') {
      const row = (await unwrap(
        supabase
          .from('assets')
          .select(ASSET_SELECT_QUERY)
          .eq('id', record.id)
          .maybeSingle(),
      )) as AssetDefinitionRow | null;

      return row ? assetDefinitionRowToAsset(row) : null;
    }

    const row = (await unwrap(
      supabase
        .from('room_assets')
        .select(ROOM_ASSET_SELECT_QUERY)
        .eq('id', record.id)
        .maybeSingle(),
    )) as RoomAssetRow | null;

    return row ? roomAssetRowToAsset(row) : null;
  },

  createAsset: async (data: Partial<Asset> & { assetId?: number; roomId?: string | number }): Promise<Asset> => {
    const assetId = data.assetId ? Number(data.assetId) : null;

    const assetDefinition = assetId
      ? await fetchAssetDefinition(assetId)
      : ((await unwrap(
          supabase
            .from('assets')
            .insert(buildAssetDefinitionPayload(data, true))
            .select(ASSET_SELECT_QUERY)
            .single(),
        )) as AssetDefinitionRow);

    if (!data.roomId) {
      return assetDefinitionRowToAsset(assetDefinition);
    }

    const roomAssetRow = (await unwrap(
      supabase
        .from('room_assets')
        .insert({
          asset_id: assetDefinition.id,
          ...buildRoomAssetPayload(data),
        })
        .select(ROOM_ASSET_SELECT_QUERY)
        .single(),
    )) as RoomAssetRow;

    return roomAssetRowToAsset(roomAssetRow);
  },

  assignAssetsToRoom: async (
    assetIds: Array<string | number>,
    roomId: string | number,
    options?: AssignAssetOptions,
  ): Promise<boolean> => {
    const roomAssetIds: number[] = [];
    const assetDefinitionIds: number[] = [];

    for (const rawId of assetIds) {
      const record = parseRecordId(rawId);
      if (!Number.isFinite(record.id)) continue;

      if (record.kind === 'asset') {
        assetDefinitionIds.push(record.id);
      } else {
        roomAssetIds.push(record.id);
      }
    }

    const basePayload = buildRoomAssetPayload({
      roomId,
      condition: 'Good',
      quantity: 1,
      isBillable: options?.isBillable ?? false,
      monthlyCharge: options?.monthlyCharge,
      billingStartDate: options?.billingStartDate,
      billingEndDate: options?.billingEndDate ?? undefined,
      billingLabel: options?.billingLabel,
      billingStatus: options?.billingStatus ?? (options?.isBillable ? 'Active' : 'Inactive'),
      billingNotes: options?.billingNotes,
    });

    if (roomAssetIds.length > 0) {
      await unwrap(
        supabase
          .from('room_assets')
          .update(basePayload)
          .in('id', roomAssetIds),
      );
    }

    if (assetDefinitionIds.length > 0) {
      const rowsToInsert = assetDefinitionIds.map((assetId) => ({
        asset_id: assetId,
        ...basePayload,
      }));

      await unwrap(
        supabase
          .from('room_assets')
          .insert(rowsToInsert),
      );
    }

    return true;
  },

  updateAsset: async (id: string | number, data: Partial<Asset>): Promise<Asset> => {
    const record = parseRecordId(id);
    const assetUpdate = buildAssetDefinitionPayload(data);
    const roomAssetUpdate = buildRoomAssetPayload(data);

    if (record.kind === 'asset') {
      if (Object.keys(assetUpdate).length > 0) {
        await unwrap(
          supabase
            .from('assets')
            .update(assetUpdate)
            .eq('id', record.id),
        );
      }

      const updatedAsset = await assetService.getAssetDetail(toRecordId('asset', record.id));
      if (!updatedAsset) throw new Error('Không tìm thấy tài sản sau khi cập nhật.');
      return updatedAsset;
    }

    const roomAssetMeta =
      Object.keys(roomAssetUpdate).length > 0
        ? ((await unwrap(
            supabase
              .from('room_assets')
              .update(roomAssetUpdate)
              .eq('id', record.id)
              .select('asset_id')
              .single(),
          )) as { asset_id: number })
        : ((await unwrap(
            supabase
              .from('room_assets')
              .select('asset_id')
              .eq('id', record.id)
              .single(),
          )) as { asset_id: number });

    if (Object.keys(assetUpdate).length > 0) {
      await unwrap(
        supabase
          .from('assets')
          .update(assetUpdate)
          .eq('id', roomAssetMeta.asset_id),
      );
    }

    const updatedRoomAsset = await assetService.getAssetDetail(toRecordId('room-asset', record.id));
    if (!updatedRoomAsset) throw new Error('Không tìm thấy tài sản sau khi cập nhật.');
    return updatedRoomAsset;
  },

  deleteAsset: async (id: string | number): Promise<boolean> => {
    const record = parseRecordId(id);

    if (record.kind === 'asset') {
      const linkedRows = (await unwrap(
        supabase
          .from('room_assets')
          .select('id')
          .eq('asset_id', record.id)
          .limit(1),
      )) as Array<{ id: number }>;

      if (linkedRows.length > 0) {
        throw new Error('Tài sản này đang được gán vào phòng và chưa thể xóa khỏi catalog.');
      }

      await unwrap(
        supabase
          .from('assets')
          .delete()
          .eq('id', record.id),
      );

      return true;
    }

    await unwrap(
      supabase
        .from('room_assets')
        .delete()
        .eq('id', record.id),
    );

    return true;
  },
};
