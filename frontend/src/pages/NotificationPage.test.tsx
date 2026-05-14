import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import NotificationPage from './NotificationPage';
import * as useNotificationsHook from '@/features/notification/hooks/useNotifications';
import * as useMarkAsReadHook from '@/features/notification/hooks/useMarkAsRead';

vi.mock('@/features/notification/hooks/useNotifications');
vi.mock('@/features/notification/hooks/useMarkAsRead');
vi.mock('@/features/team/hooks/useAcceptInvitation', () => ({
  useAcceptInvitation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/team/hooks/useDeclineInvitation', () => ({
  useDeclineInvitation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockNotifications = [
  {
    notificationId: 'n-1',
    userId: 'user-1',
    type: 'TODO_ASSIGNED',
    message: '첫 번째 알림',
    referenceId: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    notificationId: 'n-2',
    userId: 'user-1',
    type: 'DUE_DATE_REMINDER',
    message: '두 번째 알림',
    referenceId: null,
    isRead: true,
    createdAt: new Date().toISOString(),
  },
];

describe('NotificationPage', () => {
  beforeEach(() => {
    vi.mocked(useNotificationsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
    } as any);

    vi.mocked(useMarkAsReadHook.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useMarkAsReadHook.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('알림 제목과 미읽음 개수 뱃지가 표시된다', () => {
    render(<NotificationPage />, { wrapper });
    expect(screen.getByText('알림')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // n-1 is unread
  });

  it('모두 읽음 버튼을 클릭하면 markAllAsRead가 호출된다', async () => {
    const markAllAsRead = vi.fn();
    vi.mocked(useMarkAsReadHook.useMarkAllAsRead).mockReturnValue({
      mutate: markAllAsRead,
      isPending: false,
    } as any);

    render(<NotificationPage />, { wrapper });
    const button = screen.getByRole('button', { name: '모두 읽음' });
    await userEvent.click(button);
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it('알림 목록이 렌더링된다', () => {
    render(<NotificationPage />, { wrapper });
    expect(screen.getByText('첫 번째 알림')).toBeInTheDocument();
    expect(screen.getByText('두 번째 알림')).toBeInTheDocument();
  });
});
