import { Asset, AssetType, AssetCondition } from '@/models/Asset';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapAssetStatus } from '@/lib/enumMaps';
import type { DbAssetStatus } from '@/types/supabase';

// Shape returned by the joined query aligned with smartstay schema
interface RoomAssetRow {
  id: number;
  status: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  last_maintenance: string | null;
  serial_number: string | null;
  quantity: number | null;
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

function mapAssetCondition(dbStatus: string | null): AssetCondition {
  if (!dbStatus) return 'Good';
  const mapped = mapAssetStatus.fromDb(dbStatus);
  const valid: AssetCondition[] = ['New', 'Good', 'Fair', 'Poor'];
  return valid.includes(mapped as AssetCondition) ? (mapped as AssetCondition) : 'Good';
}

function mapAssetType(category: string | null): AssetType {
  if (!category) return 'Other';
  const lower = category.toLowerCase();
  if (lower.includes('furniture') || lower.includes('nội thất')) return 'Furniture';
  if (lower.includes('appliance') || lower.includes('thiết bị')) return 'Appliance';
  if (lower.includes('electronic') || lower.includes('điện tử')) return 'Electronics';
  if (lower.includes('fixture') || lower.includes('cố định')) return 'Fixture';
  return 'Other';
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
  };
}

const SELECT_QUERY = `
  id, 
  status, 
  purchase_date, 
  warranty_expiry, 
  last_maintenance, 
  serial_number, 
  quantity,
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
    let query = supabase
      .from('room_assets')
      .select(SELECT_QUERY)
      .order('id', { ascending: false });

    if (params?.roomId) {
      query = query.eq('room_id', Number(params.roomId));
    } else if (params?.unassignedOnly) {
      query = query.is('room_id', null);
    }

    const rows = await unwrap(query) as unknown as RoomAssetRow[];

    let assets = rows.map(rowToAsset);

    // Filter by type
    if (params?.type && params.type !== 'All') {
      assets = assets.filter(a => a.type === params.type);
    }

    // Filter by status (Condition)
    if (params?.status && params.status !== 'All') {
      assets = assets.filter(a => a.condition === params.status);
    }

    // Filter by Search
    if (params?.search) {
      const s = params.search.toLowerCase();
      assets = assets.filter(
        a => a.assetName.toLowerCase().includes(s) || 
             a.assetCode.toLowerCase().includes(s) ||
             a.roomCode?.toLowerCase().includes(s) ||
             a.serialNumber?.toLowerCase().includes(s) ||
             a.brand?.toLowerCase().includes(s) ||
             a.model?.toLowerCase().includes(s)
      );
    }

    // Range: Price
    if (params?.minPrice !== undefined) {
      assets = assets.filter(a => (a.purchasePrice || 0) >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      assets = assets.filter(a => (a.purchasePrice || 0) <= params.maxPrice!);
    }

    // Range: Date
    if (params?.startDate) {
      const start = new Date(params.startDate);
      assets = assets.filter(a => a.purchaseDate ? new Date(a.purchaseDate) >= start : false);
    }
    if (params?.endDate) {
      const end = new Date(params.endDate);
      assets = assets.filter(a => a.purchaseDate ? new Date(a.purchaseDate) <= end : false);
    }

    // Sorting
    if (params?.sortBy) {
      const order = params.sortOrder === 'desc' ? -1 : 1;
      assets.sort((a: any, b: any) => {
        const valA = (a as any)[params.sortBy!] ?? '';
        const valB = (b as any)[params.sortBy!] ?? '';
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * order;
        }
        return String(valA).localeCompare(String(valB)) * order;
      });
    }

    return assets;
  },

  getAssetDetail: async (id: string | number): Promise<Asset | null> => {
    const row = await unwrap(
      supabase
        .from('room_assets')
        .select(SELECT_QUERY)
        .eq('id', Number(id))
        .maybeSingle()
    ) as unknown as RoomAssetRow | null;

    return row ? rowToAsset(row) : null;
  },

  createAsset: async (data: Partial<Asset> & { assetId?: number; roomId?: string | number }): Promise<Asset> => {
    // 1. Create the base asset definition if assetId is not provided (simplified for now)
    // In a real scenario, you'd select an existing asset_id from a dropdown
    let assetId = data.assetId;
    
    if (!assetId) {
      const assetDef = await unwrap(
        supabase
          .from('assets')
          .insert({
            name: data.assetName || 'Tài sản mới',
            category: data.type || 'Other',
            unit_cost: data.purchasePrice || 0,
            brand: data.brand || null,
            model: data.model || null
          })
          .select('id')
          .single()
      );
      assetId = assetDef.id;
    }

    // 2. Link it to a room_asset instance
    const insertPayload: any = {
      asset_id: assetId,
      room_id: data.roomId ? Number(data.roomId) : null,
      purchase_date: data.purchaseDate ?? null,
      warranty_expiry: data.warrantyExpiry ?? null,
      serial_number: data.serialNumber ?? null,
      quantity: data.quantity ?? 1,
      status: mapAssetStatus.toDb(data.condition || 'Good'),
    };

    // If the schema strictly requires a non-null room_id, we'd need a warehouse ID (1 is often a default)
    // But usually room_id is nullable. Using 'any' for the payload to bypass strict inference if mismatched.
    const row = await unwrap(
      supabase
        .from('room_assets')
        .insert(insertPayload)
        .select(SELECT_QUERY)
        .single()
    ) as unknown as RoomAssetRow;

    return rowToAsset(row);
  },

  assignAssetsToRoom: async (assetIds: (string | number)[], roomId: string | number): Promise<boolean> => {
    await unwrap(
      supabase
        .from('room_assets')
        .update({ room_id: Number(roomId) })
        .in('id', assetIds.map(id => Number(id)))
    );
    return true;
  },

  updateAsset: async (id: string | number, data: Partial<Asset>): Promise<Asset> => {
    // 1. Update instance-specific fields (room_assets table)
    const updatePayload: any = {};
    if (data.purchaseDate !== undefined) updatePayload.purchase_date = data.purchaseDate;
    if (data.warrantyExpiry !== undefined) updatePayload.warranty_expiry = data.warrantyExpiry;
    if (data.serialNumber !== undefined) updatePayload.serial_number = data.serialNumber;
    if (data.quantity !== undefined) updatePayload.quantity = Number(data.quantity);
    if (data.condition !== undefined) updatePayload.status = mapAssetStatus.toDb(data.condition);
    if (data.roomId !== undefined) updatePayload.room_id = data.roomId ? Number(data.roomId) : null;

    const roomAsset = await unwrap(
      supabase
        .from('room_assets')
        .update(updatePayload)
        .eq('id', Number(id))
        .select('asset_id')
        .single()
    );

    // 2. Update definition fields (assets table)
    if (roomAsset.asset_id && (data.assetName || data.type || data.purchasePrice || data.brand || data.model)) {
      const assetUpdate: any = {};
      if (data.assetName !== undefined) assetUpdate.name = data.assetName;
      if (data.type !== undefined) assetUpdate.category = data.type;
      if (data.purchasePrice !== undefined) assetUpdate.unit_cost = Number(data.purchasePrice);
      if (data.brand !== undefined) assetUpdate.brand = data.brand;
      if (data.model !== undefined) assetUpdate.model = data.model;

      await unwrap(
        supabase
          .from('assets')
          .update(assetUpdate)
          .eq('id', roomAsset.asset_id)
      );
    }

    // Return the fresh consolidated object
    const updatedRow = await unwrap(
      supabase
        .from('room_assets')
        .select(SELECT_QUERY)
        .eq('id', Number(id))
        .single()
    ) as unknown as RoomAssetRow;

    return rowToAsset(updatedRow);
  },

  deleteAsset: async (id: string | number): Promise<boolean> => {
    await unwrap(
      supabase
        .from('room_assets')
        .delete()
        .eq('id', Number(id))
    );
    return true;
  },
};
