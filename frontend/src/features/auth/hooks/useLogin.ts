import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '@/shared/utils/errorUtils';
import { ROUTES } from '@/shared/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    formError,
    setFormError,
  };
}
