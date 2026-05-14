import { useQuery } from '@tanstack/react-query';
import { getTeamMembers } from '../api/team.api';

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => getTeamMembers(teamId),
    enabled: !!teamId,
  });
}
