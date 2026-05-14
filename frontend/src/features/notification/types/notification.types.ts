export type NotificationType = 'DUE_DATE_REMINDER' | 'TEAM_INVITE' | 'TODO_ASSIGNED';

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}
