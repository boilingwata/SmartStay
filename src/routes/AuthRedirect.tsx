import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { getAuthenticatedHomePath } from '@/lib/authRouting';

export const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }
  return <>{children}</>;
};
