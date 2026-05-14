import api from '@/lib/axios';
import type { PaginatedResponse } from '@/shared/types/api.types';
import type { TodoStatus } from '@/shared/constants/todoStatus';
import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoListQuery } from '../types/todo.types';

export async function getTodos(query: TodoListQuery): Promise<PaginatedResponse<Todo>> {
  const { data } = await api.get<PaginatedResponse<Todo>>('/todos', { params: query });
  return data;
}

export async function getTodayTodos(): Promise<Todo[]> {
  const { data } = await api.get<Todo[]>('/todos/today');
  return data;
}

export async function getThisWeekTodos(): Promise<Todo[]> {
  const { data } = await api.get<Todo[]>('/todos/this-week');
  return data;
}

export async function getTodo(id: string): Promise<Todo> {
  const { data } = await api.get<Todo>(`/todos/${id}`);
  return data;
}

export async function createTodo(data: CreateTodoRequest): Promise<Todo> {
  const { data: response } = await api.post<Todo>('/todos', data);
  return response;
}

export async function updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
  const { data: response } = await api.patch<Todo>(`/todos/${id}`, data);
  return response;
}

export async function updateTodoStatus(id: string, status: TodoStatus): Promise<Todo> {
  const { data } = await api.patch<Todo>(`/todos/${id}/status`, { status });
  return data;
}

export async function deleteTodo(id: string): Promise<void> {
  await api.delete(`/todos/${id}`);
}
