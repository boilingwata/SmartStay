import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  CreditCard, 
  Wrench, 
  Calendar, 
  Megaphone 
} from 'lucide-react';

export interface NotificationStyle {
  icon: React.ElementType;
  color: string;
}

export const NOTIFICATION_STYLE_MAP: Record<string, NotificationStyle> = {
  'invoice_new': { icon: CreditCard, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  'invoice_due': { icon: Bell, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  'payment_confirmed': { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'ticket': { icon: Wrench, color: 'bg-teal-50 text-[#0D8A8A] border-teal-100' },
  'contract_renew': { icon: Calendar, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  'announcement': { icon: Megaphone, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  'default': { icon: Bell, color: 'bg-slate-50 text-slate-500 border-slate-100' }
};

/**
 * Historical/variant type mapping to canonical keys
 */
const TYPE_MAPPING: Record<string, string> = {
  'invoicedue': 'invoice_due',
  'invoicenew': 'invoice_new',
  'billnew': 'invoice_new',
  'billdue': 'invoice_due',
  'paymentconfirmed': 'payment_confirmed',
  'paymentsuccess': 'payment_confirmed',
  'paymentpaid': 'payment_confirmed',
  'ticket': 'ticket',
  'ticketassigned': 'ticket',
  'ticketupdate': 'ticket',
  'contractrenew': 'contract_renew',
  'contractexpiring': 'contract_renew',
  'announcement': 'announcement'
};

/**
 * Normalizes notification type to a canonical snake_case key
 */
export const normalizeNotificationType = (type?: string): string => {
  if (!type) return 'default';
  
  // 1. Basic normalization (lowercase, remove noise)
  const base = type.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  // 2. Direct mapping lookup
  if (TYPE_MAPPING[base]) return TYPE_MAPPING[base];
  
  // 3. Substring fallback for unknown variants
  if (base.includes('invoice') || base.includes('bill')) return 'invoice_due';
  if (base.includes('payment')) return 'payment_confirmed';
  if (base.includes('ticket')) return 'ticket';
  if (base.includes('contract')) return 'contract_renew';
  if (base.includes('announcement')) return 'announcement';
  
  return 'default';
};

/**
 * Returns the style for a given notification type
 */
export const getNotificationStyle = (type?: string): NotificationStyle => {
  const normalized = normalizeNotificationType(type);
  return NOTIFICATION_STYLE_MAP[normalized] || NOTIFICATION_STYLE_MAP.default;
};
