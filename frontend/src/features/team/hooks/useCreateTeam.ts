import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTeam } from '../api/team.api';

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
