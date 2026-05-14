import { useQuery } from '@tanstack/react-query';
import { getTeams } from '../api/team.api';

export function useTeams() {
  return useQuery({ queryKey: ['teams'], queryFn: getTeams });
}
