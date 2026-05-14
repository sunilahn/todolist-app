import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryForm } from './CategoryForm';

vi.mock('../hooks/useCreateCategory', () => ({
  useCreateCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../hooks/useUpdateCategory', () => ({
  useUpdateCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('CategoryForm', () => {
  it('이름 필드가 필수임을 검증한다', async () => {
    render(<CategoryForm onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByText('이름을 입력해주세요.')).toBeInTheDocument();
  });

  it('색상이 #RRGGBB 형식이 아닌 경우 유효성 에러가 표시된다', async () => {
    render(<CategoryForm onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.type(screen.getByLabelText(/이름/i), '테스트');
    await userEvent.type(screen.getByPlaceholderText('#RRGGBB'), 'invalid');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByText('#RRGGBB 형식이어야 합니다', { exact: false })).toBeInTheDocument();
  });

  it('#RRGGBB 형식의 색상은 유효성 검사를 통과한다', async () => {
    const mockCreate = vi.fn();
    vi.doMock('../hooks/useCreateCategory', () => ({
      useCreateCategory: () => ({ mutate: mockCreate, isPending: false }),
    }));

    render(<CategoryForm onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.type(screen.getByLabelText(/이름/i), '테스트');
    await userEvent.type(screen.getByPlaceholderText('#RRGGBB'), '#FF5733');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.queryByText('#RRGGBB 형식이어야 합니다', { exact: false })).not.toBeInTheDocument();
  });

  it('색상 없이 이름만으로 추가 가능하다', async () => {
    render(<CategoryForm onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.type(screen.getByLabelText(/이름/i), '테스트');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.queryByText('이름을 입력해주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('#RRGGBB 형식이어야 합니다', { exact: false })).not.toBeInTheDocument();
  });

  it('수정 모드에서 기존 값이 폼에 채워진다', () => {
    const category = {
      categoryId: '1',
      ownerId: 'u1',
      ownerType: 'USER' as const,
      name: '업무',
      color: '#1a73e8',
      createdAt: '2026-01-01T00:00:00Z',
    };
    render(<CategoryForm category={category} onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByDisplayValue('업무')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#1a73e8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
    const onCancel = vi.fn();
    render(<CategoryForm onSuccess={vi.fn()} onCancel={onCancel} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
