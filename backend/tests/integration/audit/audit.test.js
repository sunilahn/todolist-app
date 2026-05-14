import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import pool from '../../../src/config/database.js';

const AUTH = '/api/auth';
const PASS = 'Test1234!';

async function cleanupUser(email) {
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
  if (rows.length === 0) return;
  const userId = rows[0].user_id;
  // teams.created_by ON DELETE RESTRICT → 팀 먼저 삭제
  await pool.query('DELETE FROM teams WHERE created_by=$1', [userId]);
  await pool.query('DELETE FROM users WHERE user_id=$1', [userId]);
}

async function register(email, name = '감사유저') {
  const reg = await request(app).post(`${AUTH}/register`).send({ email, name, password: PASS });
  const login = await request(app).post(`${AUTH}/login`).send({ email, password: PASS });
  let userId = reg.body.userId;
  if (!userId) {
    const { rows } = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
    userId = rows[0]?.user_id;
  }
  return { userId, token: login.body.accessToken };
}

beforeAll(async () => {
  for (const e of ['audit_user_a@example.com', 'audit_user_b@example.com', 'audit_delete@example.com']) {
    await cleanupUser(e);
  }
});

afterAll(async () => {
  for (const e of ['audit_user_a@example.com', 'audit_user_b@example.com', 'audit_delete@example.com']) {
    await cleanupUser(e);
  }
  await pool.end();
});

// ─── Todo CUD ────────────────────────────────────────────────────────────────
describe('Todo CUD audit_logs', () => {
  let token;
  let todoId;

  beforeAll(async () => {
    const u = await register('audit_user_a@example.com');
    token = u.token;
  });

  it('Todo 생성 시 CREATE 레코드 삽입', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '감사 테스트 할일' });
    expect(res.status).toBe(201);
    todoId = res.body.todoId;

    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='Todo' AND entity_id=$1 AND change_type='CREATE'`,
      [todoId]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].before_value).toBeNull();
    expect(rows[0].after_value).not.toBeNull();
  });

  it('Todo 수정 시 UPDATE 레코드 + before/after 기록', async () => {
    await request(app)
      .patch(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '수정된 할일' });

    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='Todo' AND entity_id=$1 AND change_type='UPDATE'`,
      [todoId]
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].before_value).not.toBeNull();
    expect(rows[0].after_value).not.toBeNull();
  });

  it('Todo 삭제 시 DELETE 레코드 + after_value=NULL', async () => {
    await request(app)
      .delete(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);

    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='Todo' AND entity_id=$1 AND change_type='DELETE'`,
      [todoId]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].after_value).toBeNull();
    expect(rows[0].before_value).not.toBeNull();
  });
});

// ─── User DELETE 마스킹 (AUD-003) ────────────────────────────────────────────
describe('User DELETE audit_log 이메일·이름 마스킹 (AUD-003)', () => {
  it('User 탈퇴 시 before_value에 email·name이 없다', async () => {
    const { userId, token } = await register('audit_delete@example.com', '삭제유저');

    await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='User' AND entity_id=$1 AND change_type='DELETE'`,
      [userId]
    );
    expect(rows).toHaveLength(1);
    const before = rows[0].before_value;
    expect(before).not.toBeNull();
    expect(before.email).toBeUndefined();
    expect(before.name).toBeUndefined();
    expect(before.password_hash).toBeUndefined();
  });
});

// ─── password_hash 미포함 (AUD-003) ──────────────────────────────────────────
describe('audit_logs before/after에 password_hash 미포함 (AUD-003)', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const u = await register('audit_user_b@example.com');
    token = u.token;
    userId = u.userId;
  });

  it('User UPDATE before/after에 password_hash 없음', async () => {
    await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '이름변경' });

    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='User' AND entity_id=$1 AND change_type='UPDATE'`,
      [userId]
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const before = rows[0].before_value;
    const after = rows[0].after_value;
    expect(before?.password_hash).toBeUndefined();
    expect(after?.password_hash).toBeUndefined();
  });
});

// ─── actor_user_id=NULL 저장 가능 (AUD-004) ──────────────────────────────────
describe('actor_user_id=NULL 레코드 저장 (AUD-004)', () => {
  it('actor_user_id=NULL로 삽입된 audit_log가 정상 저장된다', async () => {
    const { rows } = await pool.query(
      `INSERT INTO audit_logs (entity_type, entity_id, change_type, actor_user_id, after_value)
       VALUES ('Todo', gen_random_uuid(), 'CREATE', NULL, '{"test":true}')
       RETURNING *`
    );
    expect(rows[0].actor_user_id).toBeNull();
    expect(rows[0].after_value).toMatchObject({ test: true });
  });
});

// ─── 6개 엔티티 CUD 이벤트 확인 ──────────────────────────────────────────────
describe('6개 엔티티 audit_logs 기록 확인', () => {
  it('Team, TeamMember, TeamInvitation CUD 이벤트가 audit_logs에 기록된다', async () => {
    const admin = await register('audit_user_a@example.com');
    const other = await register('audit_user_b@example.com');

    // Team CREATE
    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: '감사팀' });
    const teamId = teamRes.body.teamId;

    const { rows: teamLogs } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='Team' AND entity_id=$1`,
      [teamId]
    );
    expect(teamLogs.some((r) => r.change_type === 'CREATE')).toBe(true);

    // TeamMember CREATE (admin join) - actor_user_id로 확인
    const { rows: memberLogs } = await pool.query(
      `SELECT al.* FROM audit_logs al
       WHERE al.entity_type='TeamMember' AND al.change_type='CREATE' AND al.actor_user_id=$1`,
      [admin.userId]
    );
    expect(memberLogs.length).toBeGreaterThanOrEqual(1);

    // TeamInvitation CREATE
    const invRes = await request(app)
      .post(`/api/teams/${teamId}/invitations`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ invitedUserId: other.userId, role: 'MEMBER' });
    const invId = invRes.body.invitationId;

    const { rows: invLogs } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='TeamInvitation' AND entity_id=$1`,
      [invId]
    );
    expect(invLogs.some((r) => r.change_type === 'CREATE')).toBe(true);

    // Category CREATE
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: '감사카테고리' });
    const catId = catRes.body.categoryId;

    const { rows: catLogs } = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type='Category' AND entity_id=$1`,
      [catId]
    );
    expect(catLogs.some((r) => r.change_type === 'CREATE')).toBe(true);

    // cleanup
    await pool.query('DELETE FROM teams WHERE team_id=$1', [teamId]);
  });
});
