import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TodoListPage from './TodoListPage';

const mockNavigate = vi.fn();
const mockUseTodos = vi.fn();
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/todo/hooks/useTodos', () => ({
  useTodos: (query: unknown) => mockUseTodos(query),
}));

describe('TodoListPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseTodos.mockReset();
    mockUseTodos.mockReturnValue({
      data: {
        todos: [
          {
            todoId: 'todo-1',
            userId: 'user-1',
            teamId: null,
            categoryId: 'category-1',
            title: 'Filtered todo',
            description: null,
            status: 'PLANNED',
            startDate: null,
            dueDate: '2026-05-14',
            createdAt: '2026-05-14T00:00:00.000Z',
            updatedAt: '2026-05-14T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
      isLoading: false,
    });
  });

  function renderPage(initialEntry = '/todos') {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/todos" element={<TodoListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  it('uses categoryId from the URL when fetching todos', () => {
    renderPage('/todos?categoryId=category-1');

    expect(mockUseTodos).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'category-1',
        page: 1,
        limit: 20,
      })
    );
    expect(screen.getByText('Filtered todo')).toBeInTheDocument();
  });

  it('omits categoryId when the URL does not include it', () => {
    renderPage('/todos');

    expect(mockUseTodos).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: undefined,
        page: 1,
        limit: 20,
      })
    );
  });
});
