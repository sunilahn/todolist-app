import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo, updateTodoStatus } from '../api/todo.api';
import type { UpdateTodoRequest } from '../types/todo.types';
import type { TodoStatus } from '@/shared/constants/todoStatus';

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoRequest }) =>
      updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useUpdateTodoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TodoStatus }) =>
      updateTodoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
