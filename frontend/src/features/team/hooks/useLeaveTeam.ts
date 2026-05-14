import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveTeam } from '../api/team.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

export function useLeaveTeam() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (teamId: string) => leaveTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      navigate(ROUTES.TEAMS);
    },
  });
}
