export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface PasswordResetRequestBody {
  email: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}
