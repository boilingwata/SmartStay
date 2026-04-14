import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProviders } from './components/layout/AppProviders';
import ProtectedRoute from './routes/ProtectedRoute';
import PortalAuthGuard from './components/auth/PortalAuthGuard';
import { AdminLayout, PublicLayout } from './views/layouts/Layouts';
import PortalLayout from './components/layout/PortalLayout';
import SuperAdminLayout from './views/layouts/SuperAdminLayout';
import StaffLayout from './views/layouts/StaffLayout';
import { Spinner } from './components/ui/Feedback';
import { getAuthenticatedHomePath } from './lib/authRouting';

// --- Lazy Load Views ---
const LandingPage = lazy(() => import('@/views/public/LandingPage'));
const LoginPage = lazy(() => import('@/views/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/views/auth/ForgotPasswordPage'));
const RegisterPage = lazy(() => import('@/views/auth/RegisterPage'));
const ResetPasswordPage = lazy(() => import('@/views/auth/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('@/views/auth/ChangePasswordPage'));
const OTPVerifyPage = lazy(() => import('@/views/auth/OTPVerifyPage'));
const ListingsPage = lazy(() => import('@/views/public/ListingsPage'));
const ListingDetailPage = lazy(() => import('@/views/public/ListingDetailPage'));
const ListingApplyPage = lazy(() => import('@/views/public/ListingApplyPage'));

// Admin & Staff Views
const PaymentDetail = lazy(() => import('@/views/admin/finance/PaymentDetail'));
const OwnerDetail = lazy(() => import('@/views/admin/owners/OwnerDetail'));
const AddendumList = lazy(() => import('@/views/admin/contracts/AddendumListPage'));
const StaffDashboard = lazy(() => import('@/views/admin/staff/StaffDashboard'));
const AnnouncementPage = lazy(() => import('@/views/admin/communications/AnnouncementPage/index'));
const NotificationPage = lazy(() => import('@/views/admin/communications/NotificationPage'));

// Portal Views
const Documents = lazy(() => import('@/views/portal/profile/Documents'));

import { adminRoutes } from './routes/adminRoutes';
import { staffRoutes } from './routes/staffRoutes';
import { superAdminRoutes } from './routes/superAdminRoutes';

import { portalRoutes, portalGuestRoutes, Onboarding } from './routes/portalRoutes';



import useAuthStore from './stores/authStore';

// Helper component for Landing Page redirection
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  if (isAuthenticated) {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }
  return <>{children}</>;
};

const LegacyRedirect = ({ to }: { to: string }) => {
  const { "*": path } = useParams();
  return <Navigate to={`${to}/${path || ''}`} replace />;
};



// Error Pages
import { Error404, Error403, Error500, MaintenancePage } from './views/error/ErrorPages';
import ErrorBoundary from './components/ErrorBoundary';
import { OfflineBanner, PageSkeleton } from './components/ui/StatusStates';
import { RouteObject } from 'react-router-dom';

// Recursive Route Mapper for RouteObject arrays
const mapRoutes = (routes: RouteObject[]) => (
  routes.map((route, i) => {
    if (route.index) {
      return <Route key={i} index element={route.element} />;
    }
    return (
      <Route key={i} path={route.path} element={route.element}>
        {route.children && mapRoutes(route.children)}
      </Route>
    );
  })
);

const App = () => {
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-bg">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <AppProviders>
      <ErrorBoundary>
        <OfflineBanner />
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* 3.1 Landing Page -- / (Homepage) with Auth Redirect */}
              <Route path="/" element={
                <AuthRedirect>
                  <LandingPage />
                </AuthRedirect>
              } />

              {/* 3.2 Auth Pages (Public Namespace) */}
              <Route path="/public" element={<PublicLayout showHeader={false} />}>
                <Route path="login" element={<Navigate to="/login" replace />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/owner/login" element={<Navigate to="/login" replace />} />
              <Route path="/staff/login" element={<Navigate to="/login" replace />} />
              <Route path="/super-admin/login" element={<Navigate to="/login" replace />} />

              <Route element={<PublicLayout />}>
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/listings/:id" element={<ListingDetailPage />} />
                <Route path="/listings/:id/apply" element={<ListingApplyPage />} />
              </Route>

              {/* 1. Owner Namespace */}
              <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
                  <Route path="owner" element={<AdminLayout />}>
                    {mapRoutes(adminRoutes)}
                    {/* Explicit routes for architectural visibility [H1] */}
                    <Route path="payments/:id" element={<PaymentDetail />} />
                    <Route path="owners/:id" element={<OwnerDetail />} />
                    <Route path="contracts/addendums" element={<AddendumList />} />
                    <Route path="staff/dashboard" element={<StaffDashboard />} />
                    <Route path="announcements" element={<AnnouncementPage />} />
                    <Route path="notifications" element={<NotificationPage />} />
                  </Route>
              </Route>

              {/* 2. Staff Namespace */}
              <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
                <Route path="staff" element={<StaffLayout />}>
                  {mapRoutes(staffRoutes)}
                </Route>
              </Route>

              {/* 3. Super Admin Namespace */}
              <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
                <Route path="super-admin" element={<SuperAdminLayout />}>
                  {mapRoutes(superAdminRoutes)}
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              <Route path="/dashboard" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/admin/*" element={<LegacyRedirect to="/owner" />} />
              <Route path="/rooms/*" element={<LegacyRedirect to="/owner/rooms" />} />
              <Route path="/contracts/*" element={<LegacyRedirect to="/owner/contracts" />} />
              <Route path="/tenants/*" element={<LegacyRedirect to="/owner/tenants" />} />
              <Route path="/invoices/*" element={<LegacyRedirect to="/owner/invoices" />} />
              <Route path="/payments/*" element={<LegacyRedirect to="/owner/payments" />} />
              <Route path="/tickets/*" element={<LegacyRedirect to="/owner/tickets" />} />
              <Route path="/buildings/*" element={<LegacyRedirect to="/owner/buildings" />} />

              <Route path="/portal">
                {/* 3.2.2 Guest Routes (Login, etc.) */}
                {portalGuestRoutes.map((route, i) => (
                  <Route 
                    key={i} 
                    path={route.path} 
                    element={route.element} 
                  />
                ))}

                {/* Protected Portal Area */}
                <Route element={<PortalAuthGuard />}>
                  <Route element={<PortalLayout />}>
                    {mapRoutes(portalRoutes)}
                    {/* Explicitly adding Documents route for visibility */}
                    <Route path="documents" element={<Documents />} />
                  </Route>
                  <Route path="onboarding" element={<Onboarding />} />
                </Route>
              </Route>

              {/* 3.3 Error Pages & Global Redirects */}
              <Route path="/403" element={<Error403 />} />
              <Route path="/500" element={<Error500 />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/404" element={<Error404 />} />
              
              <Route path="*" element={<Error404 />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </AppProviders>
  );
};

export default App;

