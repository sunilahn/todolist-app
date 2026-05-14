import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import pool from '../../../src/config/database.js';

const AUTH = '/api/auth';
const BASE = '/api/notifications';

const EMAIL_A = 'notif_user_a@example.com';
const EMAIL_B = 'notif_user_b@example.com';
const PASS = 'Test1234!';
const NAME_A = '알림유저A';
const NAME_B = '알림유저B';

let tokenA;
let userIdA;
let tokenB;
let userIdB;

async function cleanupUser(email) {
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
  if (rows.length > 0) {
    await pool.query('DELETE FROM users WHERE user_id=$1', [rows[0].user_id]);
  }
}

beforeAll(async () => {
  await cleanupUser(EMAIL_A);
  await cleanupUser(EMAIL_B);

  const regA = await request(app).post(`${AUTH}/register`).send({ email: EMAIL_A, name: NAME_A, password: PASS });
  const loginA = await request(app).post(`${AUTH}/login`).send({ email: EMAIL_A, password: PASS });
  tokenA = loginA.body.accessToken;
  userIdA = regA.body.userId;

  const regB = await request(app).post(`${AUTH}/register`).send({ email: EMAIL_B, name: NAME_B, password: PASS });
  const loginB = await request(app).post(`${AUTH}/login`).send({ email: EMAIL_B, password: PASS });
  tokenB = loginB.body.accessToken;
  userIdB = regB.body.userId;
});

afterAll(async () => {
  await cleanupUser(EMAIL_A);
  await cleanupUser(EMAIL_B);
  await pool.end();
});

// ─── 알림 직접 삽입 헬퍼 ──────────────────────────────────────────────────────
async function insertNotification(userId, type = 'DUE_DATE_REMINDER', message = '테스트 알림') {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3) RETURNING *`,
    [userId, type, message]
  );
  return rows[0];
}

// ─── GET /notifications ───────────────────────────────────────────────────────
describe('GET /api/notifications', () => {
  it('미인증 → 401', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });

  it('인증된 사용자의 알림 목록 반환 (최신순)', async () => {
    await insertNotification(userIdA, 'DUE_DATE_REMINDER', '첫 번째 알림');
    await insertNotification(userIdA, 'DUE_DATE_REMINDER', '두 번째 알림');

    const res = await request(app).get(BASE).set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // 최신순 정렬 확인
    const dates = res.body.map((n) => new Date(n.createdAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('다른 사용자의 알림은 반환되지 않음', async () => {
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userIdA]);
    await insertNotification(userIdA, 'DUE_DATE_REMINDER', 'A의 알림');

    const resB = await request(app).get(BASE).set('Authorization', `Bearer ${tokenB}`);
    const notifIds = resB.body.map((n) => n.userId);
    expect(notifIds.every((id) => id === userIdB)).toBe(true);
  });
});

// ─── PATCH /notifications/:id/read ───────────────────────────────────────────
describe('PATCH /api/notifications/:id/read', () => {
  let notifId;

  beforeEach(async () => {
    const notif = await insertNotification(userIdA, 'DUE_DATE_REMINDER', '읽음 테스트');
    notifId = notif.notification_id;
  });

  it('미인증 → 401', async () => {
    const res = await request(app).patch(`${BASE}/${notifId}/read`);
    expect(res.status).toBe(401);
  });

  it('본인 알림 읽음 처리 → 200, is_read=true', async () => {
    const res = await request(app)
      .patch(`${BASE}/${notifId}/read`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it('타인 알림 읽음 처리 → 403', async () => {
    const res = await request(app)
      .patch(`${BASE}/${notifId}/read`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('존재하지 않는 알림 → 404', async () => {
    const res = await request(app)
      .patch(`${BASE}/00000000-0000-0000-0000-000000000000/read`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /notifications/read-all ───────────────────────────────────────────
describe('PATCH /api/notifications/read-all', () => {
  beforeEach(async () => {
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userIdA]);
    await insertNotification(userIdA, 'DUE_DATE_REMINDER', '미읽음1');
    await insertNotification(userIdA, 'DUE_DATE_REMINDER', '미읽음2');
  });

  it('미인증 → 401', async () => {
    const res = await request(app).patch(`${BASE}/read-all`);
    expect(res.status).toBe(401);
  });

  it('전체 읽음 처리 → 204', async () => {
    const res = await request(app)
      .patch(`${BASE}/read-all`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(204);

    const { rows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userIdA]
    );
    expect(parseInt(rows[0].cnt, 10)).toBe(0);
  });
});
