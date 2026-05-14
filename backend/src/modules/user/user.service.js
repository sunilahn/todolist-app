import pool from '../../config/database.js';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/index.js';
import { logAudit } from '../audit/audit.service.js';
import { comparePassword } from '../../shared/utils/passwordUtils.js';

/**
 * 인증된 사용자 정보를 조회합니다.
 * password_hash는 절대 반환하지 않습니다.
 *
 * @param {string} userId - UUID
 * @returns {{ userId: string, email: string, name: string, createdAt: Date, updatedAt: Date }}
 */
export async function getMe(userId) {
  const { rows } = await pool.query(
    `SELECT user_id, email, name, created_at, updated_at
     FROM users
     WHERE user_id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  const user = rows[0];
  return {
    userId: user.user_id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * 인증된 사용자의 프로필(name)을 수정합니다.
 *
 * @param {string} userId - UUID
 * @param {{ name?: string }} data - 수정할 필드
 * @returns {{ userId: string, email: string, name: string, createdAt: Date, updatedAt: Date }}
 */
export async function updateMe(userId, { name }) {
  const before = await getMe(userId);

  const { rows } = await pool.query(
    `UPDATE users
     SET name = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id, email, name, created_at, updated_at`,
    [name, userId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  const user = rows[0];
  const after = {
    userId: user.user_id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
  await logAudit('User', userId, 'UPDATE', userId, before, after);
  return after;
}

/**
 * 인증된 사용자를 하드 삭제합니다.
 * 1. 비밀번호 확인
 * 2. 해당 사용자의 유효한 refresh_tokens를 모두 폐기(revoked_at 설정)
 * 3. users 테이블에서 해당 행 삭제
 *
 * @param {string} userId - UUID
 * @param {string} password - 비밀번호 확인용
 * @returns {Promise<void>}
 */
export async function deleteMe(userId, password) {
  // 1. 비밀번호 확인을 위해 password_hash 포함하여 조회
  const { rows } = await pool.query(
    `SELECT user_id, password_hash FROM users WHERE user_id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  const user = rows[0];
  const isPasswordMatch = await comparePassword(password, user.password_hash);
  if (!isPasswordMatch) {
    throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');
  }

  const before = await getMe(userId);

  // AUD-003: 감사 로그는 삭제 전 기록 (FK 유효성 보장)
  await logAudit('User', userId, 'DELETE', userId, before, null);

  // 1. 개인 할일 삭제 (개인 할일은 user_id가 필수이므로 SET NULL 불가하여 수동 삭제)
  await pool.query(
    `DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL`,
    [userId]
  );

  // 2. 유효한 리프레시 토큰 모두 폐기
  await pool.query(
    `UPDATE refresh_tokens

     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );

  // 3. 사용자 하드 삭제 (ON DELETE CASCADE로 연관 데이터 자동 정리)
  await pool.query(
    `DELETE FROM users WHERE user_id = $1`,
    [userId]
  );
}
