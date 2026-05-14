import { useQuery } from '@tanstack/react-query';
import { getTodayTodos } from '../api/todo.api';

export function useTodayTodos() {
  return useQuery({
    queryKey: ['todos', 'today'],
    queryFn: getTodayTodos,
  });
}
