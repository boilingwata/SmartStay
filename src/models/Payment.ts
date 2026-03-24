export type PaymentStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Refunded';

export type PaymentMethod = 'Cash' | 'BankTransfer' | 'VNPay' | 'Momo' | 'ZaloPay';

export interface PaymentTransaction {
  id: string;
  transactionCode: string;
  invoiceId?: string;
  invoiceCode?: string;
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
}

export type TransactionType = 'Overpayment' | 'Refund' | 'ManualTopUp' | 'ManualDeduct' | 'AutoOffset' | 'Other';
export * from './TenantBalance';

export type WebhookStatus = 'Processed' | 'Failed' | 'Duplicate' | 'Pending';

export interface WebhookLog {
  id: string;
  provider: 'VNPay' | 'Momo' | 'ZaloPay';
  transactionCode: string;
  amount: number;
  status: WebhookStatus;
  receivedAt: string;
  processedAt?: string;
  retryCount: number;
  maxRetries: number;
  payloadJson: string;
}

export interface ChannelHealth {
  provider: 'VNPay' | 'Momo' | 'ZaloPay';
  successRate24h: number;
  status: 'OK' | 'Degraded' | 'Down';
  lastReceivedAt: string;
}
