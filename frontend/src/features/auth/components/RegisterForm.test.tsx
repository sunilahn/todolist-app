import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from './RegisterForm';
import * as authApi from '../api/auth.api';

vi.mock('../api/auth.api', () => ({
  register: vi.fn(),
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

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('필수 입력 필드들이 렌더링된다', () => {
    render(<RegisterForm />, { wrapper });
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  });

  it('비밀번호 불일치 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'test@test.com');
    await user.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'DifferentPwd1!');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });
  });

  it('비밀번호 정책 미충족 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'test@test.com');
    await user.type(screen.getByLabelText('비밀번호'), 'short');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'short');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.')).toBeInTheDocument();
    });
  });

  it('올바른 값 입력 후 제출 시 register API를 호출한다', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValueOnce({
      userId: '1',
      email: 'test@test.com',
      name: '테스트',
      createdAt: new Date().toISOString(),
    });

    render(<RegisterForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'test@test.com');
    await user.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'Password1!');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          password: 'Password1!',
        }),
        expect.anything()
      );
    });
  });

  it('중복 이메일 에러 시 폼 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockRejectedValueOnce({
      response: { data: { code: 'CONFLICT', message: '이미 사용 중인 이메일입니다.' } },
    });

    render(<RegisterForm />, { wrapper });

    await user.type(screen.getByLabelText('이메일'), 'dup@test.com');
    await user.type(screen.getByLabelText('비밀번호'), 'Password1!');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'Password1!');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('이미 사용 중인 이메일입니다.');
    });
  });
});
