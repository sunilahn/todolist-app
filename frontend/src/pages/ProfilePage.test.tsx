import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from './ProfilePage';
import * as userApi from '@/features/user/api/user.api';

vi.mock('@/features/user/api/user.api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockProfile = {
  userId: 'user-1',
  email: 'test@test.com',
  name: '홍길동',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userApi.getProfile).mockResolvedValue(mockProfile);
  });

  it('이메일과 이름이 표시된다', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
    });
  });

  it('이메일 필드는 읽기 전용이다', async () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('test@test.com');
      expect(emailInput).toHaveAttribute('readonly');
    });
  });

  it('이름 수정 후 저장 시 성공 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.updateProfile).mockResolvedValueOnce({
      ...mockProfile,
      name: '수정된이름',
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('홍길동');
    await user.clear(nameInput);
    await user.type(nameInput, '수정된이름');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByText('정보가 수정되었습니다.')).toBeInTheDocument();
    });
  });

  it('수정 API 실패 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.updateProfile).mockRejectedValueOnce({
      response: { data: { code: 'VALIDATION_ERROR', message: '이름은 필수입니다.' } },
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByText('이름은 필수입니다.')).toBeInTheDocument();
    });
  });

  it('회원 탈퇴 버튼 클릭 시 확인 Modal이 열린다', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '회원 탈퇴' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('모든 데이터가 즉시 삭제되며 복구할 수 없습니다.')).toBeInTheDocument();
    });
  });

  it('탈퇴 Modal에서 취소 시 Modal이 닫힌다', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '회원 탈퇴' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '취소' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('탈퇴 Modal에서 잘못된 비밀번호 입력 시 에러가 표시된다', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.deleteAccount).mockRejectedValueOnce({
      response: { data: { code: 'UNAUTHORIZED', message: '비밀번호가 올바르지 않습니다.' } },
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '회원 탈퇴' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/비밀번호를 입력하세요/), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: '탈퇴 확인' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    });
  });
});
