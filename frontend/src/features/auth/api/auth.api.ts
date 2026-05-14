import api from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutRequest,
  PasswordResetRequestBody,
  PasswordResetRequestResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
} from '../types/auth.types';

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', body);
  return data;
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', body);
  return data;
}

export async function logout(body: LogoutRequest): Promise<void> {
  await api.post('/auth/logout', body);
}

export async function requestPasswordReset(body: PasswordResetRequestBody): Promise<PasswordResetRequestResponse> {
  const { data } = await api.post<PasswordResetRequestResponse>('/auth/password-reset/request', body);
  return data;
}

export async function confirmPasswordReset(body: PasswordResetConfirmRequest): Promise<PasswordResetConfirmResponse> {
  const { data } = await api.post<PasswordResetConfirmResponse>('/auth/password-reset/confirm', body);
  return data;
}
