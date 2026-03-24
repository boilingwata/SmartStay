import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const LandingPage = lazy(() => import('@/views/public/LandingPage'));
const LoginPage = lazy(() => import('@/views/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/views/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/views/auth/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('@/views/auth/ChangePasswordPage'));
const RegisterPage = lazy(() => import('@/views/auth/RegisterPage'));

export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    path: 'forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: 'reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: 'change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: 'register',
    element: <RegisterPage />,
  },
];

export { LandingPage };
