import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
