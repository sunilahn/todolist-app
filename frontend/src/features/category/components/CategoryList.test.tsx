import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CategoryList } from './CategoryList';
import type { Category } from '../types/category.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../hooks/useDeleteCategory', () => ({
  useDeleteCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const categories: Category[] = [
  {
    categoryId: 'c1',
    ownerId: 'u1',
    ownerType: 'USER',
    name: '업무',
    color: '#1a73e8',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    categoryId: 'c2',
    ownerId: 'u1',
    ownerType: 'USER',
    name: '개인',
    color: null,
    createdAt: '2026-01-02T00:00:00Z',
  },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CategoryList', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('로딩 중일 때 Spinner가 렌더링된다', () => {
    render(<CategoryList categories={[]} isLoading={true} onEdit={vi.fn()} />, { wrapper });
    expect(document.querySelector('[aria-label="로딩 중"]')).toBeInTheDocument();
  });

  it('카테고리가 없을 때 빈 상태 메시지가 표시된다', () => {
    render(<CategoryList categories={[]} isLoading={false} onEdit={vi.fn()} />, { wrapper });
    expect(screen.getByText('카테고리가 없습니다.')).toBeInTheDocument();
  });

  it('카테고리 목록이 렌더링된다', () => {
    render(<CategoryList categories={categories} isLoading={false} onEdit={vi.fn()} />, { wrapper });
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getAllByText('개인').length).toBeGreaterThanOrEqual(1);
  });

  it('카테고리 클릭 시 할일 목록으로 필터링 이동한다', async () => {
    render(<CategoryList categories={categories} isLoading={false} onEdit={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByText('업무'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('categoryId=c1'));
  });

  it('삭제 버튼 클릭 시 "속한 할일의 카테고리가 해제됩니다" Modal이 표시된다', async () => {
    render(<CategoryList categories={categories} isLoading={false} onEdit={vi.fn()} />, { wrapper });
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('.material-symbols-outlined')?.textContent === 'delete'
    );
    await userEvent.click(deleteButtons[0]);
    expect(screen.getByText('속한 할일의 카테고리가 해제됩니다.')).toBeInTheDocument();
  });

  it('삭제 Modal에서 취소 버튼 클릭 시 Modal이 닫힌다', async () => {
    render(<CategoryList categories={categories} isLoading={false} onEdit={vi.fn()} />, { wrapper });
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('.material-symbols-outlined')?.textContent === 'delete'
    );
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByText('속한 할일의 카테고리가 해제됩니다.')).not.toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 onEdit이 해당 카테고리와 함께 호출된다', async () => {
    const onEdit = vi.fn();
    render(<CategoryList categories={categories} isLoading={false} onEdit={onEdit} />, { wrapper });
    const editButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('.material-symbols-outlined')?.textContent === 'edit'
    );
    await userEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(categories[0]);
  });
});
