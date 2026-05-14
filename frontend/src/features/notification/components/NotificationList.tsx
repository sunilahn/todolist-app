import { Spinner } from '@/components/Spinner';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../types/notification.types';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onRead: (id: string) => void;
  onAcceptInvitation?: (notification: Notification) => void;
  onDeclineInvitation?: (notification: Notification) => void;
  invitationActionLabels?: Record<string, string>;
  pendingInvitationId?: string | null;
}

export function NotificationList({
  notifications,
  isLoading,
  onRead,
  onAcceptInvitation,
  onDeclineInvitation,
  invitationActionLabels = {},
  pendingInvitationId = null,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 px-6 text-neutral-500">
        <span className="material-symbols-outlined text-5xl text-neutral-300">notifications</span>
        <p className="text-md text-neutral-500">알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.notificationId}
          notification={notification}
          onRead={onRead}
          onAcceptInvitation={onAcceptInvitation}
          onDeclineInvitation={onDeclineInvitation}
          invitationActionLabel={
            notification.referenceId ? invitationActionLabels[notification.referenceId] ?? null : null
          }
          isInvitationActionPending={
            !!notification.referenceId && pendingInvitationId === notification.referenceId
          }
        />
      ))}
    </div>
  );
}
