import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Onboarding = lazy(() => import('@/views/portal/onboarding/Onboarding'));
const TenantDashboard = lazy(() => import('@/views/portal/dashboard/TenantDashboard'));
const PortalInvoiceList = lazy(() => import('@/views/portal/finance/InvoiceList'));
const PortalInvoiceDetail = lazy(() => import('@/views/portal/finance/InvoiceDetail'));
const PortalTicketList = lazy(() => import('@/views/portal/tickets/TicketList'));
const PortalCreateTicket = lazy(() => import('@/views/portal/tickets/CreateTicket'));
const PortalTicketDetail = lazy(() => import('@/views/portal/tickets/TicketDetail'));
const PortalAmenityList = lazy(() => import('@/views/portal/amenities/AmenityList'));
const PortalMyBookings = lazy(() => import('@/views/portal/amenities/MyBookings'));
const PortalVisitorList = lazy(() => import('@/views/portal/visitors/VisitorList'));
const Announcements = lazy(() => import('@/views/portal/info/Announcements'));
const Faq = lazy(() => import('@/views/portal/info/Faq'));
const Profile = lazy(() => import('@/views/portal/profile/Profile'));
const NotificationCenter = lazy(() => import('@/views/portal/notifications/NotificationCenter'));
const ServiceRequests = lazy(() => import('@/views/portal/services/ServiceRequests'));
const Documents = lazy(() => import('@/views/portal/profile/Documents'));

const PortalPaymentHistory = lazy(() => import('@/views/portal/finance/PaymentHistory'));
const PortalBalanceDetail = lazy(() => import('@/views/portal/finance/BalanceDetail'));
const PortalContractView = lazy(() => import('@/views/portal/contracts/ContractView'));

export const portalRoutes: RouteObject[] = [
  { index: true, element: <TenantDashboard /> },
  { path: 'dashboard', element: <TenantDashboard /> },
  { path: 'invoices', element: <PortalInvoiceList /> },
  { path: 'invoices/:id', element: <PortalInvoiceDetail /> },
  { path: 'payments/history', element: <PortalPaymentHistory /> },
  { path: 'balance', element: <PortalBalanceDetail /> },
  { path: 'contract', element: <PortalContractView /> },
  { path: 'contracts', element: <PortalContractView /> },
  { path: 'tickets', element: <PortalTicketList /> },
  { path: 'tickets/create', element: <PortalCreateTicket /> },
  { path: 'tickets/:id', element: <PortalTicketDetail /> },
  { path: 'amenities', element: <PortalAmenityList /> },
  { path: 'amenities/my-bookings', element: <PortalMyBookings /> },
  { path: 'visitors', element: <PortalVisitorList /> },
  { path: 'announcements', element: <Announcements /> },
  { path: 'faq', element: <Faq /> },
  { path: 'profile', element: <Profile /> },
  { path: 'notifications', element: <NotificationCenter /> },
  { path: 'service-requests', element: <ServiceRequests /> },
  { path: 'documents', element: <Documents /> },
];

export { Onboarding };
