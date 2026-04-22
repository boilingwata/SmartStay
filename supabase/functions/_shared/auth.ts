import { createAdminClient } from './supabaseAdmin.ts';
import { errorResponse } from './errors.ts';
import * as jose from 'jsr:@panva/jose@6';

export type WorkspaceRole = 'owner' | 'staff' | 'tenant' | 'super_admin';
export type WorkspaceOperatorRole = 'owner' | 'staff' | 'super_admin';

export interface Caller {
  userId: string;
  role: WorkspaceRole;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function normalizeWorkspaceRole(value: unknown): WorkspaceRole | null {
  const normalizedRole = typeof value === 'string' ? value.toLowerCase() : null;

  if (normalizedRole === 'super_admin') return 'super_admin';
  if (normalizedRole === 'owner' || normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'landlord') {
    return 'owner';
  }
  if (normalizedRole === 'staff') return 'staff';
  if (normalizedRole === 'tenant' || normalizedRole === 'viewer') return 'tenant';
  return null;
}

const SUPABASE_JWT_ISSUER =
  Deno.env.get('SB_JWT_ISSUER') ?? `${Deno.env.get('SUPABASE_URL')}/auth/v1`;
const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(`${Deno.env.get('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`),
);

export function extractJwt(req: Request): string {
  const auth = req.headers.get('authorization');
  const jwt = auth?.replace(/^Bearer\s+/i, '');
  if (!jwt) throw new AuthError('Missing Authorization header');
  return jwt;
}

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

  const metadataRole = normalizeWorkspaceRole(payload.app_metadata?.workspace_role);

  if (metadataRole === 'super_admin') {
    return { userId, role: 'super_admin' };
  }

  const client = createAdminClient();
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new AuthError('Failed to resolve caller profile', 500);

  const normalizedRole = normalizeWorkspaceRole(profile?.role ?? 'tenant');
  if (!normalizedRole || normalizedRole === 'super_admin') {
    throw new AuthError(`Unsupported caller role "${String(profile?.role ?? 'unknown')}"`, 403);
  }

  return { userId, role: normalizedRole };
}

export async function requireWorkspaceOperator(
  req: Request,
): Promise<{ caller: Caller; denied: null } | { caller: null; denied: Response }> {
  try {
    const caller = await requireAuth(req);
    if (caller.role === 'tenant') {
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

export async function requireOwner(
  req: Request,
): Promise<{ caller: Caller; denied: null } | { caller: null; denied: Response }> {
  const result = await requireWorkspaceOperator(req);
  if (result.denied) return result;
  if (result.caller.role !== 'owner' && result.caller.role !== 'super_admin') {
    return { caller: null, denied: errorResponse('Owner access required', 403) };
  }
  return result;
}

export async function requireSuperAdmin(
  req: Request,
): Promise<{ caller: Caller; denied: null } | { caller: null; denied: Response }> {
  const result = await requireWorkspaceOperator(req);
  if (result.denied) return result;
  if (result.caller.role !== 'super_admin') {
    return { caller: null, denied: errorResponse('Super admin access required', 403) };
  }
  return result;
}
