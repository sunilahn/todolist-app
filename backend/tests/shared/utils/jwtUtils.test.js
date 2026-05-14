import { describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '../../../src/shared/utils/jwtUtils.js';

const TEST_PAYLOAD = { userId: 'user-123', email: 'test@example.com' };

describe('jwtUtils', () => {
  describe('signAccessToken / verifyAccessToken', () => {
    it('문자열을 반환하고 verifyAccessToken으로 검증 가능하다', () => {
      const token = signAccessToken(TEST_PAYLOAD);

      expect(typeof token).toBe('string');
      expect(() => verifyAccessToken(token)).not.toThrow();
    });

    it('verifyAccessToken이 payload.userId와 payload.email을 정확히 반환한다', () => {
      const token = signAccessToken(TEST_PAYLOAD);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
      expect(decoded.email).toBe(TEST_PAYLOAD.email);
    });

    it('토큰에 exp 필드(만료 시각)가 포함된다', () => {
      const token = signAccessToken(TEST_PAYLOAD);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded.exp).toBe('number');
      // exp = iat + 3600(1h)
      expect(decoded.exp - decoded.iat).toBe(3600);
    });

    it('만료된 access 토큰은 verifyAccessToken이 에러를 던진다', () => {
      // expiresIn: 0 → 즉시 만료 토큰 생성
      const expiredToken = jwt.sign(
        TEST_PAYLOAD,
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: 0 }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });

    it('임의 문자열은 verifyAccessToken이 에러를 던진다', () => {
      expect(() => verifyAccessToken('invalid.token.string')).toThrow();
    });
  });

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('문자열을 반환하고 verifyRefreshToken으로 검증 가능하다', () => {
      const token = signRefreshToken(TEST_PAYLOAD);

      expect(typeof token).toBe('string');
      expect(() => verifyRefreshToken(token)).not.toThrow();
    });
  });

  describe('signPasswordResetToken / verifyPasswordResetToken', () => {
    it('decoded.userId와 decoded.type이 "password_reset"으로 설정된다', () => {
      const userId = 'user-456';
      const token = signPasswordResetToken(userId);
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('password_reset');
    });

    it('만료된 password reset 토큰은 verifyPasswordResetToken이 에러를 던진다', () => {
      const expiredToken = jwt.sign(
        { userId: 'user-789', type: 'password_reset' },
        process.env.JWT_PASSWORD_RESET_SECRET,
        { expiresIn: 0 }
      );

      expect(() => verifyPasswordResetToken(expiredToken)).toThrow();
    });

    it('access token 시크릿으로 서명된 토큰은 verifyPasswordResetToken이 에러를 던진다 (시크릿 분리 검증)', () => {
      const crossToken = jwt.sign(
        { userId: 'user-999', type: 'password_reset' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '30m' }
      );
      expect(() => verifyPasswordResetToken(crossToken)).toThrow();
    });
  });
});
