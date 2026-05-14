import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ACCESS_ALGO = { algorithms: ['HS256'] };

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_REFRESH_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, ACCESS_ALGO);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
}

export function signPasswordResetToken(userId) {
  return jwt.sign(
    { userId, type: 'password_reset' },
    env.JWT_PASSWORD_RESET_SECRET,
    { expiresIn: '30m', algorithm: 'HS256' }
  );
}

export function verifyPasswordResetToken(token) {
  return jwt.verify(token, env.JWT_PASSWORD_RESET_SECRET, { algorithms: ['HS256'] });
}
