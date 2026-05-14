import type { AxiosError } from 'axios';
import type { ApiError } from '../types/api.types';

export function getErrorMessage(error: unknown): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';

  const axiosError = error as AxiosError<ApiError>;
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

export function getErrorCode(error: unknown): string | null {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.code ?? null;
}

export function isConflictError(error: unknown): boolean {
  return getErrorCode(error) === 'CONFLICT';
}

export function isValidationError(error: unknown): boolean {
  return getErrorCode(error) === 'VALIDATION_ERROR';
}

export function isUnprocessableError(error: unknown): boolean {
  return getErrorCode(error) === 'UNPROCESSABLE';
}
