import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type AdminFinanceRealtimeOptions = {
  invoiceId?: string | null;
  paymentRouteId?: string | null;
};

type FinanceRealtimeRow = {
  id?: number | null;
  invoice_id?: number | null;
};

export function useAdminFinanceRealtime(options: AdminFinanceRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const invoiceId = options.invoiceId ?? null;
  const paymentRouteId = options.paymentRouteId ?? null;
  const flushTimeoutRef = useRef<number | null>(null);
  const pendingRef = useRef({
    invoices: false,
    invoiceCounts: false,
    payments: false,
    pendingPayments: false,
    invoiceDetails: new Set<string>(),
    paymentDetails: new Set<string>(),
  });

  const resetPendingState = (state: (typeof pendingRef)['current']) => {
    state.invoices = false;
    state.invoiceCounts = false;
    state.payments = false;
    state.pendingPayments = false;
    state.invoiceDetails.clear();
    state.paymentDetails.clear();
  };

  useEffect(() => {
    const pendingState = pendingRef.current;

    const scheduleFlush = () => {
      if (flushTimeoutRef.current !== null) {
        return;
      }

      flushTimeoutRef.current = window.setTimeout(() => {
        flushTimeoutRef.current = null;

        if (pendingRef.current.invoices) {
          void queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
        if (pendingRef.current.invoiceCounts) {
          void queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });
        }
        if (pendingRef.current.payments) {
          void queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
        if (pendingRef.current.pendingPayments) {
          void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
        }
        for (const changedInvoiceId of pendingState.invoiceDetails) {
          void queryClient.invalidateQueries({ queryKey: ['invoice', changedInvoiceId] });
        }
        for (const changedPaymentRouteId of pendingState.paymentDetails) {
          void queryClient.invalidateQueries({ queryKey: ['payment', changedPaymentRouteId] });
        }

        resetPendingState(pendingState);
      }, 250);
    };

    const queueInvalidation = (updater: (state: typeof pendingRef.current) => void) => {
      updater(pendingState);
      scheduleFlush();
    };

    const resolveId = (row: FinanceRealtimeRow | null | undefined) =>
      row?.id != null ? String(row.id) : null;

    const resolveInvoiceId = (row: FinanceRealtimeRow | null | undefined) =>
      row?.invoice_id != null ? String(row.invoice_id) : null;

    const channel = supabase
      .channel(`admin-finance-realtime:${invoiceId ?? 'all'}:${paymentRouteId ?? 'list'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'invoices' },
        (payload) => {
          queueInvalidation((state) => {
            state.invoices = true;
            state.invoiceCounts = true;

            const changedInvoiceId = resolveId(payload.new as FinanceRealtimeRow) ?? resolveId(payload.old as FinanceRealtimeRow);
            if (changedInvoiceId) {
              state.invoiceDetails.add(changedInvoiceId);
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'payments' },
        (payload) => {
          queueInvalidation((state) => {
            state.payments = true;
            state.pendingPayments = true;
            state.invoices = true;
            state.invoiceCounts = true;

            const changedInvoiceId =
              resolveInvoiceId(payload.new as FinanceRealtimeRow) ?? resolveInvoiceId(payload.old as FinanceRealtimeRow);
            if (changedInvoiceId) {
              state.invoiceDetails.add(changedInvoiceId);
            }

            const changedPaymentId = resolveId(payload.new as FinanceRealtimeRow) ?? resolveId(payload.old as FinanceRealtimeRow);
            if (changedPaymentId) {
              state.paymentDetails.add(changedPaymentId);
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'payment_attempts' },
        (payload) => {
          queueInvalidation((state) => {
            state.payments = true;
            state.pendingPayments = true;

            const changedInvoiceId =
              resolveInvoiceId(payload.new as FinanceRealtimeRow) ?? resolveInvoiceId(payload.old as FinanceRealtimeRow);
            if (changedInvoiceId) {
              state.invoiceDetails.add(changedInvoiceId);
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          queueInvalidation((state) => {
            state.invoices = true;
            state.invoiceCounts = true;
            state.payments = true;
            state.pendingPayments = true;
            if (invoiceId) {
              state.invoiceDetails.add(invoiceId);
            }
            if (paymentRouteId) {
              state.paymentDetails.add(paymentRouteId);
            }
          });
        }
      });

    return () => {
      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }
      resetPendingState(pendingState);
      void supabase.removeChannel(channel);
    };
  }, [invoiceId, paymentRouteId, queryClient]);
}
