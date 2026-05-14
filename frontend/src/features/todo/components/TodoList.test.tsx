import { render, screen } from '@testing-library/react';
import { TodoList } from './TodoList';
import type { Todo } from '../types/todo.types';

const makeTodo = (id: string, title: string): Todo => ({
  todoId: id,
  userId: 'user-1',
  teamId: null,
  categoryId: null,
  title,
  description: null,
  status: 'PLANNED',
  startDate: null,
  dueDate: null,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
});

describe('TodoList', () => {
  it('로딩 중 Spinner 표시', () => {
    render(<TodoList todos={[]} isLoading />);
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });

  it('빈 배열 시 "할일이 없습니다." 표시', () => {
    render(<TodoList todos={[]} />);
    expect(screen.getByText('할일이 없습니다.')).toBeInTheDocument();
  });

  it('todos 배열 렌더링 시 TodoCard들이 표시됨', () => {
    const todos = [
      makeTodo('1', '첫 번째 할일'),
      makeTodo('2', '두 번째 할일'),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText('첫 번째 할일')).toBeInTheDocument();
    expect(screen.getByText('두 번째 할일')).toBeInTheDocument();
  });
});
