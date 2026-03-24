import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { PageSkeleton } from '@/components/ui/StatusStates';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';

// View Imports
const Dashboard = lazy(() => import('@/views/admin/Dashboard'));
const InvoiceList = lazy(() => import('@/views/admin/finance/InvoiceList'));
const InvoiceDetail = lazy(() => import('@/views/admin/finance/InvoiceDetail'));
const ContractList = lazy(() => import('@/views/admin/contracts/ContractList'));
const ContractDetail = lazy(() => import('@/views/admin/contracts/ContractDetail'));
const AddendumList = lazy(() => import('@/views/admin/contracts/AddendumListPage'));
const CreateContractWizard = lazy(() => import('@/views/admin/contracts/CreateContractWizard'));
const ServiceCatalog = lazy(() => import('@/views/admin/services/ServiceCatalog'));
const PaymentList = lazy(() => import('@/views/admin/finance/PaymentList'));
const PaymentDetail = lazy(() => import('@/views/admin/finance/PaymentDetail'));
const WebhookLogs = lazy(() => import('@/views/admin/finance/WebhookLogs'));
const TenantList = lazy(() => import('@/views/admin/tenants/TenantList'));
const TenantDetail = lazy(() => import('@/views/admin/tenants/TenantDetail'));
const TenantBalance = lazy(() => import('@/views/admin/tenants/TenantBalance'));
const RoomList = lazy(() => import('@/views/admin/rooms/RoomList'));
const RoomDetail = lazy(() => import('@/views/admin/rooms/RoomDetail'));
const HandoverChecklist = lazy(() => import('@/views/admin/rooms/HandoverChecklist'));
const AssetCatalog = lazy(() => import('@/views/admin/assets/AssetCatalog'));
const BuildingList = lazy(() => import('@/views/admin/buildings/BuildingList'));
const BuildingDetail = lazy(() => import('@/views/admin/buildings/BuildingDetail'));
const OwnerList = lazy(() => import('@/views/admin/owners/OwnerList'));
const OwnerDetail = lazy(() => import('@/views/admin/owners/OwnerDetail'));
const TicketList = lazy(() => import('@/views/admin/tickets/TicketList'));
const TicketDetail = lazy(() => import('@/views/admin/tickets/TicketDetail'));
const StaffRatings = lazy(() => import('@/views/admin/tickets/StaffRatings'));
const MeterList = lazy(() => import('@/views/admin/meters/MeterList'));
const BulkMeterEntry = lazy(() => import('@/views/admin/meters/BulkMeterEntry'));
const MeterReadingHistory = lazy(() => import('@/views/admin/meters/MeterReadingHistory'));
const MeterReadingConfirm = lazy(() => import('@/views/admin/meters/MeterReadingConfirm'));
const ElectricityPolicyPage = lazy(() => import('@/views/admin/settings/ElectricityPolicyPage'));
const WaterPolicyPage = lazy(() => import('@/views/admin/settings/WaterPolicyPage'));
const UserManagement = lazy(() => import('@/views/admin/settings/UserListPage'));
const PermissionMatrix = lazy(() => import('@/views/admin/settings/PermissionMatrix'));
const AuditLogs = lazy(() => import('@/views/admin/settings/AuditLogs'));
const SystemSettings = lazy(() => import('@/views/admin/settings/SystemSettings'));
const StaffDashboard = lazy(() => import('@/views/admin/staff/StaffDashboard'));
const StaffMyTickets = lazy(() => import('@/views/admin/staff/StaffMyTickets'));
const VisitorCheckin = lazy(() => import('@/views/admin/staff/VisitorCheckin'));
const AmenityCheckin = lazy(() => import('@/views/admin/staff/AmenityCheckin'));
const AnnouncementPage = lazy(() => import('@/views/admin/communications/AnnouncementPage/index'));
const NotificationPage = lazy(() => import('@/views/admin/communications/NotificationPage'));

