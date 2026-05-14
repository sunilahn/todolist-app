import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { authenticate } from '../../src/middlewares/auth.middleware.js';
import { signAccessToken } from '../../src/shared/utils/jwtUtils.js';
import { UnauthorizedError } from '../../src/shared/errors/index.js';

const mockReq = (headers = {}) => ({ headers });
const mockRes = () => ({});
const mockNext = () => {
  const fn = jest.fn();
  return fn;
};

describe('auth.middleware — authenticate()', () => {
  let res;

  beforeEach(() => {
    res = mockRes();
  });

  it('Authorization 헤더가 없으면 next를 UnauthorizedError("Authentication required.")로 호출한다', () => {
    const req = mockReq({});
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe('Authentication required.');
  });

  it('"Bearer " 형식이 아닌 헤더(예: "Token abc")는 next를 UnauthorizedError로 호출한다', () => {
    const req = mockReq({ authorization: 'Token abc123' });
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it('유효한 Bearer 토큰이면 next()가 인자 없이 호출된다', () => {
    const token = signAccessToken({ userId: 'user-001', email: 'user@example.com' });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('유효한 Bearer 토큰이면 req.user.userId와 req.user.email이 설정된다', () => {
    const payload = { userId: 'user-002', email: 'another@example.com' };
    const token = signAccessToken(payload);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = mockNext();

    authenticate(req, res, next);

    expect(req.user.userId).toBe(payload.userId);
    expect(req.user.email).toBe(payload.email);
  });

  it('만료/무효 토큰이면 next를 UnauthorizedError("Invalid or expired token.")로 호출한다', () => {
    const req = mockReq({ authorization: 'Bearer this.is.invalid' });
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe('Invalid or expired token.');
  });

  it('"Bearer "(토큰 부분 없음)이면 next를 UnauthorizedError로 호출한다', () => {
    const req = mockReq({ authorization: 'Bearer ' });
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });
});
