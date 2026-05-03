/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * webhook-payment
 *
 * Backward-compatible payment webhook entrypoint.
 * Prefer using /functions/v1/sepay-webhook directly for SePay.
 */

import { createAdminClient } from '../_shared/supabaseAdmin.ts';

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider');

  if (provider !== 'sepay') {
    return json({ success: false, error: 'unsupported_provider' }, 400);
  }

  const allowDemo = Deno.env.get('SEPAY_ALLOW_DEMO') === 'true';
  const isDemoRequest = req.headers.get('x-smartstay-demo') === 'true';
  const expectedApiKey =
    Deno.env.get('SEPAY_WEBHOOK_API_KEY')
    ?? Deno.env.get('SEPAY_API_KEY')
    ?? '';

  if (isDemoRequest && !allowDemo) {
    return json({ success: false, error: 'demo_not_enabled' }, 403);
  }

  if (!isDemoRequest && !expectedApiKey) {
    console.error('[webhook-payment] Missing SePay webhook API key configuration');
    return json({ success: false, error: 'missing_api_key_configuration' }, 500);
  }

  if (expectedApiKey && !isDemoRequest) {
    const authHeader = req.headers.get('authorization') ?? '';
    if (authHeader !== `Apikey ${expectedApiKey}`) {
      return json({ success: false, error: 'invalid_api_key' }, 401);
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: 'parse_error' }, 400);
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc('handle_sepay_webhook', {
    p_payload: payload,
    p_api_key: expectedApiKey || null,
    p_received_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[webhook-payment] handle_sepay_webhook RPC error:', error);
    return json({ success: false, error: 'processing_failed', detail: error.message }, 500);
  }

  return json({
    success: true,
    demo: isDemoRequest || undefined,
    ...(data as Record<string, unknown> ?? { status: 'processed', provider: 'sepay' }),
  });
});
