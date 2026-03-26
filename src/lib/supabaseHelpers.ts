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
    // Preserve Supabase error details for better debugging
    const err = new Error(error.message) as Error & {
      code?: string
      details?: string
      hint?: string
    }
    err.code    = error.code
    err.details = error.details ?? undefined
    err.hint    = error.hint ?? undefined
    throw err
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
  const numId = Number(buildingId);
  if (buildingId != null && buildingId !== '' && Number.isFinite(numId)) {
    return query.eq('building_id', numId);
  }
  return query;
}
