import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProviders } from './components/layout/AppProviders';
import AdminLayout from './components/layout/AdminLayout';
import PortalLayout from './components/layout/PortalLayout';
import PublicLayout from './components/layout/PublicLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { getAuthenticatedHomePath } from './lib/authRouting';

// --- Lazy Load Views ---
const LandingPage = lazy(() => import('@/views/public/LandingPage'));
const LoginPage = lazy(() => import('@/views/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/views/auth/ForgotPasswordPage'));
const RegisterPage = lazy(() => import('@/views/auth/RegisterPage'));
const ResetPasswordPage = lazy(() => import('@/views/auth/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('@/views/auth/ChangePasswordPage'));
const ListingsPage = lazy(() => import('@/views/public/ListingsPage'));
const ListingDetailPage = lazy(() => import('@/views/public/ListingDetailPage'));
const ListingApplyPage = lazy(() => import('@/views/public/ListingApplyPage'));
const PortalContractView = lazy(() => import('@/views/portal/contracts/ContractView'));

import { ownerRoutes } from './routes/ownerRoutes';
import { portalRoutes, Onboarding } from './routes/portalRoutes';
import { superAdminRoutes } from './routes/superAdminRoutes';
import PortalAuthGuard from './components/auth/PortalAuthGuard';

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

              <Route element={<ProtectedRoute allowedRoles={['Owner', 'Staff', 'SuperAdmin']} />}>
                <Route path="owner" element={<AdminLayout />}>
                  {mapRoutes(ownerRoutes)}
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
                <Route path="super-admin" element={<SuperAdminLayout />}>
                  {mapRoutes(superAdminRoutes)}
                </Route>
              </Route>

              <Route path="/dashboard" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/admin/*" element={<LegacyRedirect to="/owner" />} />
              <Route path="/rooms/*" element={<LegacyRedirect to="/owner/rooms" />} />
              <Route path="/buildings/*" element={<LegacyRedirect to="/owner/buildings" />} />
              <Route path="/contracts/*" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/tenants/*" element={<Navigate to="/owner/leads" replace />} />
              <Route path="/invoices/*" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/payments/*" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/tickets/*" element={<Navigate to="/owner/leads" replace />} />
              <Route path="/staff/*" element={<Navigate to="/owner/dashboard" replace />} />

              {/* 3.3 Portal Namespace (Tenant) */}
              <Route path="/portal">
                <Route path="login" element={<Navigate to="/login" replace />} />
                <Route path="verify-otp" element={<Navigate to="/login" replace />} />
                <Route path="forgot-password" element={<Navigate to="/public/forgot-password" replace />} />

                {/* Protected Routes */}
                <Route element={<PortalAuthGuard />}>
                  <Route path="onboarding" element={
                    <PortalLayout title="Thiết lập hồ sơ" showBack={false}>
                      <Onboarding />
                    </PortalLayout>
                  } />
                  <Route element={<PortalLayout />}>
                    {mapRoutes(portalRoutes)}
                  </Route>
                </Route>
              </Route>

              <Route path="/tenant">
                <Route element={<PortalAuthGuard />}>
                  <Route element={<PortalLayout />}>
                    <Route index element={<Navigate to="/portal/contracts" replace />} />
                    <Route path="contracts" element={<PortalContractView />} />
                  </Route>
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
