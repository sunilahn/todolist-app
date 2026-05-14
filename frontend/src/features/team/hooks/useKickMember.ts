import { useMutation, useQueryClient } from '@tanstack/react-query';
import { kickMember } from '../api/team.api';

export function useKickMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => kickMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
    },
  });
}
