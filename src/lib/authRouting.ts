import type { User } from '@/models/User';
import type { TenantStage } from '@/types';

export const RESIDENT_TENANT_STAGES: TenantStage[] = ['resident_pending_onboarding', 'resident_active'];

export function isResidentTenantStage(stage?: TenantStage | null): boolean {
  return !!stage && RESIDENT_TENANT_STAGES.includes(stage);
}

export function getTenantHomePath(stage?: TenantStage | null): string {
  switch (stage) {
    case 'resident_pending_onboarding':
      return '/portal/onboarding';
    case 'resident_active':
      return '/portal/dashboard';
    case 'applicant':
    case 'prospect':
    default:
      return '/listings';
  }
}

export function getAuthenticatedHomePath(user?: Pick<User, 'role' | 'tenantStage'> | null): string {
  if (!user) return '/';
  if (user.role === 'SuperAdmin') return '/super-admin/dashboard';
  if (user.role === 'Owner') return '/owner/dashboard';
  if (user.role === 'Staff') return '/staff/dashboard';
  if (user.role !== 'Tenant') return '/owner/dashboard';
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
      return safePath.startsWith('/super-admin') ? safePath : '/super-admin/dashboard';
    }

    if (user.role === 'Owner') {
      if (safePath.startsWith('/owner')) return safePath;
      if (safePath.startsWith('/admin')) return safePath.replace('/admin', '/owner');
      return '/owner/dashboard';
    }

    if (user.role === 'Staff') {
      if (safePath.startsWith('/staff')) return safePath;
      if (safePath.startsWith('/admin')) return safePath.replace('/admin', '/staff');
      return '/staff/dashboard';
    }

    if (user.role !== 'Tenant') {
      return '/owner/dashboard';
    }

    if (safePath.startsWith('/listings')) return safePath;
    if (isResidentTenantStage(user.tenantStage) && safePath.startsWith('/portal')) return safePath;
  }

  return getAuthenticatedHomePath(user);
}
