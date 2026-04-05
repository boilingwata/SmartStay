import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type InvoiceRealtimeRow = {
  id: number;
  status: string | null;
};

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

          queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });

          if (selectedInvoiceId && selectedInvoiceId === invoiceId) {
            queryClient.invalidateQueries({ queryKey: ['portal-invoice', selectedInvoiceId] });

            if (nextRow.status === 'paid' && notifiedInvoiceIdRef.current !== invoiceId) {
              notifiedInvoiceIdRef.current = invoiceId;
              onPaidRef.current?.(invoiceId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, selectedInvoiceId]);
}
