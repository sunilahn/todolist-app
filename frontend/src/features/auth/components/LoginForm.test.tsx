import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';
import * as authApi from '../api/auth.api';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('이메일과 비밀번호 입력 필드가 렌더링된다', () => {
    render(<LoginForm />, { wrapper });
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('이메일 미입력 시 유효성 검사 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper });

    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument();
    });
  });

  it('비밀번호 미입력 시 유효성 검사 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    });
  });

  it('올바른 값 입력 후 제출 시 login API를 호출한다', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    render(<LoginForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'test@test.com');
    await user.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith(
        { email: 'test@test.com', password: 'Password1!' },
        expect.anything()
      );
    });
  });

  it('로그인 실패 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValueOnce({
      response: { data: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
    });

    render(<LoginForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'test@test.com');
    await user.type(screen.getByLabelText('비밀번호'), 'WrongPassword1!');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.');
    });
  });
});
