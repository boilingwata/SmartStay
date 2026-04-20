export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  PUBLIC_LOGIN: '/login',
  AUTH_HUB: '/login',
  OWNER_LOGIN: '/login',
  STAFF_LOGIN: '/login',
  SUPER_ADMIN_LOGIN: '/login',
  FORGOT_PASSWORD: '/public/forgot-password',
  RESET_PASSWORD: '/public/reset-password',
  REGISTER: '/public/register',
  
  OWNER: {
    DASHBOARD: '/owner/dashboard',
    INVOICES: '/owner/invoices',
    CONTRACTS: '/owner/contracts',
    PAYMENTS: '/owner/payments',
    TENANTS: '/owner/tenants',
    ROOMS: '/owner/rooms',
    BUILDINGS: '/owner/buildings',
    OWNERS: '/owner/owners',
    TICKETS: '/owner/tickets',
    REPORTS: '/owner/reports',
    SETTINGS: '/owner/settings',
  },

  STAFF: {
    DASHBOARD: '/staff/dashboard',
    MY_TICKETS: '/staff/my-tickets',
    VISITOR_CHECKIN: '/staff/visitor-checkin',
    AMENITY_CHECKIN: '/staff/amenity-checkin',
  },

  SUPER_ADMIN: {
    DASHBOARD: '/super-admin/dashboard',
    ORGANIZATIONS: '/super-admin/organizations',
    OWNERS: '/super-admin/owners',
    AUDIT: '/super-admin/audit',
    SETTINGS: '/super-admin/settings',
  },
  
  PORTAL: {
    ROOT: '/portal',
    DASHBOARD: '/portal',
    CONTRACTS: '/tenant/contracts',
    INVOICES: '/portal/invoices',
    TICKETS: '/portal/tickets',
    AMENITIES: '/portal/amenities',
    VISITORS: '/portal/visitors',
    ANNOUNCEMENTS: '/portal/announcements',
    PROFILE: '/portal/profile',
    ONBOARDING: '/portal/onboarding',
  }
};
