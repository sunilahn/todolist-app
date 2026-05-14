import { useQuery } from '@tanstack/react-query';
import { getThisWeekTodos } from '../api/todo.api';

export function useThisWeekTodos() {
  return useQuery({
    queryKey: ['todos', 'this-week'],
    queryFn: getThisWeekTodos,
  });
}
