import pool from '../../config/database.js';
import logger from '../../shared/utils/logger.js';

const SENSITIVE_KEYS = new Set(['password_hash', 'token', 'token_hash', 'access_token', 'refresh_token']);

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) continue;
    result[k] = v;
  }
  return result;
}

function maskUser(obj) {
  if (!obj) return obj;
  // eslint-disable-next-line no-unused-vars
  const { email, name, ...rest } = obj;
  return rest;
}

/**
 * @param {'User'|'Todo'|'Category'|'Team'|'TeamMember'|'TeamInvitation'} entityType
 * @param {string} entityId
 * @param {'CREATE'|'UPDATE'|'DELETE'} changeType
 * @param {string|null} actorUserId
 * @param {object|null} beforeValue
 * @param {object|null} afterValue
 * @param {object|null} metadata
 */
export async function logAudit(
  entityType,
  entityId,
  changeType,
  actorUserId,
  beforeValue = null,
  afterValue = null,
  metadata = null
) {
  try {
    const isUserDelete = entityType === 'User' && changeType === 'DELETE';

    const sanitizedBefore = beforeValue
      ? (isUserDelete ? maskUser(sanitize(beforeValue)) : sanitize(beforeValue))
      : null;
    const sanitizedAfter = afterValue
      ? (isUserDelete ? maskUser(sanitize(afterValue)) : sanitize(afterValue))
      : null;

    await pool.query(
      `INSERT INTO audit_logs (entity_type, entity_id, change_type, actor_user_id, before_value, after_value, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entityType,
        entityId,
        changeType,
        actorUserId ?? null,
        sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
        sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    logger.error('[audit] 감사 로그 기록 실패:', err.message);
  }
}
