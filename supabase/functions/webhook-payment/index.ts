/**
 * webhook-payment
 *
 * Receives payment confirmation callbacks from VNPay, MoMo, and ZaloPay.
 * Called by gateway servers, NOT the browser — no JWT auth required.
 * Always returns HTTP 200 to prevent gateway retries on validation failures.
 *
 * URL: <SUPABASE_URL>/functions/v1/webhook-payment?provider=vnpay|momo|zalopay
 *
 * Required secrets (set via `supabase secrets set`):
 *   VNPAY_HASH_SECRET
 *   MOMO_SECRET_KEY
 *   ZALOPAY_KEY2
 */

import { createAdminClient } from '../_shared/supabaseAdmin.ts';

// ---------------------------------------------------------------------------
// HMAC verification helpers
// ---------------------------------------------------------------------------

async function hmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyVnpay(payload: Record<string, string>): Promise<boolean> {
  const secret = Deno.env.get('VNPAY_HASH_SECRET') ?? '';
  if (!secret) return false;

  const vnpSecureHash = payload['vnp_SecureHash'] ?? '';
  const filtered = Object.fromEntries(
    Object.entries(payload)
      .filter(([k]) => k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType')
      .sort(([a], [b]) => a.localeCompare(b))
  );
  const signData = new URLSearchParams(filtered).toString();
  const expected = await hmacSha256(secret, signData);
  return expected.toLowerCase() === vnpSecureHash.toLowerCase();
}

async function verifyMomo(payload: Record<string, unknown>): Promise<boolean> {
  const secret = Deno.env.get('MOMO_SECRET_KEY') ?? '';
  if (!secret) return false;

  const { partnerCode, orderId, requestId, amount, orderInfo, orderType,
          transId, resultCode, message, payType, responseTime, extraData } = payload as Record<string, string>;
  const rawSignature = [
    `accessKey=${Deno.env.get('MOMO_ACCESS_KEY') ?? ''}`,
    `amount=${amount}`, `extraData=${extraData ?? ''}`,
    `message=${message ?? ''}`, `orderId=${orderId}`,
    `orderInfo=${orderInfo ?? ''}`, `orderType=${orderType ?? ''}`,
    `partnerCode=${partnerCode}`, `payType=${payType ?? ''}`,
    `requestId=${requestId}`, `responseTime=${responseTime ?? ''}`,
    `resultCode=${resultCode}`, `transId=${transId}`,
  ].join('&');
  const expected = await hmacSha256(secret, rawSignature);
  return expected === (payload['signature'] as string);
}

async function verifyZalopay(payload: Record<string, unknown>): Promise<boolean> {
  const key2 = Deno.env.get('ZALOPAY_KEY2') ?? '';
  if (!key2) return false;

  const data = payload['data'] as string ?? '';
  const expected = await hmacSha256(key2, data);
  return expected === (payload['mac'] as string);
}

// ---------------------------------------------------------------------------
// Provider-specific success + reference extraction
// ---------------------------------------------------------------------------

type Provider = 'vnpay' | 'momo' | 'zalopay';

function isSuccess(provider: Provider, payload: Record<string, unknown>): boolean {
  if (provider === 'vnpay') return payload['vnp_ResponseCode'] === '00';
  if (provider === 'momo') return payload['resultCode'] === 0 || payload['resultCode'] === '0';
  if (provider === 'zalopay') return payload['return_code'] === 1 || payload['return_code'] === '1';
  return false;
}

function extractReference(provider: Provider, payload: Record<string, unknown>): string {
  if (provider === 'vnpay') return String(payload['vnp_TransactionNo'] ?? payload['vnp_TxnRef'] ?? '');
  if (provider === 'momo') return String(payload['transId'] ?? payload['orderId'] ?? '');
  if (provider === 'zalopay') return String(payload['zp_trans_id'] ?? '');
  return '';
}

/** Extract our internal invoice ID from the order/ref field. */
function extractInvoiceId(provider: Provider, payload: Record<string, unknown>): number | null {
  let orderRef = '';
  if (provider === 'vnpay') orderRef = String(payload['vnp_TxnRef'] ?? '');
  if (provider === 'momo') orderRef = String(payload['orderId'] ?? '');
  if (provider === 'zalopay') {
    try {
      const data = JSON.parse(payload['data'] as string ?? '{}');
      orderRef = String(data['app_trans_id'] ?? '');
    } catch { /* ignore */ }
  }
  // Convention: order ref is "<invoiceId>-<timestamp>" or just "<invoiceId>"
  const invoiceId = parseInt(orderRef.split('-')[0], 10);
  return Number.isFinite(invoiceId) ? invoiceId : null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

function ok(body: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ rspCode: '00', ...body }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider') as Provider | null;

  if (!provider || !['vnpay', 'momo', 'zalopay'].includes(provider)) {
    return ok({ error: 'unknown_provider' });
  }

  let payload: Record<string, unknown>;
  try {
    const text = await req.text();
    // Gateways send either JSON or URL-encoded form data
    if (req.headers.get('content-type')?.includes('application/json')) {
      payload = JSON.parse(text);
    } else {
      payload = Object.fromEntries(new URLSearchParams(text));
    }
  } catch {
    return ok({ error: 'parse_error' });
  }

  // 1. Verify HMAC signature
  let signatureValid = false;
  try {
    if (provider === 'vnpay') signatureValid = await verifyVnpay(payload as Record<string, string>);
    if (provider === 'momo')  signatureValid = await verifyMomo(payload);
    if (provider === 'zalopay') signatureValid = await verifyZalopay(payload);
  } catch (e) {
    console.error('[webhook-payment] Signature check error:', e);
  }

  const db = createAdminClient();
  const reference = extractReference(provider, payload);

  // 2. Log immediately for idempotency (even if signature invalid)
  const { data: logRow, error: logErr } = await db
    .from('webhook_logs')
    .insert({
      provider,
      payload,
      received_at: new Date().toISOString(),
      status:      signatureValid ? 'processing' : 'failed',
      error_message: signatureValid ? null : 'invalid_signature',
    })
    .select('id')
    .single();

  if (logErr) {
    console.error('[webhook-payment] Failed to insert webhook_log:', logErr);
  }

  if (!signatureValid) {
    return ok({ error: 'invalid_signature' });
  }

  // 3. Duplicate check: same reference already processed successfully
  const { data: existing } = await db
    .from('webhook_logs')
    .select('id')
    .eq('provider', provider)
    .eq('status', 'success')
    .filter('payload->>' + (
      provider === 'vnpay' ? 'vnp_TransactionNo' :
      provider === 'momo'  ? 'transId' : 'zp_trans_id'
    ), 'eq', reference)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await db.from('webhook_logs').update({ status: 'success' }).eq('id', logRow?.id ?? 0);
    return ok({ status: 'duplicate' });
  }

  // 4. Only process successful payments
  if (!isSuccess(provider, payload)) {
    await db.from('webhook_logs')
      .update({ status: 'failed', error_message: 'payment_not_successful', processed_at: new Date().toISOString() })
      .eq('id', logRow?.id ?? 0);
    return ok({ status: 'ignored' });
  }

  // 5. Match to an invoice
  const invoiceId = extractInvoiceId(provider, payload);
  if (!invoiceId) {
    await db.from('webhook_logs')
      .update({ status: 'failed', error_message: 'invoice_id_not_found', processed_at: new Date().toISOString() })
      .eq('id', logRow?.id ?? 0);
    return ok({ error: 'invoice_not_found' });
  }

  // 6. Read payment amount from payload
  let amount = 0;
  if (provider === 'vnpay') amount = parseInt(String(payload['vnp_Amount'] ?? '0'), 10) / 100; // VNPay sends amount * 100
  if (provider === 'momo')  amount = Number(payload['amount'] ?? 0);
  if (provider === 'zalopay') {
    try { amount = JSON.parse(payload['data'] as string ?? '{}')['amount'] ?? 0; } catch { /* ignore */ }
  }

  // 7. Record payment atomically via RPC
  const { error: rpcErr } = await db.rpc('process_payment', {
    p_invoice_id:   invoiceId,
    p_amount:       amount,
    p_method:       provider === 'vnpay' ? 'vnpay' : provider === 'momo' ? 'momo' : 'zalopay',
    p_payment_date: new Date().toISOString(),
    p_notes:        `Webhook from ${provider} — ref: ${reference}`,
    p_reference:    reference,
    p_auto_confirm: true,
  });

  if (rpcErr) {
    console.error('[webhook-payment] process_payment RPC error:', rpcErr);
    await db.from('webhook_logs')
      .update({ status: 'failed', error_message: rpcErr.message, processed_at: new Date().toISOString() })
      .eq('id', logRow?.id ?? 0);
    return ok({ error: 'processing_failed' });
  }

  // 8. Mark log as success
  await db.from('webhook_logs')
    .update({ status: 'success', processed_at: new Date().toISOString() })
    .eq('id', logRow?.id ?? 0);

  return ok({ status: 'processed' });
});
