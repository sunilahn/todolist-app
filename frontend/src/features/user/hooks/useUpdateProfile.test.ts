import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUpdateProfile } from './useUpdateProfile';
import * as userApi from '../api/user.api';

vi.mock('../api/user.api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}));

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

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('초기 상태: successMessage와 formError가 null이다', () => {
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    expect(result.current.successMessage).toBeNull();
    expect(result.current.formError).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('수정 성공 시 successMessage가 설정된다', async () => {
    const mockProfile = { userId: '1', email: 'test@test.com', name: '홍길동', createdAt: '', updatedAt: '' };
    vi.mocked(userApi.updateProfile).mockResolvedValueOnce(mockProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.updateProfile({ name: '홍길동' });
    });

    expect(result.current.successMessage).toBe('정보가 수정되었습니다.');
    expect(result.current.formError).toBeNull();
  });

  it('수정 실패 시 formError가 설정된다', async () => {
    vi.mocked(userApi.updateProfile).mockRejectedValueOnce({
      response: { data: { code: 'VALIDATION_ERROR', message: '이름은 1자 이상이어야 합니다.' } },
    });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.updateProfile({ name: '' });
    });

    expect(result.current.formError).toBe('이름은 1자 이상이어야 합니다.');
    expect(result.current.successMessage).toBeNull();
  });

  it('updateProfile API가 올바른 인수로 호출된다', async () => {
    const mockProfile = { userId: '1', email: 'test@test.com', name: '수정됨', createdAt: '', updatedAt: '' };
    vi.mocked(userApi.updateProfile).mockResolvedValueOnce(mockProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.updateProfile({ name: '수정됨' });
    });

    expect(userApi.updateProfile).toHaveBeenCalledWith({ name: '수정됨' }, expect.anything());
  });
});
