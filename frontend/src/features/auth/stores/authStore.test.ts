import { useAuthStore } from './authStore';

beforeEach(() => {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
  });
});

describe('authStore', () => {
  it('초기 상태 확인 (accessToken: null, refreshToken: null)', () => {
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it('setTokens 동작 확인', () => {
    useAuthStore.getState().setTokens('access-abc', 'refresh-xyz');
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe('access-abc');
    expect(refreshToken).toBe('refresh-xyz');
  });

  it('setAccessToken 동작 확인', () => {
    useAuthStore.getState().setTokens('old-access', 'refresh-xyz');
    useAuthStore.getState().setAccessToken('new-access');
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe('new-access');
    expect(refreshToken).toBe('refresh-xyz');
  });

  it('clear 동작 확인', () => {
    useAuthStore.getState().setTokens('access-abc', 'refresh-xyz');
    useAuthStore.getState().clear();
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});
