import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLogin } from './useLogin';
import * as authApi from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';

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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children)
    );
};

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clear();
  });

  it('로그인 성공 시 토큰을 저장한다', async () => {
    const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    vi.mocked(authApi.login).mockResolvedValueOnce(mockTokens);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.login({ email: 'test@test.com', password: 'Password1!' });
    });

    expect(authApi.login).toHaveBeenCalledWith(
      { email: 'test@test.com', password: 'Password1!' },
      expect.anything()
    );
  });

  it('로그인 실패 시 formError가 설정된다', async () => {
    const mockError = {
      response: { data: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
    };
    vi.mocked(authApi.login).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.login({ email: 'test@test.com', password: 'wrongpassword' });
    });

    expect(result.current.formError).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('초기 formError는 null이다', () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    expect(result.current.formError).toBeNull();
  });
});
