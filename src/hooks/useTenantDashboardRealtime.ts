import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type UseTenantDashboardRealtimeOptions = {
  tenantId?: number | null;
  profileId?: string | null;
  contractIds?: number[];
};

export function useTenantDashboardRealtime(options: UseTenantDashboardRealtimeOptions) {
  const queryClient = useQueryClient();
  const tenantId = options.tenantId ?? null;
  const profileId = options.profileId ?? null;
  const contractIds = Array.from(
    new Set((options.contractIds ?? []).map((contractId) => Number(contractId)).filter(Number.isInteger))
  ).sort((left, right) => left - right);
  const contractKey = contractIds.join(',');
  const flushTimeoutRef = useRef<number | null>(null);
  const pendingRef = useRef({
    dashboard: false,
    portalNotifications: false,
    portalInvoices: false,
    portalActiveContract: false,
  });

  const resetPendingState = (state: (typeof pendingRef)['current']) => {
    state.dashboard = false;
    state.portalNotifications = false;
    state.portalInvoices = false;
    state.portalActiveContract = false;
  };

  useEffect(() => {
    if (!tenantId || !profileId) {
      return;
    }

    const pendingState = pendingRef.current;

    const scheduleFlush = () => {
      if (flushTimeoutRef.current !== null) {
        return;
      }

      flushTimeoutRef.current = window.setTimeout(() => {
        flushTimeoutRef.current = null;

        if (pendingState.dashboard) {
          void queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
        }
        if (pendingState.portalNotifications) {
          void queryClient.invalidateQueries({ queryKey: ['portal-notifications', profileId] });
        }
        if (pendingState.portalInvoices) {
          void queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
        }
        if (pendingState.portalActiveContract) {
          void queryClient.invalidateQueries({ queryKey: ['portal-active-contract'] });
        }

        resetPendingState(pendingState);
      }, 250);
    };

    const queueInvalidation = (updater: (state: typeof pendingRef.current) => void) => {
      updater(pendingState);
      scheduleFlush();
    };

    const invoiceFilter = contractKey ? `contract_id=in.(${contractKey})` : null;
    let channel = supabase
      .channel(`tenant-dashboard:${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'tickets', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queueInvalidation((state) => {
            state.dashboard = true;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'tenant_balances', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queueInvalidation((state) => {
            state.dashboard = true;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'notifications', filter: `profile_id=eq.${profileId}` },
        () => {
          queueInvalidation((state) => {
            state.dashboard = true;
            state.portalNotifications = true;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'contract_tenants', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queueInvalidation((state) => {
            state.dashboard = true;
            state.portalActiveContract = true;
          });
        }
      );

    if (invoiceFilter) {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'smartstay', table: 'invoices', filter: invoiceFilter },
          () => {
            queueInvalidation((state) => {
              state.dashboard = true;
              state.portalInvoices = true;
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'smartstay', table: 'invoices', filter: invoiceFilter },
          () => {
            queueInvalidation((state) => {
              state.dashboard = true;
              state.portalInvoices = true;
            });
          }
        );
    }

    channel = channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        queueInvalidation((state) => {
          state.dashboard = true;
          state.portalNotifications = true;
          state.portalInvoices = true;
          state.portalActiveContract = true;
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
  }, [contractKey, profileId, queryClient, tenantId]);
}

export default useTenantDashboardRealtime;
