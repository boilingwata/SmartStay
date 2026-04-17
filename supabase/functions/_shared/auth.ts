import { createAdminClient } from './supabaseAdmin.ts';
import { errorResponse } from './errors.ts';
import * as jose from 'jsr:@panva/jose@6';

export type AdminRole = 'admin' | 'manager' | 'staff';
export type AnyRole = AdminRole | 'tenant';

export interface Caller {
  userId: string;
  role: AnyRole;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const SUPABASE_JWT_ISSUER =
  Deno.env.get('SB_JWT_ISSUER') ?? `${Deno.env.get('SUPABASE_URL')}/auth/v1`;
const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(`${Deno.env.get('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`)
);

/**
 * Extract JWT from Authorization header. Throws AuthError if missing.
 */
export function extractJwt(req: Request): string {
  const auth = req.headers.get('authorization');
  const jwt = auth?.replace(/^Bearer\s+/i, '');
  if (!jwt) throw new AuthError('Missing Authorization header');
  return jwt;
}

/**
 * Verify JWT with Supabase and return caller identity + role.
 * Throws AuthError on invalid/expired token.
 */
export async function requireAuth(req: Request): Promise<Caller> {
  const jwt = extractJwt(req);
  let payload: jose.JWTPayload;
  try {
    const verified = await jose.jwtVerify(jwt, SUPABASE_JWT_KEYS, {
      issuer: SUPABASE_JWT_ISSUER,
    });
    payload = verified.payload;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'JWT verification failed';
    throw new AuthError(`Invalid or expired token: ${detail}`);
  }

  const userId = typeof payload.sub === 'string' ? payload.sub : null;
  if (!userId) throw new AuthError('Invalid token payload: missing sub');

  const client = createAdminClient();
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new AuthError('Failed to resolve caller profile', 500);

  return { userId, role: (profile?.role as AnyRole) ?? 'tenant' };
}

/**
 * Require admin-level role (admin, manager, or staff). Returns an error Response if denied.
 * Usage:
 *   const denied = await requireAdminRole(req);
 *   if (denied) return denied;
 */
export async function requireAdminRole(req: Request): Promise<{ caller: Caller; denied: null } | { caller: null; denied: Response }> {
  try {
    const caller = await requireAuth(req);
    const adminRoles: AnyRole[] = ['admin', 'manager', 'staff'];
    if (!adminRoles.includes(caller.role)) {
      return { caller: null, denied: errorResponse('Insufficient permissions', 403) };
    }
    return { caller, denied: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { caller: null, denied: errorResponse(err.message, err.status) };
    }
    return { caller: null, denied: errorResponse('Authentication failed', 401) };
  }
}
