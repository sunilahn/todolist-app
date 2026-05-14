import { useState } from 'react';
import { Button } from '@/components/Button';
import { NotificationList } from '@/features/notification/components/NotificationList';
import type { Notification } from '@/features/notification/types/notification.types';
import { useNotifications } from '@/features/notification/hooks/useNotifications';
import { useMarkAsRead, useMarkAllAsRead } from '@/features/notification/hooks/useMarkAsRead';
import { useAcceptInvitation } from '@/features/team/hooks/useAcceptInvitation';
import { useDeclineInvitation } from '@/features/team/hooks/useDeclineInvitation';

export default function NotificationPage() {
  const [activeInvitationId, setActiveInvitationId] = useState<string | null>(null);
  const [invitationActionLabels, setInvitationActionLabels] = useState<Record<string, string>>({});
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();
  const { mutate: acceptInvitation, isPending: isAcceptingInvitation } = useAcceptInvitation();
  const { mutate: declineInvitation, isPending: isDecliningInvitation } = useDeclineInvitation();

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const pendingInvitationId =
    isAcceptingInvitation || isDecliningInvitation ? activeInvitationId : null;

  const completeInvitationAction = (notification: Notification, label: string) => {
    const invitationId = notification.referenceId;
    if (!invitationId) return;

    setInvitationActionLabels((prev) => ({ ...prev, [invitationId]: label }));
    setActiveInvitationId(null);
    markAsRead(notification.notificationId);
  };

  const handleAcceptInvitation = (notification: Notification) => {
    if (!notification.referenceId) return;

    setActiveInvitationId(notification.referenceId);
    acceptInvitation(notification.referenceId, {
      onSuccess: () => completeInvitationAction(notification, '수락됨'),
      onError: () => setActiveInvitationId(null),
    });
  };

  const handleDeclineInvitation = (notification: Notification) => {
    if (!notification.referenceId) return;

    setActiveInvitationId(notification.referenceId);
    declineInvitation(notification.referenceId, {
      onSuccess: () => completeInvitationAction(notification, '거절됨'),
      onError: () => setActiveInvitationId(null),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg text-neutral-900">알림</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={unreadCount === 0 || isPending}
          onClick={() => markAllAsRead()}
        >
          모두 읽음
        </Button>
      </div>

      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        onRead={(id) => markAsRead(id)}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
        invitationActionLabels={invitationActionLabels}
        pendingInvitationId={pendingInvitationId}
      />
    </div>
  );
}
