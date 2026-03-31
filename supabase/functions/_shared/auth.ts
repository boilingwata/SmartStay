import { createUserClient } from './supabaseAdmin.ts';
import { errorResponse } from './errors.ts';

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
  const client = createUserClient(jwt);

  // Pass jwt explicitly — auth.getUser() without an argument looks for a
  // persisted session which doesn't exist in the edge runtime (persistSession: false).
  // auth.getUser(jwt) validates directly against the auth server regardless of session state.
  const { data: { user }, error } = await client.auth.getUser(jwt);
  if (error || !user) throw new AuthError('Invalid or expired token');

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { userId: user.id, role: (profile?.role as AnyRole) ?? 'tenant' };
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
