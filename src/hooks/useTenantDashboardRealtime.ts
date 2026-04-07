import { useEffect } from 'react';
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
  const contractIds = options.contractIds ?? [];
  const contractKey = contractIds.slice().sort((left, right) => left - right).join(',');

  useEffect(() => {
    if (!tenantId || !profileId) {
      return;
    }

    const watchedContracts = new Set(contractIds);
    const channel = supabase
      .channel(`tenant-dashboard:${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'tickets', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'tenant_balances', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'notifications', filter: `profile_id=eq.${profileId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['portal-notifications', profileId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'invoices' },
        (payload) => {
          const contractId = Number((payload.new as { contract_id?: number } | null)?.contract_id ?? (payload.old as { contract_id?: number } | null)?.contract_id);
          if (watchedContracts.has(contractId)) {
            queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'smartstay', table: 'contract_tenants', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['portal-active-contract'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [contractKey, profileId, queryClient, tenantId]);
}

export default useTenantDashboardRealtime;
