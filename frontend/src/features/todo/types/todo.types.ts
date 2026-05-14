import type { TodoStatus } from '@/shared/constants/todoStatus';

export interface Todo {
  todoId: string;
  userId: string | null;
  teamId: string | null;
  categoryId: string | null;
  title: string;
  description: string | null;
  status: TodoStatus;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  status?: TodoStatus;
  startDate?: string;
  dueDate?: string;
  categoryId?: string;
  teamId?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  categoryId?: string | null;
}

export interface TodoListQuery {
  status?: TodoStatus;
  categoryId?: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
