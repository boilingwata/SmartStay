import { create } from 'zustand';
import { permissionService } from '@/services/permissionService';

interface PermissionState {
  permissions: string[];
  loadedForRole: string | null;
  fetchPermissions: (role: string) => Promise<void>;
  reset: () => void;
}

const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  loadedForRole: null,

  fetchPermissions: async (role: string) => {
    // Skip if already loaded for this role
    if (get().loadedForRole === role) return;
    const permissions = await permissionService.getPermissionsForRole(role);
    set({ permissions, loadedForRole: role });
  },

  reset: () => set({ permissions: [], loadedForRole: null }),
}));

export default usePermissionStore;
