import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, UserRoleType } from '../models/User'
import { supabase } from '@/lib/supabase'
import { mapRole } from '@/lib/enumMaps'
import { setSentryUser } from '@/lib/sentry'
import { isResidentTenantStage } from '@/lib/authRouting'
import portalOnboardingService from '@/services/portalOnboardingService'

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRoleType | null;
  isLoading: boolean;
  sessionExpired: boolean;
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

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>()

  if (error || !data) return null

  const role = mapRole.fromDb(data.role) as UserRoleType
  const tenantOnboarding = role === 'Tenant' && isResidentTenantStage(data.tenant_stage)
    ? await portalOnboardingService.getStatusForProfile(userId)
    : null

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

async function syncSessionUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const profile = await fetchProfile(session.user.id)
  if (!profile) return null

  profile.email = session.user.email ?? ''
  return profile
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      isLoading: true,
      sessionExpired: false,

      initialize: async () => {
        try {
          const profile = await syncSessionUser()

          if (profile) {
            set({
              user: profile,
              isAuthenticated: true,
              role: profile.role,
              isLoading: false,
              sessionExpired: false,
            })
            setSentryUser({ id: profile.id, email: profile.email, role: profile.role })
          } else {
            set({ isLoading: false, isAuthenticated: false, user: null, role: null })
          }

          const { unsubscribeAuth } = get();
          if (unsubscribeAuth) unsubscribeAuth();

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
              set({ user: null, isAuthenticated: false, role: null, sessionExpired: false })
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              const current = get().user
              if (!current || current.id !== session.user.id) {
                const refreshedProfile = await fetchProfile(session.user.id)
                if (refreshedProfile) {
                  refreshedProfile.email = session.user.email ?? ''
                  set({ user: refreshedProfile, isAuthenticated: true, role: refreshedProfile.role })
                }
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
          set({ user: null, isAuthenticated: false, role: null, sessionExpired: false })
          return
        }

        set({
          user: profile,
          isAuthenticated: true,
          role: profile.role,
          sessionExpired: false,
        })
      },

      login: async (email: string, password: string, options?: LoginOptions) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (!data.user) throw new Error('Login failed')

        const profile = await fetchProfile(data.user.id)
        if (!profile) throw new Error('Profile not found')

        if (options?.allowedRoles && !options.allowedRoles.includes(profile.role)) {
          await supabase.auth.signOut()
          throw new Error(options.invalidRoleMessage ?? 'You are not allowed to sign in here')
        }

        profile.email = data.user.email ?? ''
        set({
          user: profile,
          isAuthenticated: true,
          role: profile.role,
          sessionExpired: false,
        })
        setSentryUser({ id: profile.id, email: profile.email, role: profile.role })
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, role: null, sessionExpired: false })
        setSentryUser(null)
        localStorage.removeItem('smartstay-auth-storage')
      },

      setUser: (user) => set({ user, role: user.role }),

      clearAuth: () => set({ user: null, isAuthenticated: false, role: null, sessionExpired: false }),
      setSessionExpired: (expired) => set({ sessionExpired: expired }),
    }),
    {
      name: 'smartstay-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
)

export default useAuthStore
