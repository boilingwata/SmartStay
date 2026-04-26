import type { ContractFormData } from '@/schemas/contractSchema';
import type { BuildingSummary } from '@/models/Building';
import type { Room } from '@/models/Room';
import type { TenantSummary } from '@/models/Tenant';
import type { Service } from '@/types/service';
import { formatDate } from '@/utils';

export type ContractWizardSchema = ContractFormData;
export type { BuildingSummary, Room, Service, TenantSummary };

export interface UtilityPolicy {
  id: number;
  name: string;
}

export interface ThongTinHopDongPhong {
  room_id: number;
  contract_code: string;
  start_date: string;
  end_date: string;
}

export const TEN_LOAI_HOP_DONG_HIEN_THI: Record<ContractFormData['type'], string> = {
  Residential: 'Nhà ở',
  Commercial: 'Kinh doanh',
  Office: 'Văn phòng',
};

export const TEN_CAN_CU_PHAP_LY_HIEN_THI: Record<ContractFormData['ownerLegalConfirmation']['legalBasisType'], string> = {
  Owner: 'Chủ sở hữu hoặc người có quyền cho thuê',
  AuthorizedRepresentative: 'Người được ủy quyền hợp pháp',
  BusinessEntity: 'Pháp nhân hoặc đơn vị kinh doanh cho thuê',
};

export const DAN_SACH_CAN_CU_PHAP_LY = Object.entries(TEN_CAN_CU_PHAP_LY_HIEN_THI) as Array<
  [ContractFormData['ownerLegalConfirmation']['legalBasisType'], string]
>;

export function formatContractDate(value?: string | null) {
  return value ? formatDate(value, 'dd/MM/yyyy') : 'Chưa chọn';
}

export function formatContractDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 'Chưa chọn thời hạn';
  return `${formatDate(startDate, 'dd/MM/yyyy')} → ${formatDate(endDate, 'dd/MM/yyyy')}`;
}

export function getPaymentCycleLabel(paymentCycle?: number | null) {
  if (!paymentCycle || paymentCycle <= 0) return '';
  if (paymentCycle === 1) return 'Hàng tháng';
  return `Mỗi ${paymentCycle} tháng`;
}

export function getPaymentCycleSummary(paymentCycle?: number | null) {
  if (!paymentCycle || paymentCycle <= 0) return undefined;
  if (paymentCycle === 1) return 'Thu tiền hàng tháng';
  return `Thu tiền mỗi ${paymentCycle} tháng`;
}
