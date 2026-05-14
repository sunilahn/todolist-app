import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import pool from '../../../src/config/database.js';

const AUTH = '/api/auth';
const BASE = '/api/teams';
const INV_BASE = '/api/invitations';

const PASS = 'Test1234!';
const users = {
  admin: { email: 'team_admin@example.com', name: '팀어드민', token: null, userId: null },
  member: { email: 'team_member@example.com', name: '팀멤버', token: null, userId: null },
  viewer: { email: 'team_viewer@example.com', name: '팀뷰어', token: null, userId: null },
  other: { email: 'team_other@example.com', name: '외부유저', token: null, userId: null },
};

async function cleanupUser(email) {
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
  if (rows.length > 0) {
    await pool.query('DELETE FROM users WHERE user_id=$1', [rows[0].user_id]);
  }
}

async function registerAndLogin(u) {
  const reg = await request(app).post(`${AUTH}/register`).send({ email: u.email, name: u.name, password: PASS });
  const login = await request(app).post(`${AUTH}/login`).send({ email: u.email, password: PASS });
  u.token = login.body.accessToken;
  u.userId = reg.body.userId;
}

beforeAll(async () => {
  for (const u of Object.values(users)) {
    await cleanupUser(u.email);
    await registerAndLogin(u);
  }
});

afterAll(async () => {
  for (const u of Object.values(users)) {
    await cleanupUser(u.email);
  }
  await pool.end();
});

// ─── POST /teams ──────────────────────────────────────────────────────────────
describe('POST /api/teams', () => {
  let teamId;
  afterEach(async () => {
    if (teamId) {
      await pool.query('DELETE FROM teams WHERE team_id=$1', [teamId]);
      teamId = null;
    }
  });

  it('미인증 → 401', async () => {
    const res = await request(app).post(BASE).send({ name: '테스트팀' });
    expect(res.status).toBe(401);
  });

  it('팀 생성 성공 → 201, 생성자가 team_members에 ADMIN으로 삽입됨 (TEAM-001)', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ name: '나의 팀' });
    expect(res.status).toBe(201);
    expect(res.body.teamId).toBeDefined();
    expect(res.body.name).toBe('나의 팀');
    teamId = res.body.teamId;

    const { rows } = await pool.query(
      `SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2`,
      [teamId, users.admin.userId]
    );
    expect(rows[0].role).toBe('ADMIN');
  });

  it('이름 없이 생성 → 400', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─── 팀 CRUD (GET/PATCH/DELETE) ───────────────────────────────────────────────
describe('팀 CRUD', () => {
  let teamId;

  beforeEach(async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ name: 'CRUD 테스트팀' });
    teamId = res.body.teamId;
  });

  afterEach(async () => {
    await pool.query('DELETE FROM teams WHERE team_id=$1', [teamId]);
  });

  it('GET /teams → 본인 팀 목록 반환', async () => {
    const res = await request(app).get(BASE).set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.some((t) => t.teamId === teamId)).toBe(true);
  });

  it('GET /teams/:id → 팀 상세 조회 (멤버)', async () => {
    const res = await request(app).get(`${BASE}/${teamId}`).set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.teamId).toBe(teamId);
  });

  it('GET /teams/:id → 비멤버 403', async () => {
    const res = await request(app).get(`${BASE}/${teamId}`).set('Authorization', `Bearer ${users.other.token}`);
    expect(res.status).toBe(403);
  });

  it('PATCH /teams/:id → ADMIN만 수정 가능', async () => {
    const res = await request(app)
      .patch(`${BASE}/${teamId}`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ name: '수정된 팀명' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('수정된 팀명');
  });

  it('DELETE /teams/:id → ADMIN만 삭제, 팀 할일·카테고리 함께 삭제됨 (TEAM-005)', async () => {
    // 팀 할일 생성
    const { rows: todoRows } = await pool.query(
      `INSERT INTO todos (user_id, team_id, title) VALUES ($1, $2, '팀 할일') RETURNING todo_id`,
      [users.admin.userId, teamId]
    );
    const todoId = todoRows[0].todo_id;

    // 팀 카테고리 생성
    const { rows: catRows } = await pool.query(
      `INSERT INTO categories (owner_id, owner_type, name) VALUES ($1, 'TEAM', '팀 카테고리') RETURNING category_id`,
      [teamId]
    );
    const catId = catRows[0].category_id;

    const res = await request(app)
      .delete(`${BASE}/${teamId}`)
      .set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(204);

    const { rows: todos } = await pool.query(`SELECT 1 FROM todos WHERE todo_id=$1`, [todoId]);
    expect(todos).toHaveLength(0);

    const { rows: cats } = await pool.query(`SELECT 1 FROM categories WHERE category_id=$1`, [catId]);
    expect(cats).toHaveLength(0);

    teamId = null;
  });
});

