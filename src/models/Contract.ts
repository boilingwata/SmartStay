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
  occupantCount?: number;
}

export interface ContractDetail extends Contract {
  signingDate?: string;
  depositAmount: number;
  depositStatusRaw?: string;
  depositStatus: 'Available' | 'Deducted' | 'Refunded';
  paymentDueDay: number;
  noticePeriodDays?: number;
  terminationDate?: string;
  terminationReason?: string;
  note?: string;
  tenants: ContractTenant[];
  primaryTenant?: ContractTenant;
  occupants: ContractOccupant[];
  services: ContractService[];
  renewals?: ContractRenewal[];
  invoices?: ContractInvoice[];
  transfers?: ContractTransfer[];
  addendumSourceAvailable?: boolean;
  addendums?: ContractAddendum[];

}

export interface ContractTenant {
  id: string;
  fullName: string;
  avatarUrl?: string;
  cccd: string;
  phone?: string;
  email?: string;
  isRepresentative: boolean;
  joinedAt: string;
  leftAt?: string;
}

export interface ContractOccupant {
  id: string;
  tenantId: string;
  fullName: string;
  avatarUrl?: string;
  cccd: string;
  phone?: string;
  email?: string;
  isPrimaryTenant: boolean;
  relationshipToPrimary?: string;
  note?: string;
  moveInAt: string;
  moveOutAt?: string;
  status: 'active' | 'moved_out';
}

export interface ContractTransfer {
  id: string;
  oldContractId: string;
  newContractId: string;
  fromTenantId: string;
  fromTenantName: string;
  toTenantId: string;
  toTenantName: string;
  transferDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  depositMode: string;
  carryOverDepositAmount: number;
  note?: string;
  approvedBy?: string;
  createdAt?: string;
}

export interface ContractRenewal {
  id: string;
  previousEndDate: string;
  newEndDate: string;
  newMonthlyRent: number;
  reason?: string;
  createdAt?: string;
}

export interface ContractInvoice {
  id: string;
  invoiceCode: string;
  billingPeriod: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  createdAt?: string;
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
