import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '@/shared/constants/routes';

export function useLogout() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      useAuthStore.getState().clear();
      navigate(ROUTES.LOGIN);
    },
    onError: () => {
      useAuthStore.getState().clear();
      navigate(ROUTES.LOGIN);
    },
  });

  const handleLogout = () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      mutation.mutate({ refreshToken });
    } else {
      useAuthStore.getState().clear();
      navigate(ROUTES.LOGIN);
    }
  };

  return {
    logout: handleLogout,
    isLoading: mutation.isPending,
  };
}
