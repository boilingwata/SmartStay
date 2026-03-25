import { useEffect, useCallback } from 'react';
import useAuthStore from '@/stores/authStore';
import usePermissionStore from '@/stores/permissionStore';

export const usePermission = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'Viewer';

  const permissions = usePermissionStore((s) => s.permissions);
  const loadedForRole = usePermissionStore((s) => s.loadedForRole);
  const fetchPermissions = usePermissionStore((s) => s.fetchPermissions);

  useEffect(() => {
    if (role && loadedForRole !== role) {
      fetchPermissions(role);
    }
  }, [role, loadedForRole, fetchPermissions]);

  const can = useCallback(
    (permissionKey: string): boolean => {
      if (role === 'Admin') return true;
      return permissions.includes(permissionKey);
    },
    [role, permissions]
  );

  return {
    can,
    hasPermission: can,
    role,
  };
};

export default usePermission;
