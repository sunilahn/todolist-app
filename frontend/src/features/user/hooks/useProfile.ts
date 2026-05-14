import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/user.api';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
}
