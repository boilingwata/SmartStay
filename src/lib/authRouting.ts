import type { User } from '@/models/User';
import type { TenantStage } from '@/types';

export const RESIDENT_TENANT_STAGES: TenantStage[] = ['resident_pending_onboarding', 'resident_active'];
const INTERNAL_WORKSPACE_HOME = '/owner/dashboard';

export function isResidentTenantStage(stage?: TenantStage | null): boolean {
  return !!stage && RESIDENT_TENANT_STAGES.includes(stage);
}

export function getTenantHomePath(stage?: TenantStage | null): string {
  void stage;
  return '/listings';
}

function isInternalWorkspaceRole(role?: User['role'] | null): boolean {
  return role === 'Owner' || role === 'Staff' || role === 'SuperAdmin';
}

function normalizeInternalWorkspacePath(path: string): string {
  const normalizedPath = path === '/dashboard'
    ? INTERNAL_WORKSPACE_HOME
    : path
        .replace(/^\/admin/, '/owner')
        .replace(/^\/staff/, '/owner')
        .replace(/^\/super-admin/, '/owner');

  const allowedPrefixes = [
    '/owner/dashboard',
    '/owner/buildings',
    '/owner/rooms',
    '/owner/leads',
  ];

  return allowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))
    ? normalizedPath
    : INTERNAL_WORKSPACE_HOME;
}

export function getAuthenticatedHomePath(user?: Pick<User, 'role' | 'tenantStage'> | null): string {
  if (!user) return '/';
  if (isInternalWorkspaceRole(user.role)) return INTERNAL_WORKSPACE_HOME;
  if (user.role !== 'Tenant') return INTERNAL_WORKSPACE_HOME;
  return getTenantHomePath(user.tenantStage);
}

export function sanitizeInternalRedirect(path?: string | null): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

export function getPostLoginRedirect(
  user?: Pick<User, 'role' | 'tenantStage'> | null,
  requestedPath?: string | null
): string {
  const safePath = sanitizeInternalRedirect(requestedPath);

  if (safePath && user) {
    if (isInternalWorkspaceRole(user.role) || user.role !== 'Tenant') {
      return normalizeInternalWorkspacePath(safePath);
    }

    if (safePath.startsWith('/listings')) return safePath;
  }

  return getAuthenticatedHomePath(user);
}
