import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeleteAccount } from './useDeleteAccount';
import * as userApi from '../api/user.api';
import { useAuthStore } from '@/features/auth/stores/authStore';

vi.mock('../api/user.api', () => ({
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

describe('useDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setTokens('access', 'refresh');
  });

  it('초기 상태: error가 null이다', () => {
    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('탈퇴 성공 시 authStore가 초기화된다', async () => {
    vi.mocked(userApi.deleteAccount).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.deleteAccount({ password: 'Password1!' });
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('탈퇴 실패 시 error가 설정된다', async () => {
    vi.mocked(userApi.deleteAccount).mockRejectedValueOnce({
      response: { data: { code: 'UNAUTHORIZED', message: '비밀번호가 올바르지 않습니다.' } },
    });

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.deleteAccount({ password: 'wrongpassword' });
    });

    expect(result.current.error).toBe('비밀번호가 올바르지 않습니다.');
  });

  it('deleteAccount API가 비밀번호와 함께 호출된다', async () => {
    vi.mocked(userApi.deleteAccount).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.deleteAccount({ password: 'Password1!' });
    });

    expect(userApi.deleteAccount).toHaveBeenCalledWith({ password: 'Password1!' }, expect.anything());
  });
});
