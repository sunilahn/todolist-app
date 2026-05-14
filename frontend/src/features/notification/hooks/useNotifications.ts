import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../api/notification.api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });
}
