export type PaymentStatus =
  | 'Pending'
  | 'Submitted'
  | 'Processing'
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled'
  | 'Refunded'
  | 'Failed';

export type PaymentMethod = 'Cash' | 'BankTransfer' | 'VNPay' | 'Momo' | 'ZaloPay' | 'Other';

export type PaymentSource = 'Payment' | 'Attempt';

export interface PaymentTransaction {
  id: string;
  routeId: string;
  source: PaymentSource;
  transactionCode: string;
  invoiceId?: string;
  invoiceCode?: string;
  invoiceStatus?: string;
  invoiceBalanceDue?: number;
  tenantId: string;
  tenantName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  evidenceImage?: string;
  rejectionReason?: string;
  recordedBy?: string;
  note?: string;
  createdAt: string;
  confirmedAt?: string;
  referenceNumber?: string;
  bankName?: string;
  confirmationSource?: string;
}

export type TransactionType = 'Overpayment' | 'Refund' | 'ManualTopUp' | 'ManualDeduct' | 'AutoOffset' | 'Other';
export * from './TenantBalance';

export type WebhookProvider = 'SePay' | 'VNPay' | 'Momo' | 'ZaloPay' | 'Other';
export type WebhookStatus = 'Received' | 'Processing' | 'Success' | 'Failed' | 'Retry';

export interface WebhookLog {
  id: string;
  provider: WebhookProvider;
  transactionCode: string;
  amount: number;
  status: WebhookStatus;
  receivedAt: string;
  processedAt?: string;
  retryCount: number;
  maxRetries: number;
  payloadJson: string;
  errorMessage?: string;
}

export interface ChannelHealth {
  provider: WebhookProvider;
  successRate24h: number;
  status: 'OK' | 'Degraded' | 'Down';
  lastReceivedAt: string;
  total24h: number;
  failed24h: number;
}
