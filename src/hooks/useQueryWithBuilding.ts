import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import useUIStore from '@/stores/uiStore';

/**
 * A wrapper around useQuery that automatically injects the activeBuildingId 
 * from uiStore into the queryKey and optionally into the queryFn.
 */
export function useQueryWithBuilding<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  options: {
    queryKey: QueryKey;
    queryFn: (params: { buildingId: string | number | null }) => Promise<TQueryFnData>;
  } & Omit<UseQueryOptions<TQueryFnData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const { queryKey, queryFn, ...rest } = options;

  return useQuery<TQueryFnData, TError, TData, QueryKey>({
    // Append activeBuildingId to the query key so it refetches when building changes
    queryKey: [...queryKey, activeBuildingId],
    queryFn: () => queryFn({ buildingId: activeBuildingId }),
    ...rest,
  });
}
