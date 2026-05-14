import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRegister } from './useRegister';
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

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('회원가입 성공 시 register API를 호출한다', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      userId: '1',
      email: 'test@test.com',
      name: '테스트',
      createdAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.register({ email: 'test@test.com', name: '테스트', password: 'Password1!' });
    });

    expect(authApi.register).toHaveBeenCalledWith(
      {
        email: 'test@test.com',
        name: '테스트',
        password: 'Password1!',
      },
      expect.anything()
    );
  });

  it('중복 이메일 시 formError가 설정된다', async () => {
    const mockError = {
      response: { data: { code: 'CONFLICT', message: '이미 사용 중인 이메일입니다.' } },
    };
    vi.mocked(authApi.register).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.register({ email: 'dup@test.com', name: '테스트', password: 'Password1!' });
    });

    expect(result.current.formError).toBe('이미 사용 중인 이메일입니다.');
  });

  it('초기 formError는 null이다', () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });
    expect(result.current.formError).toBeNull();
  });
});
