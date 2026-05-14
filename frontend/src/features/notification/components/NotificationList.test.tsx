import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NotificationList } from './NotificationList';
import type { Notification } from '../types/notification.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const makeNotification = (id: string, message: string): Notification => ({
  notificationId: id,
  userId: 'user-1',
  type: 'TODO_ASSIGNED',
  message,
  referenceId: null,
  isRead: false,
  createdAt: new Date().toISOString(),
});

describe('NotificationList', () => {
  it('로딩 중일 때 Spinner가 렌더링된다', () => {
    render(
      <NotificationList notifications={[]} isLoading={true} onRead={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });

  it('알림이 없을 때 "알림이 없습니다." 메시지가 표시된다', () => {
    render(
      <NotificationList notifications={[]} isLoading={false} onRead={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText('알림이 없습니다.')).toBeInTheDocument();
  });

  it('알림 목록이 렌더링된다', () => {
    const notifications = [
      makeNotification('n-1', '첫 번째 알림'),
      makeNotification('n-2', '두 번째 알림'),
    ];
    render(
      <NotificationList notifications={notifications} isLoading={false} onRead={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText('첫 번째 알림')).toBeInTheDocument();
    expect(screen.getByText('두 번째 알림')).toBeInTheDocument();
  });

  it('알림 클릭 시 onRead가 호출된다', async () => {
    const onRead = vi.fn();
    const notifications = [makeNotification('n-1', '테스트 알림')];
    render(
      <NotificationList notifications={notifications} isLoading={false} onRead={onRead} />,
      { wrapper }
    );
    await userEvent.click(screen.getByText('테스트 알림'));
    expect(onRead).toHaveBeenCalledWith('n-1');
  });
});
