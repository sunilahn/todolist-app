import api from '@/lib/axios';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await api.get('/users/me');
  return res.data;
}

export async function updateProfile(body: { name: string }): Promise<UserProfile> {
  const res = await api.patch('/users/me', body);
  return res.data;
}

export async function deleteAccount(body: { password: string }): Promise<void> {
  await api.delete('/users/me', { data: body });
}
