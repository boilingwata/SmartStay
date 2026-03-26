import { Asset, AssetType, AssetCondition } from '@/models/Asset';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import { mapAssetStatus } from '@/lib/enumMaps';
import type { DbAssetStatus } from '@/types/supabase';

// Shape returned by the joined query
interface RoomAssetRow {
  id: number;
  status: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  assets: {
    id: number;
    name: string;
    qr_code: string | null;
    category: string | null;
    unit_cost: number | null;
  } | null;
  rooms: {
    id: number;
    room_code: string;
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
    purchaseDate: row.purchase_date ?? undefined,
    purchasePrice: row.assets?.unit_cost ?? undefined,
    warrantyExpiry: row.warranty_expiry ?? undefined,
  };
}

export const assetService = {
  getAssets: async (params?: {
    search?: string;
    type?: AssetType | string;
    roomId?: string | number;
  }): Promise<Asset[]> => {
    let query = supabase
      .from('room_assets')
      .select('id, status, purchase_date, warranty_expiry, assets(id, name, qr_code, category, unit_cost), rooms(id, room_code)')
      .order('id', { ascending: false });

    if (params?.roomId) {
      query = query.eq('room_id', Number(params.roomId));
    }

    const rows = await unwrap(query) as unknown as RoomAssetRow[];

    let assets = rows.map(rowToAsset);

    if (params?.search) {
      const s = params.search.toLowerCase();
      assets = assets.filter(
        a => a.assetName.toLowerCase().includes(s) || a.assetCode.toLowerCase().includes(s)
      );
    }

    if (params?.type) {
      assets = assets.filter(a => a.type === params.type);
    }

    return assets;
  },

  getAssetDetail: async (id: string | number): Promise<Asset | null> => {
    const row = await unwrap(
      supabase
        .from('room_assets')
        .select('id, status, purchase_date, warranty_expiry, assets(id, name, qr_code, category, unit_cost), rooms(id, room_code)')
        .eq('id', Number(id))
        .maybeSingle()
    ) as unknown as RoomAssetRow | null;

    return row ? rowToAsset(row) : null;
  },

  createAsset: async (data: Partial<Asset> & { assetId?: number; roomId?: string | number }): Promise<Asset> => {
    // AS-01 FIX: Typed insert payload aligned with smartstay.room_assets schema.
    // DB schema requires room_id and asset_id; status must match DbAssetStatus enum.
    const insertPayload = {
      asset_id: data.assetId ?? 0,
      room_id: data.roomId ? Number(data.roomId) : 0,  // DB: room_id is required (non-null)
      purchase_date: data.purchaseDate ?? null,
      warranty_expiry: data.warrantyExpiry ?? null,
      status: 'in_use' as DbAssetStatus,
    };

    const row = await unwrap(
      supabase
        .from('room_assets')
        .insert(insertPayload)
        .select('id, status, purchase_date, warranty_expiry, assets(id, name, qr_code, category, unit_cost), rooms(id, room_code)')
        .single()
    ) as unknown as RoomAssetRow;

    return rowToAsset(row);
  },

  updateAsset: async (id: string | number, data: Partial<Asset>): Promise<Asset> => {
    // AS-01 FIX: Type the update payload aligned with smartstay.room_assets update schema.
    const updatePayload: { purchase_date?: string | null; warranty_expiry?: string | null } = {};
    if (data.purchaseDate !== undefined) updatePayload.purchase_date = data.purchaseDate;
    if (data.warrantyExpiry !== undefined) updatePayload.warranty_expiry = data.warrantyExpiry;

    const row = await unwrap(
      supabase
        .from('room_assets')
        .update(updatePayload)
        .eq('id', Number(id))
        .select('id, status, purchase_date, warranty_expiry, assets(id, name, qr_code, category, unit_cost), rooms(id, room_code)')
        .single()
    ) as unknown as RoomAssetRow;

    return rowToAsset(row);
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
