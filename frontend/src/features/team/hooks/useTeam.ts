import { useQuery } from '@tanstack/react-query';
import { getTeam } from '../api/team.api';

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => getTeam(teamId),
    enabled: !!teamId,
  });
}
