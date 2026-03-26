import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { UserRoleType } from '@/models/User';
import { Spinner } from '@/components/ui/Feedback';

interface ProtectedRouteProps {
  requiredRole?: UserRoleType;
  allowedRoles?: UserRoleType[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, allowedRoles }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const role = useAuthStore(s => s.role);
  const isLoading = useAuthStore(s => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/public/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/403" replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
