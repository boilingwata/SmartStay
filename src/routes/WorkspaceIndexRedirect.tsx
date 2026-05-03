import { Navigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

export default function WorkspaceIndexRedirect() {
  const role = useAuthStore((state) => state.role);
  return <Navigate to={role === 'Staff' ? 'staff/dashboard' : 'dashboard'} replace />;
}
