export type TransactionType = 'Payment' | 'Refund' | 'Correction' | 'Overpayment' | 'ManualTopUp' | 'ManualDeduct' | 'AutoOffset' | 'Other';

export interface TenantBalance {
  tenantId: string;
  currentBalance: number;
  totalPaid?: number;
  totalUnpaid?: number;
  lastUpdated: string;
  lastUpdatedAt: string; // Added to match view
}

export interface TenantBalanceTransaction {
  id: string;
  tenantId: string;
  amount: number;
  type: TransactionType;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  relatedInvoiceId?: string;
  relatedInvoiceCode?: string;
  referenceId?: string;
  note?: string; // Added to match view
  createdAt: string;
}
