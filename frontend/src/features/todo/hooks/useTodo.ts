import { useQuery } from '@tanstack/react-query';
import { getTodo } from '../api/todo.api';

export function useTodo(id: string) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => getTodo(id),
    enabled: !!id,
  });
}
