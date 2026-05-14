import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../api/todo.api';
import type { TodoListQuery } from '../types/todo.types';

export function useTodos(query: TodoListQuery = {}) {
  return useQuery({
    queryKey: ['todos', query],
    queryFn: () => getTodos(query),
  });
}
