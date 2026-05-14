import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteAccount } from '../api/user.api';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { getErrorMessage } from '@/shared/utils/errorUtils';
import { ROUTES } from '@/shared/constants/routes';

export function useDeleteAccount() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      useAuthStore.getState().clear();
      navigate(ROUTES.LOGIN);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  return {
    deleteAccount: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    setError,
  };
}
