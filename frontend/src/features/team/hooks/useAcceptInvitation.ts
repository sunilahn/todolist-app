import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptInvitation } from '../api/team.api';

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
