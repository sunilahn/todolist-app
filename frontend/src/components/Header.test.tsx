import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import * as useNotificationsHook from '@/features/notification/hooks/useNotifications';
import * as useAuthStoreHook from '@/features/auth/stores/authStore';

vi.mock('@/features/notification/hooks/useNotifications');
vi.mock('@/features/auth/stores/authStore');

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useNotificationsHook.useNotifications).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    (useAuthStoreHook.useAuthStore as any).getState = vi.fn().mockReturnValue({
      user: { name: '테스트 유저' },
      logout: vi.fn(),
    });
    
    (useAuthStoreHook.useAuthStore as any).mockImplementation((selector: any) => selector({
      user: { name: '테스트 유저' },
      logout: vi.fn(),
    }));
  });

  it('로고가 렌더링된다', () => {
    render(<Header />, { wrapper });
    expect(screen.getByText('Todolist')).toBeInTheDocument();
  });

  it('사용자 이름이 표시된다', () => {
    render(<Header />, { wrapper });
    expect(screen.getByText('테스트 유저')).toBeInTheDocument();
  });

  it('미읽음 알림이 있을 때 뱃지가 표시된다', () => {
    vi.mocked(useNotificationsHook.useNotifications).mockReturnValue({
      data: [
        { notificationId: '1', isRead: false },
        { notificationId: '2', isRead: false },
        { notificationId: '3', isRead: true },
      ],
      isLoading: false,
    } as any);

    render(<Header />, { wrapper });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('99개 초과의 미읽음 알림은 99+로 표시된다', () => {
    const manyNotifications = Array.from({ length: 150 }, (_, i) => ({
      notificationId: String(i),
      isRead: false,
    }));

    vi.mocked(useNotificationsHook.useNotifications).mockReturnValue({
      data: manyNotifications,
      isLoading: false,
    } as any);

    render(<Header />, { wrapper });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('미읽음 알림이 없으면 뱃지가 표시되지 않는다', () => {
    vi.mocked(useNotificationsHook.useNotifications).mockReturnValue({
      data: [{ notificationId: '1', isRead: true }],
      isLoading: false,
    } as any);

    render(<Header />, { wrapper });
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
