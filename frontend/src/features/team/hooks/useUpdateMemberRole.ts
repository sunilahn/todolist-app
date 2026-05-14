import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMemberRole } from '../api/team.api';

export function useUpdateMemberRole(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'ADMIN' | 'MEMBER' | 'VIEWER' }) =>
      updateMemberRole(teamId, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
    },
  });
}
