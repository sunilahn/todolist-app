import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import pool from '../../config/database.js';
import { env } from '../../config/env.js';
import logger from '../../shared/utils/logger.js';
import { ConflictError, UnauthorizedError, UnprocessableError } from '../../shared/errors/index.js';
import { hashPassword, comparePassword } from '../../shared/utils/passwordUtils.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '../../shared/utils/jwtUtils.js';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function sendPasswordResetEmail(to, resetUrl) {
  if (!env.EMAIL_SERVICE_API_KEY) {
    logger.warn(`[auth] 이메일 서비스 미설정 — reset URL: ${resetUrl}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: env.EMAIL_FROM_ADDRESS,
      pass: env.EMAIL_SERVICE_API_KEY,
    },
  });
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM_ADDRESS,
      to,
      subject: '비밀번호 재설정',
      text: `재설정 링크: ${resetUrl}`,
    });
  } catch (err) {
    logger.warn(`[auth] 이메일 발송 실패 (${to}): ${err.message}`);
  }
}

export async function register(email, name, password) {
  const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ConflictError('이미 사용 중인 이메일입니다.');
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await pool.query(
    `INSERT INTO users (user_id, email, name, password_hash)
     VALUES (gen_random_uuid(), $1, $2, $3)
     RETURNING user_id, email, name, created_at`,
    [email, name, passwordHash]
  );

  const user = rows[0];

  const defaultCategories = ['업무', '개인', '학습', '회의', '프로젝트', '긴급 업무'];
  await pool.query(
    `INSERT INTO categories (category_id, owner_id, owner_type, name)
     SELECT gen_random_uuid(), $1, 'USER', unnest($2::text[])`,
    [user.user_id, defaultCategories]
  );

  return {
    userId: user.user_id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
}

export async function login(email, password) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const user = rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const accessToken = signAccessToken({ userId: user.user_id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.user_id, email: user.email });
  const tokenHash = sha256(refreshToken);

  await pool.query(
    `INSERT INTO refresh_tokens (token_id, user_id, token_hash, expires_at)
     VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days')`,
    [user.user_id, tokenHash]
  );

  return { accessToken, refreshToken };
}

export async function logout(refreshToken, userId) {
  const tokenHash = sha256(refreshToken);

  const { rows } = await pool.query(
    'SELECT token_id FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL',
    [tokenHash, userId]
  );

  if (rows.length === 0) {
    return;
  }

  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND user_id = $2',
    [tokenHash, userId]
  );
}

export async function refresh(refreshToken) {
  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('유효하지 않은 리프레시 토큰입니다.');
  }

  const tokenHash = sha256(refreshToken);

  const { rows } = await pool.query(
    `SELECT rt.*, u.email
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  if (rows.length === 0) {
    throw new UnauthorizedError('유효하지 않은 리프레시 토큰입니다.');
  }

  const row = rows[0];

  if (row.revoked_at !== null) {
    throw new UnauthorizedError('이미 폐기된 리프레시 토큰입니다.');
  }

  if (new Date(row.expires_at) < new Date()) {
    throw new UnauthorizedError('만료된 리프레시 토큰입니다.');
  }

  // Rotate: revoke old token
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
    [tokenHash]
  );

  const newAccessToken = signAccessToken({ userId: row.user_id, email: row.email });
  const newRefreshToken = signRefreshToken({ userId: row.user_id, email: row.email });
  const newTokenHash = sha256(newRefreshToken);

  await pool.query(
    `INSERT INTO refresh_tokens (token_id, user_id, token_hash, expires_at)
     VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days')`,
    [row.user_id, newTokenHash]
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function requestPasswordReset(email) {
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    return;
  }

  const user = rows[0];
  const token = signPasswordResetToken(user.user_id);
  const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;

  await sendPasswordResetEmail(email, resetUrl);
}

export async function confirmPasswordReset(token, newPassword) {
  let decoded;
  try {
    decoded = verifyPasswordResetToken(token);
  } catch {
    throw new UnprocessableError('유효하지 않거나 만료된 재설정 링크입니다.');
  }

  if (decoded.type !== 'password_reset') {
    throw new UnprocessableError('유효하지 않거나 만료된 재설정 링크입니다.');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [newPasswordHash, decoded.userId]
  );

  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [decoded.userId]
  );
}
