import pool from '../../config/database.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js';

function mapNotification(row) {
  return {
    notificationId: row.notification_id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    referenceId: row.reference_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function createNotification(userId, type, message, referenceId = null) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, message, reference_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, type, message, referenceId]
  );
  return mapNotification(rows[0]);
}

export async function getNotifications(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(mapNotification);
}

export async function markAsRead(notificationId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE notification_id = $1`,
    [notificationId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('알림을 찾을 수 없습니다.');
  }

  if (rows[0].user_id !== userId) {
    throw new ForbiddenError('해당 알림에 접근 권한이 없습니다.');
  }

  const { rows: updated } = await pool.query(
    `UPDATE notifications SET is_read = true WHERE notification_id = $1 RETURNING *`,
    [notificationId]
  );
  return mapNotification(updated[0]);
}

export async function markAllAsRead(userId) {
  await pool.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
}
