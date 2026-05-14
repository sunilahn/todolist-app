import { useMutation, useQueryClient } from '@tanstack/react-query';
import { declineInvitation } from '../api/team.api';

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => declineInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