// ─── 멤버 관리 ────────────────────────────────────────────────────────────────
describe('멤버 관리', () => {
  let teamId;

  beforeEach(async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ name: '멤버관리팀' });
    teamId = res.body.teamId;
    // member를 직접 팀에 추가
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER')`,
      [teamId, users.member.userId]
    );
  });

  afterEach(async () => {
    await pool.query('DELETE FROM teams WHERE team_id=$1', [teamId]);
  });

  it('GET /teams/:id/members → 멤버 목록 반환', async () => {
    const res = await request(app)
      .get(`${BASE}/${teamId}/members`)
      .set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('PATCH /teams/:id/members/:userId/role → ADMIN이 역할 변경', async () => {
    const res = await request(app)
      .patch(`${BASE}/${teamId}/members/${users.member.userId}/role`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ role: 'VIEWER' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('VIEWER');
  });

  it('마지막 ADMIN 역할 변경 시 → 422 (TEAM-002)', async () => {
    const res = await request(app)
      .patch(`${BASE}/${teamId}/members/${users.admin.userId}/role`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ role: 'MEMBER' });
    expect(res.status).toBe(422);
  });

  it('DELETE /teams/:id/members/:userId → ADMIN이 멤버 추방', async () => {
    const res = await request(app)
      .delete(`${BASE}/${teamId}/members/${users.member.userId}`)
      .set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(204);

    const { rows } = await pool.query(
      `SELECT 1 FROM team_members WHERE team_id=$1 AND user_id=$2`,
      [teamId, users.member.userId]
    );
    expect(rows).toHaveLength(0);
  });

  it('팀 탈퇴 시 생성한 팀 할일의 user_id가 NULL로 변경됨 (TEAM-004)', async () => {
    const { rows: todoRows } = await pool.query(
      `INSERT INTO todos (user_id, team_id, title) VALUES ($1, $2, '멤버 할일') RETURNING todo_id`,
      [users.member.userId, teamId]
    );
    const todoId = todoRows[0].todo_id;

    const res = await request(app)
      .delete(`${BASE}/${teamId}/members/me`)
      .set('Authorization', `Bearer ${users.member.token}`);
    expect(res.status).toBe(204);

    const { rows } = await pool.query(`SELECT user_id FROM todos WHERE todo_id=$1`, [todoId]);
    expect(rows[0].user_id).toBeNull();
  });

  it('마지막 ADMIN 탈퇴 시도 → 422 (TEAM-002)', async () => {
    const res = await request(app)
      .delete(`${BASE}/${teamId}/members/me`)
      .set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(422);
  });
});

