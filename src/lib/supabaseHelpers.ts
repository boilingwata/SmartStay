import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'

/**
 * Unwrap a Supabase query result: throw on error, return data.
 * Works seamlessly with React Query's throw-on-error pattern.
 */
export async function unwrap<T>(
  promise: PromiseLike<PostgrestSingleResponse<T> | PostgrestResponse<T>>
): Promise<T> {
  const { data, error } = await promise
  if (error) {
    throw new Error(error.message)
  }
  return data as T
}

/**
 * Apply building_id filter to a Supabase query when a building is selected.
 * Uses generic passthrough to preserve the full query builder type.
 */
export function buildingScoped<Q extends { eq: (...args: any[]) => any }>(
  query: Q,
  buildingId: string | number | null | undefined
): Q {
  if (buildingId) {
    return query.eq('building_id', Number(buildingId))
  }
  return query
}
