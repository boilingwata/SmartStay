import { describe, it, expect } from 'vitest';
import { normalizeNotificationType, getNotificationStyle } from './notificationUtils';
import { Bell, CreditCard, CheckCircle2 } from 'lucide-react';

describe('notificationUtils', () => {
  describe('normalizeNotificationType', () => {
    it('normalizes common invoice types to invoice_due or invoice_new', () => {
      expect(normalizeNotificationType('InvoiceDue')).toBe('invoice_due');
      expect(normalizeNotificationType('bill_new')).toBe('invoice_new');
    });

    it('normalizes legacy payment success types to payment_confirmed', () => {
      expect(normalizeNotificationType('payment_success')).toBe('payment_confirmed');
      expect(normalizeNotificationType('paymentpaid')).toBe('payment_confirmed');
    });

    it('falls back to default for unknown or empty types', () => {
      expect(normalizeNotificationType('UNKNOWN_RANDOM')).toBe('default');
      expect(normalizeNotificationType('')).toBe('default');
      expect(normalizeNotificationType(undefined)).toBe('default');
    });
  });

  describe('getNotificationStyle', () => {
    it('returns a style object with React.ElementType icon and color string for valid types', () => {
      const style = getNotificationStyle('invoice_new');
      expect(style).toBeDefined();
      expect(style.icon).toBe(CreditCard);
      expect(typeof style.color).toBe('string');
      expect(style.color).toContain('blue-600');
    });

    it('returns a default style with a Bell icon for unknown types', () => {
      const style = getNotificationStyle('unknown_garbage');
      expect(style).toBeDefined();
      expect(style.icon).toBe(Bell);
      expect(style.color).toContain('slate-500');
    });

    it('handles undefined input gracefully without throwing errors', () => {
      const style = getNotificationStyle(undefined);
      expect(style).toBeDefined();
      expect(style.icon).toBe(Bell);
      expect(style.color).toContain('slate-500');
    });
    
    it('handles legacy payment types correctly', () => {
      const style = getNotificationStyle('payment_success');
      expect(style.icon).toBe(CheckCircle2);
      expect(style.color).toContain('emerald-600');
    });
  });
});
