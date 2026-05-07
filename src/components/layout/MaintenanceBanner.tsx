import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

import { getMaintenanceState } from '@/services/superAdmin/systemSettingsService';

export const MaintenanceBanner: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'maintenance-banner'],
    queryFn: getMaintenanceState,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  if (isLoading || !data?.enabled) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[200] border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-center text-sm font-semibold text-amber-950 dark:text-amber-100"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        {data.message}
      </span>
    </div>
  );
};

export default MaintenanceBanner;
