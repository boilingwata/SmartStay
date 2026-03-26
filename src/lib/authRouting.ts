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
  if (user.role !== 'Tenant') return '/admin/dashboard';
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
    if (user.role !== 'Tenant') {
      return safePath.startsWith('/portal') ? '/admin/dashboard' : safePath;
    }

    if (safePath.startsWith('/listings')) return safePath;
    if (isResidentTenantStage(user.tenantStage) && safePath.startsWith('/portal')) return safePath;
  }

  return getAuthenticatedHomePath(user);
}
