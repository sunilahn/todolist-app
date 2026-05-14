import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../api/user.api';
import { getErrorMessage } from '@/shared/utils/errorUtils';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccessMessage('정보가 수정되었습니다.');
      setFormError(null);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
      setSuccessMessage(null);
    },
  });

  return {
    updateProfile: mutation.mutate,
    isLoading: mutation.isPending,
    successMessage,
    setSuccessMessage,
    formError,
    setFormError,
  };
}
