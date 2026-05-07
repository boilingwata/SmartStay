import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Dashboard = lazy(() => import('@/views/super-admin/Dashboard'));
const OrganizationsList = lazy(() => import('@/views/super-admin/organizations/OrganizationsList'));
const OrganizationDetail = lazy(() => import('@/views/super-admin/organizations/OrganizationDetail'));
const OwnersList = lazy(() => import('@/views/super-admin/owners/OwnersList'));
const OwnerDetail = lazy(() => import('@/views/super-admin/owners/OwnerDetail'));
const BillingCenter = lazy(() => import('@/views/super-admin/billing/BillingCenter'));
const SystemConfigPage = lazy(() => import('@/views/super-admin/system-config/SystemConfigPage'));
const AuditCenter = lazy(() => import('@/views/super-admin/audit/AuditCenter'));
const OwnerSupportPage = lazy(() => import('@/views/super-admin/support/OwnerSupportPage'));

export const superAdminRoutes: RouteObject[] = [
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'organizations', element: <OrganizationsList /> },
  { path: 'organizations/:id', element: <OrganizationDetail /> },
  { path: 'owners', element: <OwnersList /> },
  { path: 'owners/:id', element: <OwnerDetail /> },
  { path: 'billing', element: <BillingCenter /> },
  { path: 'system-config', element: <SystemConfigPage /> },
  { path: 'audit', element: <AuditCenter /> },
  { path: 'support', element: <OwnerSupportPage /> },
];

export default superAdminRoutes;
