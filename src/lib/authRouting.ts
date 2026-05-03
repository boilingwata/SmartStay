import type { TenantStage, User } from '@/types';

export const RESIDENT_TENANT_STAGES: TenantStage[] = ['resident_pending_onboarding', 'resident_active'];
const INTERNAL_WORKSPACE_HOME = '/owner/dashboard';
const STAFF_WORKSPACE_HOME = '/owner/staff/dashboard';
const SUPER_ADMIN_HOME = '/super-admin/dashboard';

export function isResidentTenantStage(stage?: TenantStage | null): boolean {
  return !!stage && RESIDENT_TENANT_STAGES.includes(stage);
}

export function getTenantHomePath(stage?: TenantStage | null): string {
  if (stage === 'resident_pending_onboarding') return '/portal/onboarding';
  if (stage === 'resident_active') return '/portal/dashboard';
  return '/listings';
}

function isInternalWorkspaceRole(role?: User['role'] | null): boolean {
  return role === 'Owner' || role === 'Staff';
}

function normalizePortalPath(path: string): string {
  return path.replace(/^\/tenant/, '/portal');
}

function normalizeInternalWorkspacePath(path: string, role?: User['role'] | null): string {
  const normalizedPath = path === '/dashboard'
    ? INTERNAL_WORKSPACE_HOME
    : path
        .replace(/^\/admin/, '/owner')
        .replace(/^\/staff/, '/owner')
        .replace(/^\/super-admin/, '/super-admin');

  const staffAllowedPrefixes = [
    '/owner/staff',
    '/owner/rooms',
    '/owner/tickets',
  ];

  if (role === 'Staff') {
    return staffAllowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))
      ? normalizedPath
      : STAFF_WORKSPACE_HOME;
  }

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
  if (user.role === 'SuperAdmin') return SUPER_ADMIN_HOME;
  if (user.role === 'Staff') return STAFF_WORKSPACE_HOME;
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
    if (user.role === 'SuperAdmin') {
      if (safePath.startsWith('/super-admin')) return safePath;
      return SUPER_ADMIN_HOME;
    }

    if (isInternalWorkspaceRole(user.role) || user.role !== 'Tenant') {
      return normalizeInternalWorkspacePath(safePath, user.role);
    }

    const normalizedPortalPath = normalizePortalPath(safePath);

    if (normalizedPortalPath.startsWith('/portal')) {
      return isResidentTenantStage(user.tenantStage)
        ? normalizedPortalPath
        : getTenantHomePath(user.tenantStage);
    }

    if (safePath.startsWith('/listings')) return safePath;
  }

  return getAuthenticatedHomePath(user);
}
