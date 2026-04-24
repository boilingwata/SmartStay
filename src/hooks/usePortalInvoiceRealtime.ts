import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type InvoiceRealtimeRow = {
  id: number;
  status: string | null;
};

function refreshPortalInvoices(queryClient: ReturnType<typeof useQueryClient>, selectedInvoiceId: string | null) {
  void queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });

  if (selectedInvoiceId) {
    void queryClient.invalidateQueries({ queryKey: ['portal-invoice', selectedInvoiceId] });
  }
}

export function usePortalInvoiceRealtime(
  selectedInvoiceId: string | null,
  onPaid?: (invoiceId: string) => void
) {
  const queryClient = useQueryClient();
  const notifiedInvoiceIdRef = useRef<string | null>(null);
  const onPaidRef = useRef(onPaid);

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    const channel = supabase
      .channel('portal-invoices-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'smartstay',
          table: 'invoices',
        },
        (payload) => {
          const nextRow = payload.new as InvoiceRealtimeRow;
          const invoiceId = String(nextRow.id);

          refreshPortalInvoices(queryClient, selectedInvoiceId);

          if (selectedInvoiceId && selectedInvoiceId === invoiceId) {
            if (nextRow.status === 'paid' && notifiedInvoiceIdRef.current !== invoiceId) {
              notifiedInvoiceIdRef.current = invoiceId;
              onPaidRef.current?.(invoiceId);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          refreshPortalInvoices(queryClient, selectedInvoiceId);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, selectedInvoiceId]);

  useEffect(() => {
    const refresh = () => {
      refreshPortalInvoices(queryClient, selectedInvoiceId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, selectedInvoiceId]);
}