// Reports
const ReportsHub = lazy(() => import('@/views/admin/reports/ReportsHub'));
const OccupancyReport = lazy(() => import('@/views/admin/reports/OccupancyReport'));
const FinancialReport = lazy(() => import('@/views/admin/reports/FinancialReport'));
const DebtReport = lazy(() => import('@/views/admin/reports/DebtReport'));
const ConsumptionReport = lazy(() => import('@/views/admin/reports/ConsumptionReport'));
const RoomLifecycleReport = lazy(() => import('@/views/admin/reports/RoomLifecycleReport'));
const NPSReport = lazy(() => import('@/views/admin/reports/NPSReport'));
const StaffReport = lazy(() => import('@/views/admin/reports/StaffReport'));
const AlertsReport = lazy(() => import('@/views/admin/reports/AlertsReport'));

export const adminRoutes: RouteObject[] = [
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'invoices', element: <InvoiceList /> },
  { path: 'invoices/:id', element: <InvoiceDetail /> },
  { path: 'contracts', element: <ContractList /> },
  { path: 'contracts/create', element: <CreateContractWizard /> },
  { path: 'contracts/addendums', element: <AddendumList /> },
  { path: 'contracts/:id', element: <ContractDetail /> },
  { path: 'payments', element: <PaymentList /> },
  { path: 'payments/webhooks', element: <WebhookLogs /> },
  { path: 'payments/:id', element: <PaymentDetail /> },
  { path: 'tenants', element: <TenantList /> },
  { path: 'tenants/:id', element: <TenantDetail /> },
  { path: 'tenants/:id/balance', element: <TenantBalance /> },
  { path: 'rooms', element: <RoomList /> },
  { path: 'rooms/:id', element: <RoomDetail /> },
  { path: 'rooms/:id/handover', element: <HandoverChecklist /> },
  { path: 'assets', element: <AssetCatalog /> },
  { path: 'buildings', element: <BuildingList /> },
  { path: 'buildings/:id', element: <BuildingDetail /> },
  { path: 'owners', element: <OwnerList /> },
  { path: 'owners/:id', element: <OwnerDetail /> },
  { path: 'tickets', element: <TicketList /> },
  { path: 'tickets/:id', element: <TicketDetail /> },
  { path: 'staff/dashboard', element: <StaffDashboard /> },
  { path: 'staff/my-tickets', element: <StaffMyTickets /> },
  { path: 'staff/visitor-checkin', element: <VisitorCheckin /> },
  { path: 'staff/amenity-checkin', element: <AmenityCheckin /> },
  { path: 'staff/:id/ratings', element: <StaffRatings /> },
  { path: 'announcements', element: <AnnouncementPage /> },
  { path: 'notifications', element: <NotificationPage /> },
  { path: 'meters', element: <MeterList /> },
  { path: 'meters/bulk', element: <BulkMeterEntry /> },
  { path: 'meters/confirm', element: <MeterReadingConfirm /> },
  { path: 'meters/:id/readings', element: <MeterReadingHistory /> },
  { path: 'services', element: <ServiceCatalog /> },
  {
    element: <ProtectedRoute requiredRole="Admin" />,
    children: [
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        ),
        children: [
          { index: true, element: <ReportsHub /> },
          { path: 'occupancy', element: <OccupancyReport /> },
          { path: 'financial', element: <FinancialReport /> },
          { path: 'debt', element: <DebtReport /> },
          { path: 'consumption', element: <ConsumptionReport /> },
          { path: 'room-lifecycle', element: <RoomLifecycleReport /> },
          { path: 'nps', element: <NPSReport /> },
          { path: 'staff', element: <StaffReport /> },
          { path: 'alerts', element: <AlertsReport /> },
        ],
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'users/permissions', element: <PermissionMatrix /> },
          { path: 'electricity-policy', element: <ElectricityPolicyPage /> },
          { path: 'water-policy', element: <WaterPolicyPage /> },
          { path: 'system', element: <SystemSettings /> },
          { path: 'audit-logs', element: <AuditLogs /> },
        ],
      },

    ],
  },
  { path: '', element: <Navigate to="/dashboard" replace /> },
];
