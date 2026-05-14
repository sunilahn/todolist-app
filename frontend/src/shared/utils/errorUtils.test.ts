import { getErrorMessage, getErrorCode, isConflictError, isValidationError, isUnprocessableError } from './errorUtils';
import type { AxiosError } from 'axios';

function makeAxiosError(status: number, data: { code: string; message: string }): AxiosError {
  return {
    response: { status, data },
    message: 'Request failed',
  } as unknown as AxiosError;
}

describe('getErrorMessage', () => {
  it('axios error에서 message 추출', () => {
    const error = makeAxiosError(400, { code: 'BAD_REQUEST', message: '잘못된 요청입니다.' });
    expect(getErrorMessage(error)).toBe('잘못된 요청입니다.');
  });

  it('알 수 없는 에러 처리 - null', () => {
    expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('알 수 없는 에러 처리 - response 없는 axios error', () => {
    const error = { message: 'Network Error' } as AxiosError;
    expect(getErrorMessage(error)).toBe('Network Error');
  });
});

describe('getErrorCode', () => {
  it('code 추출', () => {
    const error = makeAxiosError(409, { code: 'CONFLICT', message: '충돌' });
    expect(getErrorCode(error)).toBe('CONFLICT');
  });

  it('response 없을 때 null 반환', () => {
    expect(getErrorCode({})).toBeNull();
  });
});

describe('isConflictError', () => {
  it('CONFLICT 코드에 대해 true 반환', () => {
    const error = makeAxiosError(409, { code: 'CONFLICT', message: '충돌' });
    expect(isConflictError(error)).toBe(true);
  });

  it('다른 코드에 대해 false 반환', () => {
    const error = makeAxiosError(400, { code: 'BAD_REQUEST', message: '잘못된 요청' });
    expect(isConflictError(error)).toBe(false);
  });
});

describe('isValidationError', () => {
  it('VALIDATION_ERROR 코드에 대해 true 반환', () => {
    const error = makeAxiosError(422, { code: 'VALIDATION_ERROR', message: '유효성 오류' });
    expect(isValidationError(error)).toBe(true);
  });

  it('다른 코드에 대해 false 반환', () => {
    const error = makeAxiosError(409, { code: 'CONFLICT', message: '충돌' });
    expect(isValidationError(error)).toBe(false);
  });
});

describe('isUnprocessableError', () => {
  it('UNPROCESSABLE 코드에 대해 true 반환', () => {
    const error = makeAxiosError(422, { code: 'UNPROCESSABLE', message: '처리 불가' });
    expect(isUnprocessableError(error)).toBe(true);
  });

  it('다른 코드에 대해 false 반환', () => {
    const error = makeAxiosError(400, { code: 'BAD_REQUEST', message: '잘못된 요청' });
    expect(isUnprocessableError(error)).toBe(false);
  });
});
