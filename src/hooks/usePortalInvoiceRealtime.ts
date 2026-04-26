import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type InvoiceRealtimeRow = {
  id?: number | null;
  contract_id?: number | null;
  status?: string | null;
};

function buildContractFilter(contractIds: string): string | null {
  if (!contractIds) return null;
  return `contract_id=in.(${contractIds})`;
}

export function usePortalInvoiceRealtime(
  selectedInvoiceId: string | null,
  watchedContractIds: number[],
  onPaid?: (invoiceId: string) => void
) {
  const queryClient = useQueryClient();
  const notifiedInvoiceIdRef = useRef<string | null>(null);
  const onPaidRef = useRef(onPaid);
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshSelectedDetailRef = useRef(false);
  const normalizedContractIds = Array.from(
    new Set(watchedContractIds.map((contractId) => Number(contractId)).filter(Number.isInteger))
  ).sort((left, right) => left - right);
  const contractKey = normalizedContractIds.join(',');

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    const contractFilter = buildContractFilter(contractKey);
    if (!contractFilter) {
      return;
    }

    const queueRefresh = (refreshSelectedDetail: boolean) => {
      refreshSelectedDetailRef.current = refreshSelectedDetailRef.current || refreshSelectedDetail;

      if (refreshTimeoutRef.current !== null) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;

        void queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });

        if (selectedInvoiceId && refreshSelectedDetailRef.current) {
          void queryClient.invalidateQueries({ queryKey: ['portal-invoice', selectedInvoiceId] });
        }

        refreshSelectedDetailRef.current = false;
      }, 250);
    };

    const handleInvoiceChange = (
      payload: {
        new: InvoiceRealtimeRow;
        old: InvoiceRealtimeRow;
      },
    ) => {
      const nextRow = payload.new as InvoiceRealtimeRow;
      const previousRow = payload.old as InvoiceRealtimeRow;
      const invoiceId = String(nextRow.id ?? previousRow.id ?? '');
      if (!invoiceId) return;

      const isSelectedInvoice = selectedInvoiceId === invoiceId;
      queueRefresh(isSelectedInvoice);

      if (
        isSelectedInvoice &&
        nextRow.status === 'paid' &&
        previousRow.status !== 'paid' &&
        notifiedInvoiceIdRef.current !== invoiceId
      ) {
        notifiedInvoiceIdRef.current = invoiceId;
        onPaidRef.current?.(invoiceId);
      }
    };

    const channel = supabase
      .channel(`portal-invoices-realtime:${contractKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'smartstay',
          table: 'invoices',
          filter: contractFilter,
        },
        (payload) => {
          handleInvoiceChange(payload as { new: InvoiceRealtimeRow; old: InvoiceRealtimeRow });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'smartstay',
          table: 'invoices',
          filter: contractFilter,
        },
        (payload) => {
          handleInvoiceChange(payload as { new: InvoiceRealtimeRow; old: InvoiceRealtimeRow });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          queueRefresh(true);
        }
      });

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      refreshSelectedDetailRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [contractKey, queryClient, selectedInvoiceId]);
}