// ─── 초대 관리 ────────────────────────────────────────────────────────────────
describe('초대 관리', () => {
  let teamId;

  beforeEach(async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ name: '초대테스트팀' });
    teamId = res.body.teamId;
  });

  afterEach(async () => {
    await pool.query('DELETE FROM teams WHERE team_id=$1', [teamId]);
  });

  it('MEMBER가 초대 생성 시도 → 403 (INV-001)', async () => {
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER')`,
      [teamId, users.member.userId]
    );

    const res = await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.member.token}`)
      .send({ invitedUserId: users.viewer.userId, role: 'VIEWER' });
    expect(res.status).toBe(403);
  });

  it('ADMIN이 초대 생성 → 201, TEAM_INVITE 알림 생성 (INV-001, NOTIF-002)', async () => {
    const res = await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ invitedUserId: users.viewer.userId, role: 'VIEWER' });
    expect(res.status).toBe(201);
    expect(res.body.invitationId).toBeDefined();
    expect(res.body.status).toBe('PENDING');

    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 AND type='TEAM_INVITE' AND reference_id=$2`,
      [users.viewer.userId, res.body.invitationId]
    );
    expect(rows).toHaveLength(1);
  });

  it('이미 소속된 사용자 초대 → 409 (TEAM-003)', async () => {
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER')`,
      [teamId, users.member.userId]
    );

    const res = await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ invitedUserId: users.member.userId, role: 'MEMBER' });
    expect(res.status).toBe(409);
  });

  it('PENDING 초대가 있는 사용자 재초대 → 409 (INV-002)', async () => {
    await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ invitedUserId: users.other.userId, role: 'MEMBER' });

    const res = await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ invitedUserId: users.other.userId, role: 'MEMBER' });
    expect(res.status).toBe(409);
  });

  it('초대 수락 → 200, team_members 생성, status=ACCEPTED (INV-003)', async () => {
    const invRes = await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ invitedUserId: users.viewer.userId, role: 'VIEWER' });
    const invitationId = invRes.body.invitationId;

    const res = await request(app)
      .patch(`${INV_BASE}/${invitationId}/accept`)
      .set('Authorization', `Bearer ${users.viewer.token}`);
    expect(res.status).toBe(200);

    const { rows: inv } = await pool.query(
      `SELECT status FROM team_invitations WHERE invitation_id=$1`,
      [invitationId]
    );
    expect(inv[0].status).toBe('ACCEPTED');

    const { rows: mem } = await pool.query(
      `SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2`,
      [teamId, users.viewer.userId]
    );
    expect(mem[0].role).toBe('VIEWER');
  });

  it('초대 거절 → 200, status=DECLINED, team_members 미삽입 (INV-004)', async () => {
    const invRes = await request(app)
      .post(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`)
      .send({ invitedUserId: users.member.userId, role: 'MEMBER' });
    const invitationId = invRes.body.invitationId;

    const res = await request(app)
      .patch(`${INV_BASE}/${invitationId}/decline`)
      .set('Authorization', `Bearer ${users.member.token}`);
    expect(res.status).toBe(200);

    const { rows: inv } = await pool.query(
      `SELECT status FROM team_invitations WHERE invitation_id=$1`,
      [invitationId]
    );
    expect(inv[0].status).toBe('DECLINED');

    const { rows: mem } = await pool.query(
      `SELECT 1 FROM team_members WHERE team_id=$1 AND user_id=$2`,
      [teamId, users.member.userId]
    );
    expect(mem).toHaveLength(0);
  });

  it('만료된 초대 수락 → 422, status=EXPIRED (INV-005)', async () => {
    // 만료된 초대를 직접 DB에 삽입
    const { rows } = await pool.query(
      `INSERT INTO team_invitations (team_id, invited_user_id, invited_by, role, expires_at)
       VALUES ($1, $2, $3, 'MEMBER', NOW() - INTERVAL '1 second')
       RETURNING invitation_id`,
      [teamId, users.other.userId, users.admin.userId]
    );
    const invitationId = rows[0].invitation_id;

    const res = await request(app)
      .patch(`${INV_BASE}/${invitationId}/accept`)
      .set('Authorization', `Bearer ${users.other.token}`);
    expect(res.status).toBe(422);

    const { rows: inv } = await pool.query(
      `SELECT status FROM team_invitations WHERE invitation_id=$1`,
      [invitationId]
    );
    expect(inv[0].status).toBe('EXPIRED');
  });

  it('GET /teams/:id/invitations → ADMIN만 조회 가능', async () => {
    const res = await request(app)
      .get(`${BASE}/${teamId}/invitations`)
      .set('Authorization', `Bearer ${users.admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
