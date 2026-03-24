import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { getTenantHomePath } from '@/lib/authRouting';

const PortalAuthGuard: React.FC = () => {
  const { isAuthenticated, role, user, sessionExpired, isLoading } = useAuthStore();
  const location = useLocation();
  const onboardingAllowedPaths = ['/portal/onboarding', '/portal/profile', '/portal/documents'];

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (sessionExpired) {
    toast.error('Phiên làm việc hết hạn');
    return <Navigate to="/portal/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (role !== 'Tenant') {
    return <Navigate to="/403" replace />;
  }

  const tenantStage = user?.tenantStage ?? 'prospect';
  const isOnboarding = location.pathname === '/portal/onboarding';
  const isOnboardingFlowPath = onboardingAllowedPaths.includes(location.pathname);
  const isPendingResident = tenantStage === 'resident_pending_onboarding';
  const isActiveResident = tenantStage === 'resident_active';

  if (!isPendingResident && !isActiveResident) {
    return <Navigate to={getTenantHomePath(tenantStage)} replace />;
  }

  if (isPendingResident && !isOnboardingFlowPath) {
    return <Navigate to="/portal/onboarding" replace />;
  }

  if (isActiveResident && isOnboarding) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <Outlet />;
};

export default PortalAuthGuard;
