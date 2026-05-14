import { useNavigate } from 'react-router-dom';
import type { Notification } from '../types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onAcceptInvitation?: (notification: Notification) => void;
  onDeclineInvitation?: (notification: Notification) => void;
  invitationActionLabel?: string | null;
  isInvitationActionPending?: boolean;
}

function getTimeAgo(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const iconMap: Record<Notification['type'], string> = {
  TEAM_INVITE: 'mail',
  DUE_DATE_REMINDER: 'alarm',
  TODO_ASSIGNED: 'assignment',
};

const routeMap: Record<Notification['type'], string> = {
  TEAM_INVITE: '/notifications',
  DUE_DATE_REMINDER: '/todos',
  TODO_ASSIGNED: '/todos',
};

export function NotificationItem({
  notification,
  onRead,
  onAcceptInvitation,
  onDeclineInvitation,
  invitationActionLabel,
  isInvitationActionPending = false,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const canRespondToInvite =
    notification.type === 'TEAM_INVITE' &&
    notification.referenceId &&
    !invitationActionLabel &&
    onAcceptInvitation &&
    onDeclineInvitation;

  const handleClick = () => {
    onRead(notification.notificationId);
    navigate(routeMap[notification.type]);
  };

  const unreadClass =
    'flex gap-3 px-4 py-3 bg-primary-light border-l-4 border-primary cursor-pointer hover:brightness-95 transition-[filter] duration-fast';
  const readClass =
    'flex gap-3 px-4 py-3 bg-white border-l-4 border-transparent cursor-pointer hover:bg-neutral-50 transition-colors duration-fast';

  return (
    <div className={notification.isRead ? readClass : unreadClass} onClick={handleClick}>
      <span className="material-symbols-outlined text-xl text-neutral-500 shrink-0">
        {iconMap[notification.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm text-neutral-800">{notification.message}</p>
          <span className="text-xs text-neutral-400 shrink-0 whitespace-nowrap">
            {getTimeAgo(notification.createdAt)}
          </span>
        </div>
        {canRespondToInvite && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:brightness-95 transition-[filter] duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isInvitationActionPending}
              onClick={(event) => {
                event.stopPropagation();
                onAcceptInvitation(notification);
              }}
            >
              수락
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isInvitationActionPending}
              onClick={(event) => {
                event.stopPropagation();
                onDeclineInvitation(notification);
              }}
            >
              거절
            </button>
          </div>
        )}
        {invitationActionLabel && (
          <p className="mt-3 text-sm text-neutral-500">{invitationActionLabel}</p>
        )}
      </div>
    </div>
  );
}
