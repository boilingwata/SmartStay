// Central mapping layer between frontend enum values and database enum values.
// All transformations happen in the service layer so UI code never sees DB enums directly.

type StringRecord = Record<string, string>;

function createMapper<TFrom extends StringRecord>(map: TFrom) {
  return (value: string): string => {
    return (map as Record<string, string>)[value] ?? value;
  };
}

const ROLE_FROM_DB: StringRecord = {
  admin: 'Owner',
  manager: 'Owner',
  landlord: 'Owner',
  owner: 'Owner',
  staff: 'Staff',
  tenant: 'Tenant',
  super_admin: 'SuperAdmin',
  viewer: 'Tenant',
};

const ROLE_TO_DB: StringRecord = {
  Owner: 'owner',
  Staff: 'staff',
  Tenant: 'tenant',
  SuperAdmin: 'super_admin',
};

const ROOM_STATUS_FROM_DB: StringRecord = {
  available: 'Vacant',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
};

const ROOM_STATUS_TO_DB: StringRecord = {
  Vacant: 'available',
  Occupied: 'occupied',
  Maintenance: 'maintenance',
  Reserved: 'reserved',
};

const CONTRACT_STATUS_FROM_DB: StringRecord = {
  draft: 'Draft',
  pending_signature: 'Signed',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
  cancelled: 'Cancelled',
};

const CONTRACT_STATUS_TO_DB: StringRecord = {
  'Bản nháp': 'draft',
  'Chờ ký': 'pending_signature',
  'Đang hiệu lực': 'active',
  'Hết hạn': 'expired',
  'Đã thanh lý': 'terminated',
  'Đã hủy': 'cancelled',
  Draft: 'draft',
  Signed: 'pending_signature',
  Active: 'active',
  Expired: 'expired',
  Terminated: 'terminated',
  Cancelled: 'cancelled',
};

const INVOICE_STATUS_FROM_DB: StringRecord = {
  draft: 'Unpaid',
  pending_payment: 'Unpaid',
  partially_paid: 'Unpaid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const INVOICE_STATUS_TO_DB: StringRecord = {
  Unpaid: 'pending_payment',
  Paid: 'paid',
  Overdue: 'overdue',
  Cancelled: 'cancelled',
};

const TICKET_STATUS_FROM_DB: StringRecord = {
  new: 'Open',
  in_progress: 'InProgress',
  pending_confirmation: 'InProgress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const TICKET_STATUS_TO_DB: StringRecord = {
  Open: 'new',
  InProgress: 'in_progress',
  Resolved: 'resolved',
  Closed: 'closed',
  Cancelled: 'closed',
};

const PRIORITY_FROM_DB: StringRecord = {
  urgent: 'Critical',
  high: 'High',
  normal: 'Medium',
  low: 'Low',
};

const PRIORITY_TO_DB: StringRecord = {
  Critical: 'urgent',
  High: 'high',
  Medium: 'normal',
  Low: 'low',
};

const PAYMENT_METHOD_FROM_DB: StringRecord = {
  cash: 'Cash',
  bank_transfer: 'Transfer',
  momo: 'E-wallet',
  zalopay: 'E-wallet',
  vnpay: 'E-wallet',
  stripe: 'Transfer',
  other: 'Cash',
};

const PAYMENT_METHOD_TO_DB: StringRecord = {
  Cash: 'cash',
  Transfer: 'bank_transfer',
  'E-wallet': 'momo',
  BankTransfer: 'bank_transfer',
  VNPay: 'vnpay',
  Momo: 'momo',
  ZaloPay: 'zalopay',
};

const DEPOSIT_STATUS_FROM_DB: StringRecord = {
  pending: 'Pending',
  received: 'Received',
  partially_refunded: 'PartiallyRefunded',
  refunded: 'Refunded',
  forfeited: 'Forfeited',
};

const DEPOSIT_STATUS_TO_DB: StringRecord = {
  Pending: 'pending',
  Received: 'received',
  PartiallyRefunded: 'partially_refunded',
  Refunded: 'refunded',
  Forfeited: 'forfeited',
};

const GENDER_FROM_DB: StringRecord = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

const GENDER_TO_DB: StringRecord = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
};

const ASSET_STATUS_FROM_DB: StringRecord = {
  in_use: 'Good',
  maintenance: 'Fair',
  disposed: 'Poor',
};

const ASSET_STATUS_TO_DB: StringRecord = {
  New: 'in_use',
  Good: 'in_use',
  Fair: 'maintenance',
  Poor: 'disposed',
};

const HANDOVER_TYPE_FROM_DB: StringRecord = {
  check_in: 'CheckIn',
  check_out: 'CheckOut',
  periodic: 'Periodic',
  other: 'Other',
};

const HANDOVER_TYPE_TO_DB: StringRecord = {
  CheckIn: 'check_in',
  CheckOut: 'check_out',
  Periodic: 'periodic',
  Other: 'other',
};

const CONDITION_SCORE_TO_NUM: Record<string, number> = {
  New: 10,
  Good: 8,
  Fair: 5,
  Poor: 2,
};

export const mapRole = { fromDb: createMapper(ROLE_FROM_DB), toDb: createMapper(ROLE_TO_DB) };
export const mapRoomStatus = { fromDb: createMapper(ROOM_STATUS_FROM_DB), toDb: createMapper(ROOM_STATUS_TO_DB) };
export const mapContractStatus = {
  fromDb: createMapper(CONTRACT_STATUS_FROM_DB),
  toDb: createMapper(CONTRACT_STATUS_TO_DB),
};
export const mapInvoiceStatus = {
  fromDb: createMapper(INVOICE_STATUS_FROM_DB),
  toDb: createMapper(INVOICE_STATUS_TO_DB),
};
export const mapTicketStatus = {
  fromDb: createMapper(TICKET_STATUS_FROM_DB),
  toDb: createMapper(TICKET_STATUS_TO_DB),
};
export const mapPriority = { fromDb: createMapper(PRIORITY_FROM_DB), toDb: createMapper(PRIORITY_TO_DB) };
export const mapPaymentMethod = {
  fromDb: createMapper(PAYMENT_METHOD_FROM_DB),
  toDb: createMapper(PAYMENT_METHOD_TO_DB),
};
export const mapDepositStatus = {
  fromDb: createMapper(DEPOSIT_STATUS_FROM_DB),
  toDb: createMapper(DEPOSIT_STATUS_TO_DB),
};
export const mapGender = { fromDb: createMapper(GENDER_FROM_DB), toDb: createMapper(GENDER_TO_DB) };
export const mapAssetStatus = { fromDb: createMapper(ASSET_STATUS_FROM_DB), toDb: createMapper(ASSET_STATUS_TO_DB) };
export const mapHandoverType = {
  fromDb: createMapper(HANDOVER_TYPE_FROM_DB),
  toDb: createMapper(HANDOVER_TYPE_TO_DB),
};

export const mapConditionScore = {
  toNum: (label: string): number => CONDITION_SCORE_TO_NUM[label] ?? 5,
  fromNum: (score: number): string => {
    if (score >= 9) return 'New';
    if (score >= 7) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  },
};
