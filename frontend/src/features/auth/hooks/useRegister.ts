import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth.api';
import { getErrorMessage } from '@/shared/utils/errorUtils';
import { ROUTES } from '@/shared/constants/routes';

export function useRegister() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate(ROUTES.LOGIN);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
    },
  });

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    formError,
    setFormError,
  };
}
