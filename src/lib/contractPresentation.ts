import type {
  ContractAddendum,
  ContractDepositStatus,
  ContractStatus,
  ContractTransfer,
  ContractType,
} from '@/models/Contract';

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  Draft: 'Bản nháp',
  Signed: 'Chờ ký',
  Active: 'Đang hiệu lực',
  Expired: 'Hết hạn',
  Terminated: 'Đã thanh lý',
  Cancelled: 'Đã hủy',
};

const DEPOSIT_STATUS_LABELS: Record<ContractDepositStatus, string> = {
  Pending: 'Chưa thu cọc',
  Received: 'Đã thu cọc',
  PartiallyRefunded: 'Đã hoàn cọc một phần',
  Refunded: 'Đã hoàn cọc',
  Forfeited: 'Cọc bị khấu trừ',
};

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  Residential: 'Nhà ở',
  Commercial: 'Kinh doanh',
  Office: 'Văn phòng',
};

const ADDENDUM_TYPE_LABELS: Record<ContractAddendum['type'], string> = {
  AssetAssignment: 'Bổ sung tài sản tính phí',
  AssetRepricing: 'Điều chỉnh giá tài sản',
  AssetStatusChange: 'Điều chỉnh trạng thái tài sản',
  RentChange: 'Điều chỉnh giá thuê',
  ServiceChange: 'Điều chỉnh dịch vụ',
  RoomChange: 'Chuyển phòng',
  PolicyUpdate: 'Điều chỉnh chính sách',
  Other: 'Phụ lục khác',
};

const ADDENDUM_STATUS_LABELS: Record<ContractAddendum['status'], string> = {
  Draft: 'Bản nháp',
  Signed: 'Đã ký',
  Cancelled: 'Đã hủy',
};

const ADDENDUM_SOURCE_LABELS: Record<ContractAddendum['sourceType'], string> = {
  Manual: 'Lập thủ công',
  RoomAssetAuto: 'Tự động từ tài sản/phí phòng',
};

const TRANSFER_STATUS_LABELS: Record<ContractTransfer['status'], string> = {
  pending: 'Đang chờ xử lý',
  completed: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
};

export const CONTRACT_STATUS_OPTIONS: Array<{ value: ContractStatus; label: string }> = (
  Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]
).map((value) => ({ value, label: CONTRACT_STATUS_LABELS[value] }));

export const ADDENDUM_TYPE_OPTIONS: Array<{ value: ContractAddendum['type']; label: string }> = (
  Object.keys(ADDENDUM_TYPE_LABELS) as ContractAddendum['type'][]
).map((value) => ({ value, label: ADDENDUM_TYPE_LABELS[value] }));

export const ADDENDUM_STATUS_OPTIONS: Array<{ value: ContractAddendum['status']; label: string }> = (
  Object.keys(ADDENDUM_STATUS_LABELS) as ContractAddendum['status'][]
).map((value) => ({ value, label: ADDENDUM_STATUS_LABELS[value] }));

export function getContractStatusLabel(status: ContractStatus | string): string {
  switch (status) {
    case 'Bản nháp':
    case 'Chờ ký':
    case 'Đang hiệu lực':
    case 'Hết hạn':
    case 'Đã thanh lý':
    case 'Đã hủy':
      return status;
    default:
      break;
  }
  return CONTRACT_STATUS_LABELS[status as ContractStatus] ?? 'Bản nháp';
}

export function getContractDepositStatusLabel(status: ContractDepositStatus | string | null | undefined): string {
  if (!status) return 'Chưa thu cọc';
  return DEPOSIT_STATUS_LABELS[status as ContractDepositStatus] ?? 'Chưa thu cọc';
}

export function getContractTypeLabel(type: ContractType | string): string {
  return CONTRACT_TYPE_LABELS[type as ContractType] ?? 'Nhà ở';
}

export function getContractAddendumTypeLabel(type: ContractAddendum['type']): string {
  return ADDENDUM_TYPE_LABELS[type] ?? ADDENDUM_TYPE_LABELS.Other;
}

export function getContractAddendumStatusLabel(status: ContractAddendum['status'] | string): string {
  return ADDENDUM_STATUS_LABELS[status as ContractAddendum['status']] ?? ADDENDUM_STATUS_LABELS.Draft;
}

export function getContractAddendumSourceLabel(sourceType: ContractAddendum['sourceType']): string {
  return ADDENDUM_SOURCE_LABELS[sourceType] ?? ADDENDUM_SOURCE_LABELS.Manual;
}

export function getInvoiceStatusMeta(status: string | null | undefined): {
  label: string;
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
} {
  switch ((status ?? '').toLowerCase()) {
    case 'paid':
      return { label: 'Đã thanh toán', tone: 'emerald' };
    case 'overdue':
      return { label: 'Quá hạn', tone: 'rose' };
    case 'partially_paid':
      return { label: 'Đã thanh toán một phần', tone: 'amber' };
    case 'pending_payment':
      return { label: 'Chờ thanh toán', tone: 'amber' };
    case 'cancelled':
      return { label: 'Đã hủy', tone: 'slate' };
    case 'draft':
    default:
      return { label: 'Chưa chốt', tone: 'slate' };
  }
}

export function getContractTransferStatusLabel(status: ContractTransfer['status'] | string): string {
  return TRANSFER_STATUS_LABELS[status as ContractTransfer['status']] ?? 'Đang xử lý';
}
