export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  PUBLIC_LOGIN: '/public/login',
  FORGOT_PASSWORD: '/public/forgot-password',
  RESET_PASSWORD: '/public/reset-password',
  REGISTER: '/public/register',
  
  ADMIN: {
    DASHBOARD: '/dashboard',
    INVOICES: '/invoices',
    CONTRACTS: '/contracts',
    PAYMENTS: '/payments',
    TENANTS: '/tenants',
    ROOMS: '/rooms',
    BUILDINGS: '/buildings',
    OWNERS: '/owners',
    TICKETS: '/tickets',
    STAFF: '/staff',
    REPORTS: '/reports',
    SETTINGS: '/settings',
    METERS: '/meters',
  },
  
  PORTAL: {
    ROOT: '/portal',
    DASHBOARD: '/portal',
    INVOICES: '/portal/invoices',
    TICKETS: '/portal/tickets',
    AMENITIES: '/portal/amenities',
    VISITORS: '/portal/visitors',
    ANNOUNCEMENTS: '/portal/announcements',
    PROFILE: '/portal/profile',
    ONBOARDING: '/portal/onboarding',
  }
};
