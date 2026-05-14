import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTeam } from '../api/team.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      navigate(ROUTES.TEAMS);
    },
  });
}
