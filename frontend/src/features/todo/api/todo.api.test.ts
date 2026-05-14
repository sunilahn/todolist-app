import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTodos, createTodo, deleteTodo, updateTodoStatus } from './todo.api';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/lib/axios';

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('todo.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTodos가 올바른 쿼리 파라미터로 GET /todos 호출', async () => {
    const mockResponse = { todos: [], total: 0, page: 1, limit: 20 };
    mockApi.get.mockResolvedValueOnce({ data: mockResponse });

    const query = { status: 'PLANNED' as const, page: 1, limit: 20 };
    const result = await getTodos(query);

    expect(mockApi.get).toHaveBeenCalledWith('/todos', { params: query });
    expect(result).toEqual(mockResponse);
  });

  it('createTodo가 POST /todos 호출', async () => {
    const mockTodo = { todoId: '1', title: '새 할일' };
    mockApi.post.mockResolvedValueOnce({ data: mockTodo });

    const result = await createTodo({ title: '새 할일' });

    expect(mockApi.post).toHaveBeenCalledWith('/todos', { title: '새 할일' });
    expect(result).toEqual(mockTodo);
  });

  it('deleteTodo가 DELETE /todos/:id 호출', async () => {
    mockApi.delete.mockResolvedValueOnce({});

    await deleteTodo('todo-123');

    expect(mockApi.delete).toHaveBeenCalledWith('/todos/todo-123');
  });

  it('updateTodoStatus가 PATCH /todos/:id/status 호출', async () => {
    const mockTodo = { todoId: '1', status: 'IN_PROGRESS' };
    mockApi.patch.mockResolvedValueOnce({ data: mockTodo });

    const result = await updateTodoStatus('1', 'IN_PROGRESS');

    expect(mockApi.patch).toHaveBeenCalledWith('/todos/1/status', { status: 'IN_PROGRESS' });
    expect(result).toEqual(mockTodo);
  });
});
