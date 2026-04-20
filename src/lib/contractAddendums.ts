import type { ContractAddendum } from '@/models/Contract';

export interface ContractAddendumRow {
  id: number;
  addendum_code: string | null;
  addendum_type: string | null;
  title: string;
  content: string | null;
  effective_date: string;
  status: string | null;
  signed_file_url: string | null;
  summary_json?: Record<string, unknown> | null;
  created_at?: string | null;
  source_type?: string | null;
  version_no?: number | null;
  parent_addendum_id?: number | null;
}

export function mapContractAddendumType(type: string | null | undefined): ContractAddendum['type'] {
  switch (type) {
    case 'asset_assignment':
      return 'AssetAssignment';
    case 'asset_repricing':
      return 'AssetRepricing';
    case 'asset_status_change':
      return 'AssetStatusChange';
    case 'rent_change':
      return 'RentChange';
    case 'service_change':
      return 'ServiceChange';
    case 'room_change':
      return 'RoomChange';
    case 'policy_update':
      return 'PolicyUpdate';
    default:
      return 'Other';
  }
}

export function mapContractAddendumStatus(status: string | null | undefined): ContractAddendum['status'] {
  switch ((status ?? '').toLowerCase()) {
    case 'signed':
      return 'Signed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Draft';
  }
}

export function toDbAddendumType(type: ContractAddendum['type']): string {
  switch (type) {
    case 'AssetAssignment':
      return 'asset_assignment';
    case 'AssetRepricing':
      return 'asset_repricing';
    case 'AssetStatusChange':
      return 'asset_status_change';
    case 'RentChange':
      return 'rent_change';
    case 'ServiceChange':
      return 'service_change';
    case 'RoomChange':
      return 'room_change';
    case 'PolicyUpdate':
      return 'policy_update';
    default:
      return 'other';
  }
}

export function toDbAddendumStatus(status: ContractAddendum['status']): string {
  switch (status) {
    case 'Signed':
      return 'signed';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'draft';
  }
}

export function getContractAddendumTypeLabel(type: ContractAddendum['type']): string {
  switch (type) {
    case 'AssetAssignment':
      return 'Bổ sung tài sản tính phí';
    case 'AssetRepricing':
      return 'Điều chỉnh giá tài sản';
    case 'AssetStatusChange':
      return 'Điều chỉnh trạng thái tài sản';
    case 'RentChange':
      return 'Điều chỉnh giá thuê';
    case 'ServiceChange':
      return 'Điều chỉnh dịch vụ';
    case 'RoomChange':
      return 'Điều chuyển phòng';
    case 'PolicyUpdate':
      return 'Điều chỉnh chính sách';
    default:
      return 'Phụ lục khác';
  }
}

export function mapContractAddendumSourceType(
  sourceType: string | null | undefined
): ContractAddendum['sourceType'] {
  return sourceType === 'room_asset_auto' ? 'RoomAssetAuto' : 'Manual';
}

export function getContractAddendumSourceLabel(sourceType: ContractAddendum['sourceType']): string {
  return sourceType === 'RoomAssetAuto' ? 'Tự động từ tài sản phòng' : 'Thủ công';
}

export function toContractAddendum(row: ContractAddendumRow): ContractAddendum {
  return {
    id: String(row.id),
    addendumCode: row.addendum_code ?? `PL-${row.id}`,
    type: mapContractAddendumType(row.addendum_type),
    title: row.title,
    effectiveDate: row.effective_date,
    status: mapContractAddendumStatus(row.status),
    sourceType: mapContractAddendumSourceType(row.source_type),
    versionNo: Math.max(1, row.version_no ?? 1),
    parentAddendumId: row.parent_addendum_id ? String(row.parent_addendum_id) : undefined,
    fileUrl: row.signed_file_url ?? undefined,
    content: row.content ?? undefined,
    summary: row.summary_json ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}
