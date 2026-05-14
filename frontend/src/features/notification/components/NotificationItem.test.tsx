import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NotificationItem } from './NotificationItem';
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

const baseNotification: Notification = {
  notificationId: 'n-1',
  userId: 'user-1',
  type: 'TODO_ASSIGNED',
  message: '할일이 배정되었습니다.',
  referenceId: null,
  isRead: false,
  createdAt: new Date().toISOString(),
};

describe('NotificationItem', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('미읽음 알림은 bg-primary-light 클래스를 가진다', () => {
    const { container } = render(
      <NotificationItem notification={baseNotification} onRead={vi.fn()} />,
      { wrapper }
    );
    expect(container.firstChild).toHaveClass('bg-primary-light');
  });

  it('읽음 알림은 bg-white 클래스를 가진다', () => {
    const { container } = render(
      <NotificationItem notification={{ ...baseNotification, isRead: true }} onRead={vi.fn()} />,
      { wrapper }
    );
    expect(container.firstChild).toHaveClass('bg-white');
  });

  it('클릭 시 onRead가 알림 ID로 호출된다', async () => {
    const onRead = vi.fn();
    const { container } = render(
      <NotificationItem notification={baseNotification} onRead={onRead} />,
      { wrapper }
    );
    await userEvent.click(container.firstChild as HTMLElement);
    expect(onRead).toHaveBeenCalledWith('n-1');
  });

  it('TEAM_INVITE 타입 알림은 mail 아이콘을 표시한다', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, type: 'TEAM_INVITE' }}
        onRead={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText('mail')).toBeInTheDocument();
  });

  it('DUE_DATE_REMINDER 타입 알림은 alarm 아이콘을 표시한다', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, type: 'DUE_DATE_REMINDER' }}
        onRead={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText('alarm')).toBeInTheDocument();
  });

  it('알림 메시지가 표시된다', () => {
    render(<NotificationItem notification={baseNotification} onRead={vi.fn()} />, { wrapper });
    expect(screen.getByText('할일이 배정되었습니다.')).toBeInTheDocument();
  });

  it('TEAM_INVITE 알림은 수락/거절 버튼을 표시한다', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, type: 'TEAM_INVITE', referenceId: 'inv-1' }}
        onRead={vi.fn()}
        onAcceptInvitation={vi.fn()}
        onDeclineInvitation={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: '수락' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거절' })).toBeInTheDocument();
  });

  it('수락/거절 버튼 클릭은 이동 대신 초대 액션만 호출한다', async () => {
    const onRead = vi.fn();
    const onAcceptInvitation = vi.fn();
    const onDeclineInvitation = vi.fn();

    render(
      <NotificationItem
        notification={{ ...baseNotification, type: 'TEAM_INVITE', referenceId: 'inv-1' }}
        onRead={onRead}
        onAcceptInvitation={onAcceptInvitation}
        onDeclineInvitation={onDeclineInvitation}
      />,
      { wrapper }
    );

    await userEvent.click(screen.getByRole('button', { name: '수락' }));
    await userEvent.click(screen.getByRole('button', { name: '거절' }));

    expect(onAcceptInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ notificationId: 'n-1' })
    );
    expect(onDeclineInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ notificationId: 'n-1' })
    );
    expect(onRead).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('초대 응답 완료 상태를 텍스트로 표시한다', () => {
    render(
      <NotificationItem
        notification={{ ...baseNotification, type: 'TEAM_INVITE', referenceId: 'inv-1' }}
        onRead={vi.fn()}
        invitationActionLabel="수락됨"
      />,
      { wrapper }
    );

    expect(screen.getByText('수락됨')).toBeInTheDocument();
  });
});
