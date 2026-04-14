// Central mapping layer between frontend enum values and database enum values.
// All transformations happen in the service layer — UI code never sees DB values.

// --- Generic mapper factory ---

type StringRecord = Record<string, string>

function createMapper<TFrom extends StringRecord>(map: TFrom) {
  return (value: string): string => {
    return (map as Record<string, string>)[value] ?? value
  }
}

// --- Role ---
const ROLE_FROM_DB: StringRecord = {
  admin: 'Owner',
  manager: 'Owner',
  staff: 'Staff',
  landlord: 'Owner',
  tenant: 'Tenant',
}
const ROLE_TO_DB: StringRecord = {
  Owner: 'admin',
  Staff: 'staff',
  Tenant: 'tenant',
  Viewer: 'tenant',
  SuperAdmin: 'admin',
}

// --- Room Status ---
const ROOM_STATUS_FROM_DB: StringRecord = {
  available: 'Vacant',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
}
const ROOM_STATUS_TO_DB: StringRecord = {
  Vacant: 'available',
  Occupied: 'occupied',
  Maintenance: 'maintenance',
  Reserved: 'reserved',
}

// --- Contract Status ---
const CONTRACT_STATUS_FROM_DB: StringRecord = {
  draft: 'Draft',
  pending_signature: 'Signed',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
  cancelled: 'Cancelled',
}
const CONTRACT_STATUS_TO_DB: StringRecord = {
  Draft: 'draft',
  Signed: 'pending_signature',
  Active: 'active',
  Expired: 'expired',
  Terminated: 'terminated',
  Cancelled: 'cancelled',
}

// --- Invoice Status ---
const INVOICE_STATUS_FROM_DB: StringRecord = {
  draft: 'Unpaid',
  pending_payment: 'Unpaid',
  partially_paid: 'Unpaid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}
const INVOICE_STATUS_TO_DB: StringRecord = {
  Unpaid: 'pending_payment',
  Paid: 'paid',
  Overdue: 'overdue',
  Cancelled: 'cancelled',
}

// --- Ticket Status ---
const TICKET_STATUS_FROM_DB: StringRecord = {
  new: 'Open',
  in_progress: 'InProgress',
  pending_confirmation: 'InProgress',
  resolved: 'Resolved',
  closed: 'Closed',
}
const TICKET_STATUS_TO_DB: StringRecord = {
  Open: 'new',
  InProgress: 'in_progress',
  Resolved: 'resolved',
  Closed: 'closed',
  // E-01 KNOWN DATA LOSS: DB ticket_status_type enum does NOT include 'cancelled'.
  // Valid DB values: new | in_progress | pending_confirmation | resolved | closed
  // A ticket cancelled in the UI is stored as 'closed' in the DB.
  // On next load, 'closed' maps back to 'Closed' \u2014 not 'Cancelled' \u2014 so the round-trip is lossy.
  // Impact: UI filter for 'Cancelled' tickets will always return 0 results.
  // To fix: either add 'cancelled' to the DB enum or remove the Cancelled UI state.
  Cancelled: 'closed',
}

// --- Priority ---
const PRIORITY_FROM_DB: StringRecord = {
  urgent: 'Critical',
  high: 'High',
  normal: 'Medium',
  low: 'Low',
}
const PRIORITY_TO_DB: StringRecord = {
  Critical: 'urgent',
  High: 'high',
  Medium: 'normal',
  Low: 'low',
}

// --- Payment Method ---
const PAYMENT_METHOD_FROM_DB: StringRecord = {
  cash: 'Cash',
  bank_transfer: 'Transfer',
  momo: 'E-wallet',
  zalopay: 'E-wallet',
  vnpay: 'E-wallet',
  stripe: 'Transfer',
  other: 'Cash',
}
const PAYMENT_METHOD_TO_DB: StringRecord = {
  Cash: 'cash',
  Transfer: 'bank_transfer',
  'E-wallet': 'momo',
  BankTransfer: 'bank_transfer',
  VNPay: 'vnpay',
  Momo: 'momo',
  ZaloPay: 'zalopay',
}

// --- Deposit Status ---
const DEPOSIT_STATUS_FROM_DB: StringRecord = {
  pending: 'Available',
  received: 'Available',
  partially_refunded: 'Deducted',
  refunded: 'Refunded',
  forfeited: 'Deducted',
}
const DEPOSIT_STATUS_TO_DB: StringRecord = {
  Available: 'received',
  Deducted: 'partially_refunded',
  Refunded: 'refunded',
}

// --- Gender ---
const GENDER_FROM_DB: StringRecord = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
}
const GENDER_TO_DB: StringRecord = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
}

// --- Asset Status ---
const ASSET_STATUS_FROM_DB: StringRecord = {
  in_use: 'Good',
  maintenance: 'Fair',
  disposed: 'Poor',
}
const ASSET_STATUS_TO_DB: StringRecord = {
  New: 'in_use',
  Good: 'in_use',
  Fair: 'maintenance',
  Poor: 'disposed',
}

// --- Exported mappers ---

export const mapRole = { fromDb: createMapper(ROLE_FROM_DB), toDb: createMapper(ROLE_TO_DB) }
export const mapRoomStatus = { fromDb: createMapper(ROOM_STATUS_FROM_DB), toDb: createMapper(ROOM_STATUS_TO_DB) }
export const mapContractStatus = { fromDb: createMapper(CONTRACT_STATUS_FROM_DB), toDb: createMapper(CONTRACT_STATUS_TO_DB) }
export const mapInvoiceStatus = { fromDb: createMapper(INVOICE_STATUS_FROM_DB), toDb: createMapper(INVOICE_STATUS_TO_DB) }
export const mapTicketStatus = { fromDb: createMapper(TICKET_STATUS_FROM_DB), toDb: createMapper(TICKET_STATUS_TO_DB) }
export const mapPriority = { fromDb: createMapper(PRIORITY_FROM_DB), toDb: createMapper(PRIORITY_TO_DB) }
export const mapPaymentMethod = { fromDb: createMapper(PAYMENT_METHOD_FROM_DB), toDb: createMapper(PAYMENT_METHOD_TO_DB) }
export const mapDepositStatus = { fromDb: createMapper(DEPOSIT_STATUS_FROM_DB), toDb: createMapper(DEPOSIT_STATUS_TO_DB) }
export const mapGender = { fromDb: createMapper(GENDER_FROM_DB), toDb: createMapper(GENDER_TO_DB) }
export const mapAssetStatus = { fromDb: createMapper(ASSET_STATUS_FROM_DB), toDb: createMapper(ASSET_STATUS_TO_DB) }
