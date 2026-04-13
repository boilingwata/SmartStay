import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
export type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Service-role client targeting the smartstay schema.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the Supabase Edge runtime.
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      db: { schema: 'smartstay' },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

// User-scoped client: validates the caller's JWT and applies RLS.
export function createUserClient(jwt: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      db: { schema: 'smartstay' },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
