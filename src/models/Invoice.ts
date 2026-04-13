export type InvoiceStatus = 'Unpaid' | 'Paid' | 'Overdue' | 'Cancelled';
export type InvoiceItemType = 'Rent' | 'Electricity' | 'Water' | 'Service' | 'Other';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  /** @deprecated Use snapshot_price instead. Replaced to support null states and explicit labels. */
  unitPriceSnapshot: number;
  amount: number;
  type: InvoiceItemType;
  snapshotPrice: number | null;
  snapshotLabel: string;
}

export interface PaymentTransaction {
  id: string;
  transactionCode: string;
  paidAt: string;
  amount: number;
  method: 'Transfer' | 'Cash' | 'E-wallet';
  evidenceUrl?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  contractId: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  buildingId: string;
  buildingName: string;
  tenantId: string;
  tenantName: string;
  period: string; // YYYY-MM
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  hasViewed: boolean;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  payments: PaymentTransaction[];
  discountAmount: number;
  discountReason?: string;
  overdueFee: number;
  taxAmount: number;
  subTotal: number;
  bankInfo?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    qrContent: string;
  };
}
