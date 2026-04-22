import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, UserRoleType } from '../models/User'
import { supabase } from '@/lib/supabase'
import { mapRole } from '@/lib/enumMaps'
import { setSentryUser } from '@/lib/sentry'
import { isResidentTenantStage } from '@/lib/authRouting'
import portalOnboardingService from '@/services/portalOnboardingService'
import useUIStore from './uiStore'

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRoleType | null;
  isLoading: boolean;
  sessionExpired: boolean;
  authMode: 'supabase' | null;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string, options?: LoginOptions) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setSessionExpired: (expired: boolean) => void;
  unsubscribeAuth?: () => void;
}

interface LoginOptions {
  allowedRoles?: UserRoleType[];
  invalidRoleMessage?: string;
}

interface ProfileRow {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: string
  tenant_stage: User['tenantStage']
  is_active: boolean | null
  created_at: string | null
}

type SessionUserLike = {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>()

  if (error || !data) return null

  const role = mapRole.fromDb(data.role) as UserRoleType
  let tenantOnboarding = null
  if (role === 'Tenant' && isResidentTenantStage(data.tenant_stage)) {
    try {
      tenantOnboarding = await portalOnboardingService.getStatusForProfile(userId)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] Failed to fetch onboarding status, falling back to 0%:', err)
      tenantOnboarding = { completionPercent: 0 }
    }
  }

  return {
    id: data.id,
    username: data.full_name,
    fullName: data.full_name,
    email: '',
    phone: data.phone ?? undefined,
    avatar: data.avatar_url ?? undefined,
    role,
    tenantStage: data.tenant_stage,
    isActive: data.is_active ?? true,
    isTwoFactorEnabled: false,
    completionPercent: tenantOnboarding?.completionPercent,
    createdAt: data.created_at ?? undefined,
  }
}

function resolveWorkspaceRole(sessionUser: SessionUserLike): UserRoleType | null {
  const appRole = typeof sessionUser.app_metadata?.workspace_role === 'string'
    ? sessionUser.app_metadata.workspace_role
    : null
  const normalizedRole = appRole?.toLowerCase()

  if (normalizedRole === 'super_admin') return 'SuperAdmin'
  if (normalizedRole === 'owner') return 'Owner'
  if (normalizedRole === 'staff') return 'Staff'
  if (normalizedRole === 'tenant') return 'Tenant'
  return null
}

function buildSuperAdminUser(sessionUser: SessionUserLike): User {
  const fullName =
    (typeof sessionUser.user_metadata?.full_name === 'string' && sessionUser.user_metadata.full_name.trim()) ||
    (typeof sessionUser.user_metadata?.username === 'string' && sessionUser.user_metadata.username.trim()) ||
    'Platform Super Admin'

  return {
    id: sessionUser.id,
    username: fullName.toLowerCase().replace(/\s+/g, '.'),
    fullName,
    email: sessionUser.email ?? '',
    role: 'SuperAdmin',
    isActive: true,
    isTwoFactorEnabled: false,
  }
}

async function resolveAuthenticatedUser(sessionUser: SessionUserLike): Promise<User | null> {
  const workspaceRole = resolveWorkspaceRole(sessionUser)

  if (workspaceRole === 'SuperAdmin') {
    return buildSuperAdminUser(sessionUser)
  }

  const profile = await fetchProfile(sessionUser.id)
  if (!profile) return null

  profile.email = sessionUser.email ?? ''
  return profile
}

async function syncSessionUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  return resolveAuthenticatedUser(session.user)
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      isLoading: true,
      sessionExpired: false,
      authMode: null,

      initialize: async () => {
        try {
          const profile = await syncSessionUser()

          if (profile) {
            if (!profile.isActive) {
              await supabase.auth.signOut()
              set({ isLoading: false, isAuthenticated: false, user: null, role: null, authMode: null })
              return
            }

            set({
              user: profile,
              isAuthenticated: true,
              role: profile.role,
              isLoading: false,
              sessionExpired: false,
              authMode: 'supabase',
            })
            setSentryUser({ id: profile.id, email: profile.email, role: profile.role })
          } else {
            set({ isLoading: false, isAuthenticated: false, user: null, role: null, authMode: null })
          }

          const { unsubscribeAuth } = get()
          if (unsubscribeAuth) unsubscribeAuth()

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
              set({ user: null, isAuthenticated: false, role: null, sessionExpired: false, authMode: null })
              return
            }

            if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              const refreshedProfile = await resolveAuthenticatedUser(session.user)
              if (refreshedProfile) {
                if (!refreshedProfile.isActive) {
                  await supabase.auth.signOut()
                  set({ user: null, isAuthenticated: false, role: null, sessionExpired: false, authMode: null })
                  return
                }

                set({
                  user: refreshedProfile,
                  isAuthenticated: true,
                  role: refreshedProfile.role,
                  sessionExpired: false,
                  authMode: 'supabase',
                })
                setSentryUser({ id: refreshedProfile.id, email: refreshedProfile.email, role: refreshedProfile.role })
              }
            }
          })

          set({ unsubscribeAuth: subscription.unsubscribe })
        } catch {
          set({ isLoading: false })
        }
      },

      refreshUser: async () => {
        const profile = await syncSessionUser()
        if (!profile) {
          set({ user: null, isAuthenticated: false, role: null, sessionExpired: false, authMode: null })
          return
        }

        set({
          user: profile,
          isAuthenticated: true,
          role: profile.role,
          sessionExpired: false,
          authMode: 'supabase',
        })
      },

      login: async (email: string, password: string, options?: LoginOptions) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (!data.user) throw new Error('Đăng nhập thất bại')

        const profile = await resolveAuthenticatedUser(data.user)
        if (!profile) throw new Error('Không tìm thấy hồ sơ người dùng')

        if (!profile.isActive) {
          await supabase.auth.signOut()
          throw new Error('Tài khoản đã bị vô hiệu hóa')
        }

        if (options?.allowedRoles && !options.allowedRoles.includes(profile.role)) {
          await supabase.auth.signOut()
          throw new Error(options.invalidRoleMessage ?? 'You are not allowed to sign in here')
        }

        set({
          user: profile,
          isAuthenticated: true,
          role: profile.role,
          sessionExpired: false,
          authMode: 'supabase',
        })
        setSentryUser({ id: profile.id, email: profile.email, role: profile.role })
      },

      logout: async () => {
        try {
          if (get().authMode === 'supabase') {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Lỗi đăng xuất từ Supabase:', error)
        } finally {
          // Reset UI context (buildingId, etc.)
          useUIStore.getState().resetContext()

          set({ user: null, isAuthenticated: false, role: null, sessionExpired: false, authMode: null })
          setSentryUser(null)
          localStorage.removeItem('smartstay-auth-storage')
        }
      },

      setUser: (user) => set({ user, role: user.role }),

      clearAuth: () => set({ user: null, isAuthenticated: false, role: null, sessionExpired: false, authMode: null }),
      setSessionExpired: (expired) => set({ sessionExpired: expired }),
    }),
    {
      name: 'smartstay-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        authMode: state.authMode,
      }),
    }
  )
)

export default useAuthStore
