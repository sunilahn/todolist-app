import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoCard } from './TodoCard';
import type { Todo } from '../types/todo.types';

const baseTodo: Todo = {
  todoId: '1',
  userId: 'user-1',
  teamId: null,
  categoryId: null,
  title: '테스트 할일',
  description: null,
  status: 'PLANNED',
  startDate: '2026-05-19',
  dueDate: '2026-05-20',
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
};

function formattedDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

describe('TodoCard', () => {
  it('제목이 렌더링됨', () => {
    render(<TodoCard todo={baseTodo} />);
    expect(screen.getByText('테스트 할일')).toBeInTheDocument();
  });

  it('DONE 상태면 제목에 line-through 클래스가 있음', () => {
    render(<TodoCard todo={{ ...baseTodo, status: 'DONE' }} />);
    const title = screen.getByText('테스트 할일');
    expect(title.className).toContain('line-through');
  });

  it('PLANNED 상태면 제목에 line-through 클래스가 없음', () => {
    render(<TodoCard todo={baseTodo} />);
    const title = screen.getByText('테스트 할일');
    expect(title.className).not.toContain('line-through');
  });

  it('상태 배지가 올바른 텍스트로 표시됨', () => {
    render(<TodoCard todo={baseTodo} />);
    expect(screen.getByText('예정')).toBeInTheDocument();
  });

  it('시작일과 종료일이 함께 표시됨', () => {
    render(<TodoCard todo={baseTodo} />);
    expect(screen.getByText(`${formattedDate('2026-05-19')} ~ ${formattedDate('2026-05-20')}`)).toBeInTheDocument();
  });

  it('종료일만 있을 때 "마감" 접두사가 표시됨', () => {
    render(<TodoCard todo={{ ...baseTodo, startDate: null }} />);
    expect(screen.getByText(`마감 ${formattedDate('2026-05-20')}`)).toBeInTheDocument();
  });

  it('시작일만 있을 때 "시작" 접두사가 표시됨', () => {
    render(<TodoCard todo={{ ...baseTodo, startDate: '2026-05-19', dueDate: null }} />);
    expect(screen.getByText(`시작 ${formattedDate('2026-05-19')}`)).toBeInTheDocument();
  });

  it('날짜가 모두 null이면 표시되지 않음', () => {
    render(<TodoCard todo={{ ...baseTodo, startDate: null, dueDate: null }} />);
    const dateText = screen.queryByText(/2026/);
    expect(dateText).not.toBeInTheDocument();
  });

  it('클릭 핸들러가 호출됨', async () => {
    const onClick = vi.fn();
    render(<TodoCard todo={baseTodo} onClick={onClick} />);
    await userEvent.click(screen.getByText('테스트 할일'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('categoryName이 전달되면 카테고리명이 표시된다', () => {
    render(<TodoCard todo={baseTodo} categoryName="업무" />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('categoryName이 없으면 카테고리 태그가 표시되지 않는다', () => {
    render(<TodoCard todo={baseTodo} />);
    expect(screen.queryByText('업무')).not.toBeInTheDocument();
  });
});
