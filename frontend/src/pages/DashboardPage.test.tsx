import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as todoApi from '@/features/todo/api/todo.api';
import DashboardPage from './DashboardPage';

vi.mock('@/features/todo/api/todo.api', () => ({
  getTodos: vi.fn(),
  getTodayTodos: vi.fn(),
  getThisWeekTodos: vi.fn(),
  getTodo: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  updateTodoStatus: vi.fn(),
  deleteTodo: vi.fn(),
}));

const mockTodo = (overrides = {}) => ({
  todoId: 'todo-1',
  userId: 'user-1',
  teamId: null,
  categoryId: null,
  title: '오늘 할일 1',
  description: null,
  status: 'PLANNED' as const,
  startDate: null,
  dueDate: '2026-05-14',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  Wrapper.displayName = 'DashboardPageTestWrapper';

  return Wrapper;
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(todoApi.getTodayTodos).mockResolvedValue([]);
    vi.mocked(todoApi.getThisWeekTodos).mockResolvedValue([]);
  });

  it('로딩 중 Spinner가 표시된다', () => {
    vi.mocked(todoApi.getTodayTodos).mockReturnValue(new Promise(() => {}));
    vi.mocked(todoApi.getThisWeekTodos).mockReturnValue(new Promise(() => {}));

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('페이지 제목이 표시된다', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('대시보드')).toBeInTheDocument();
    });
  });

  it('오늘 할일이 없는 경우 안내 메시지가 표시된다', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('오늘 해당하는 할일이 없습니다')).toBeInTheDocument();
    });
  });

  it('이번 주 할일이 없는 경우 안내 메시지가 표시된다', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('이번 주 해당하는 할일이 없습니다')).toBeInTheDocument();
    });
  });

  it('오늘 할일 목록이 표시된다', async () => {
    vi.mocked(todoApi.getTodayTodos).mockResolvedValue([
      mockTodo({ todoId: 'today-1', title: '오늘 할일 A', status: 'IN_PROGRESS' }),
      mockTodo({ todoId: 'today-2', title: '오늘 할일 B', status: 'PLANNED' }),
    ]);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('오늘 할일 A')).toBeInTheDocument();
      expect(screen.getByText('오늘 할일 B')).toBeInTheDocument();
    });
  });

  it('이번 주 할일 목록이 표시된다', async () => {
    vi.mocked(todoApi.getThisWeekTodos).mockResolvedValue([
      mockTodo({ todoId: 'week-1', title: '이번 주 할일 A', status: 'DONE' }),
    ]);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('이번 주 할일 A')).toBeInTheDocument();
    });
  });

  it('오늘 할일 섹션 제목이 표시된다', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('오늘 할 일').length).toBeGreaterThan(0);
    });
  });

  it('이번 주 할일 섹션 제목이 표시된다', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('이번 주 할 일').length).toBeGreaterThan(0);
    });
  });

  it('진행 상태 분포 카드가 표시된다', async () => {
    vi.mocked(todoApi.getTodayTodos).mockResolvedValue([
      mockTodo({ todoId: '1', status: 'PLANNED' }),
      mockTodo({ todoId: '2', status: 'IN_PROGRESS' }),
      mockTodo({ todoId: '3', status: 'DONE' }),
    ]);
    vi.mocked(todoApi.getThisWeekTodos).mockResolvedValue([
      mockTodo({ todoId: '4', status: 'ON_HOLD' }),
    ]);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('예정').length).toBeGreaterThan(0);
      expect(screen.getAllByText('진행중').length).toBeGreaterThan(0);
      expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
      expect(screen.getAllByText('보류').length).toBeGreaterThan(0);
    });
  });

  it('할일 상태 배지가 표시된다', async () => {
    vi.mocked(todoApi.getTodayTodos).mockResolvedValue([
      mockTodo({ todoId: '1', title: '진행 중 작업', status: 'IN_PROGRESS' }),
    ]);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('진행 중 작업')).toBeInTheDocument();
      expect(screen.getAllByText('진행중').length).toBeGreaterThan(0);
    });
  });

  it('요약 카드에 오늘과 이번 주 건수를 표시한다', async () => {
    vi.mocked(todoApi.getTodayTodos).mockResolvedValue([
      mockTodo({ todoId: 'today-1' }),
      mockTodo({ todoId: 'today-2' }),
    ]);
    vi.mocked(todoApi.getThisWeekTodos).mockResolvedValue([
      mockTodo({ todoId: 'week-1' }),
      mockTodo({ todoId: 'week-2' }),
      mockTodo({ todoId: 'week-3' }),
    ]);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
