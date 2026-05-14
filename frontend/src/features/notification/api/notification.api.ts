import api from '@/lib/axios';
import type { Notification } from '../types/notification.types';

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/notifications');
  return data;
}

export async function markAsRead(id: string): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
