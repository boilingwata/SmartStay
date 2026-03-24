export type ContractStatus = 'Draft' | 'Active' | 'Expired' | 'Terminated' | 'Cancelled' | 'Signed';
export type ContractType = 'Residential' | 'Commercial' | 'Shortterm';

export interface Contract {
  id: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  buildingName: string;
  tenantName: string;
  tenantAvatar?: string;
  type: ContractType;
  status: ContractStatus;
  rentPriceSnapshot: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentCycle: number;
  isRepresentative: boolean;
}

export interface ContractDetail extends Contract {
  depositAmount: number;
  depositStatus: 'Available' | 'Deducted' | 'Refunded';
  paymentDueDay: number;
  noticePeriodDays?: number;
  terminationDate?: string;
  terminationReason?: string;
  note?: string;
  tenants: ContractTenant[];
  services: ContractService[];
  addendums?: ContractAddendum[];

}

export interface ContractTenant {
  id: string;
  fullName: string;
  avatarUrl?: string;
  cccd: string;
  isRepresentative: boolean;
  joinedAt: string;
  leftAt?: string;
}

export interface ContractService {
  id: string;
  serviceName: string;
  unit: string;
  unitPriceSnapshot: number;
  quantity: number;
  totalPerCycle: number;
  note?: string;
}

export interface ContractAddendum {
  id: string;
  addendumCode: string;
  type: 'PriceChange' | 'RoomChange' | 'RuleChange' | 'Other';
  title: string;
  effectiveDate: string;
  status: 'Draft' | 'Signed' | 'Cancelled';
  fileUrl?: string;
  content?: string;
}
