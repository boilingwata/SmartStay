import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAdminFinanceRealtime(invoiceId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`admin-finance-realtime-${invoiceId ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'invoices' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });

          const changedInvoiceId =
            'id' in payload.new ? String((payload.new as { id?: number }).id ?? '') : '';

          if (invoiceId && changedInvoiceId === invoiceId) {
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'payments' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });

          const paymentRow = payload.new as { invoice_id?: number } | null;
          if (invoiceId && paymentRow?.invoice_id != null && String(paymentRow.invoice_id) === invoiceId) {
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [invoiceId, queryClient]);
}
