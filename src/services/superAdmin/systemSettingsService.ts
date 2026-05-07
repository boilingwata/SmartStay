import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseHelpers';
import type { Json } from '@/types/supabase';

async function getRaw(key: string): Promise<Json | undefined> {
  const row = await unwrap(
    supabase.from('system_settings').select('value').eq('key', key).maybeSingle(),
  );
  return (row as { value?: Json } | null)?.value;
}

export async function getMaintenanceState(): Promise<{ enabled: boolean; message: string }> {
  const en = await getRaw('maintenance.enabled');
  const msg = await getRaw('maintenance.message');
  const enabled = en === true || en === 'true';
  let message = 'He thong dang bao tri.';
  if (typeof msg === 'string') message = msg;
  else if (msg != null && typeof msg === 'object' && 'message' in (msg as object)) {
    message = String((msg as { message?: string }).message ?? message);
  }
  return { enabled, message };
}

export async function setMaintenanceState(enabled: boolean, message: string): Promise<void> {
  await unwrap(
    supabase.from('system_settings').upsert(
      {
        key: 'maintenance.enabled',
        value: enabled as unknown as Json,
        group_name: 'platform',
        description: 'Bao tri toan he thong',
        is_sensitive: false,
      },
      { onConflict: 'key' },
    ),
  );
  await unwrap(
    supabase.from('system_settings').upsert(
      {
        key: 'maintenance.message',
        value: message as unknown as Json,
        group_name: 'platform',
        description: 'Thong bao hien thi khi bao tri',
        is_sensitive: false,
      },
      { onConflict: 'key' },
    ),
  );
}

export async function getEmailIdentity(): Promise<{ fromName: string; fromAddress: string }> {
  const nameVal = await getRaw('email.from_name');
  const addrVal = await getRaw('email.from_address');
  const fromName = typeof nameVal === 'string' ? nameVal : 'SmartStay';
  const fromAddress = typeof addrVal === 'string' ? addrVal : '';
  return { fromName, fromAddress };
}

export async function setEmailIdentity(fromName: string, fromAddress: string): Promise<void> {
  await unwrap(
    supabase.from('system_settings').upsert(
      {
        key: 'email.from_name',
        value: fromName as unknown as Json,
        group_name: 'platform',
        description: 'Ten hien thi gui email',
        is_sensitive: false,
      },
      { onConflict: 'key' },
    ),
  );
  await unwrap(
    supabase.from('system_settings').upsert(
      {
        key: 'email.from_address',
        value: fromAddress as unknown as Json,
        group_name: 'platform',
        description: 'Dia chi From',
        is_sensitive: false,
      },
      { onConflict: 'key' },
    ),
  );
}

export async function getPlatformInvoiceGraceDays(): Promise<number> {
  const v = await getRaw('platform_invoice.grace_days');
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n)) return n;
  }
  return 7;
}
