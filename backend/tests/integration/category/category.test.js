import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import pool from '../../../src/config/database.js';

const BASE = '/api/categories';
const AUTH_BASE = '/api/auth';
const TODOS_BASE = '/api/todos';

// ─── 헬퍼: 사용자 등록 + 로그인 후 { userId, token } 반환 ────────────────────
async function registerAndLogin(email, name, password = 'Test1234!') {
  await request(app).post(`${AUTH_BASE}/register`).send({ email, name, password });
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  const userId = rows[0]?.user_id;
  const loginRes = await request(app).post(`${AUTH_BASE}/login`).send({ email, password });
  const token = loginRes.body.accessToken;
  return { userId, token };
}

// ─── 테스트 전역 상태 ──────────────────────────────────────────────────────────
let user1Token, user1Id;   // ADMIN
let user2Token, user2Id;   // 다른 사용자 (팀 미가입)
let user3Token, user3Id;   // MEMBER
let user4Token, user4Id;   // VIEWER
let teamId;

const TEST_EMAILS = [
  'cat_u1@example.com',
  'cat_u2@example.com',
  'cat_u3@example.com',
  'cat_u4@example.com',
];

beforeAll(async () => {
  // 기존 테스트 데이터 정리 (cleanup 순서: todos → team_members → categories → teams → users)
  const { rows: oldUsers } = await pool.query(
    `SELECT user_id FROM users WHERE email = ANY($1::text[])`,
    [TEST_EMAILS]
  );
  const oldUserIds = oldUsers.map((u) => u.user_id);

  if (oldUserIds.length > 0) {
    await pool.query(`DELETE FROM todos WHERE user_id = ANY($1::uuid[])`, [oldUserIds]);
    const { rows: oldTeams } = await pool.query(
      `SELECT team_id FROM teams WHERE created_by = ANY($1::uuid[])`,
      [oldUserIds]
    );
    const oldTeamIds = oldTeams.map((t) => t.team_id);
    if (oldTeamIds.length > 0) {
      await pool.query(`DELETE FROM team_members WHERE team_id = ANY($1::uuid[])`, [oldTeamIds]);
      await pool.query(`DELETE FROM categories WHERE owner_id = ANY($1::uuid[])`, [oldTeamIds]);
      await pool.query(`DELETE FROM teams WHERE team_id = ANY($1::uuid[])`, [oldTeamIds]);
    }
    await pool.query(`DELETE FROM categories WHERE owner_id = ANY($1::uuid[])`, [oldUserIds]);
    await pool.query(`DELETE FROM users WHERE user_id = ANY($1::uuid[])`, [oldUserIds]);
  }

  // 사용자 4명 생성 + 로그인
  ({ userId: user1Id, token: user1Token } = await registerAndLogin('cat_u1@example.com', '카테고리유저1'));
  ({ userId: user2Id, token: user2Token } = await registerAndLogin('cat_u2@example.com', '카테고리유저2'));
  ({ userId: user3Id, token: user3Token } = await registerAndLogin('cat_u3@example.com', '카테고리유저3'));
  ({ userId: user4Id, token: user4Token } = await registerAndLogin('cat_u4@example.com', '카테고리유저4'));

  // 팀 생성 (user1이 생성)
  const { rows: teamRows } = await pool.query(
    `INSERT INTO teams(team_id, name, created_by) VALUES(gen_random_uuid(), $1, $2) RETURNING *`,
    ['카테고리테스트팀', user1Id]
  );
  teamId = teamRows[0].team_id;

  // user1 → ADMIN
  await pool.query(
    `INSERT INTO team_members(team_member_id, team_id, user_id, role)
     VALUES(gen_random_uuid(), $1, $2, 'ADMIN')`,
    [teamId, user1Id]
  );
  // user3 → MEMBER
  await pool.query(
    `INSERT INTO team_members(team_member_id, team_id, user_id, role)
     VALUES(gen_random_uuid(), $1, $2, 'MEMBER')`,
    [teamId, user3Id]
  );
  // user4 → VIEWER
  await pool.query(
    `INSERT INTO team_members(team_member_id, team_id, user_id, role)
     VALUES(gen_random_uuid(), $1, $2, 'VIEWER')`,
    [teamId, user4Id]
  );
});

afterAll(async () => {
  // cleanup: todos → team_members → categories → teams → users
  if (user1Id) await pool.query(`DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL`, [user1Id]);
  if (user2Id) await pool.query(`DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL`, [user2Id]);
  if (user3Id) await pool.query(`DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL`, [user3Id]);
  if (user4Id) await pool.query(`DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL`, [user4Id]);

  if (teamId) {
    await pool.query(`DELETE FROM todos WHERE team_id = $1`, [teamId]);
    await pool.query(`DELETE FROM team_members WHERE team_id = $1`, [teamId]);
    await pool.query(`DELETE FROM categories WHERE owner_id = $1`, [teamId]);
    await pool.query(`DELETE FROM teams WHERE team_id = $1`, [teamId]);
  }

  const userIds = [user1Id, user2Id, user3Id, user4Id].filter(Boolean);
  if (userIds.length > 0) {
    await pool.query(`DELETE FROM categories WHERE owner_id = ANY($1::uuid[])`, [userIds]);
    await pool.query(`DELETE FROM users WHERE user_id = ANY($1::uuid[])`, [userIds]);
  }

  await pool.end();
});

// ─── POST /api/categories ───────────────────────────────────────────────────────
describe('POST /api/categories', () => {
  it('미인증 → 401', async () => {
    const res = await request(app).post(BASE).send({ name: '미인증카테고리' });
    expect(res.status).toBe(401);
  });

  it('개인 카테고리 생성 성공 → 201, categoryId 존재', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '개인카테고리1' });
    expect(res.status).toBe(201);
    expect(res.body.categoryId).toBeDefined();
    expect(res.body.name).toBe('개인카테고리1');
    expect(res.body.ownerType).toBe('USER');
  });

  it('색상 없이 생성 → 201, color=null', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '색상없는카테고리' });
    expect(res.status).toBe(201);
    expect(res.body.color).toBeNull();
  });

  it('CAT-004: 잘못된 색상 형식 (#RGB) → 400', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '색상오류카테고리1', color: '#RGB' });
    expect(res.status).toBe(400);
  });

  it("CAT-004: 잘못된 색상 형식 ('red') → 400", async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '색상오류카테고리2', color: 'red' });
    expect(res.status).toBe(400);
  });

  it('올바른 색상 (#AABBCC) → 201', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '색상있는카테고리', color: '#AABBCC' });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe('#AABBCC');
  });

  it('CAT-001: 동일 소유자 중복 이름 → 409', async () => {
    // 먼저 생성
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '중복카테고리' });
    // 동일 이름으로 재생성
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '중복카테고리' });
    expect(res.status).toBe(409);
  });

  it('팀 카테고리 생성 (ADMIN) → 201', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '팀카테고리1', teamId });
    expect(res.status).toBe(201);
    expect(res.body.categoryId).toBeDefined();
    expect(res.body.ownerType).toBe('TEAM');
    expect(res.body.ownerId).toBe(teamId);
  });

  it('팀 카테고리 생성 (MEMBER) → 403', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ name: '멤버팀카테고리', teamId });
    expect(res.status).toBe(403);
  });

  it('팀 카테고리 생성 (VIEWER) → 403', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user4Token}`)
      .send({ name: '뷰어팀카테고리', teamId });
    expect(res.status).toBe(403);
  });
});

// ─── GET /api/categories ────────────────────────────────────────────────────────
describe('GET /api/categories', () => {
  it('미인증 → 401', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });

  it('개인 카테고리만 있을 때 → 200, 해당 카테고리 포함', async () => {
    // user2는 아직 카테고리가 없으니 먼저 하나 생성
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'user2전용카테고리' });
    expect(createRes.status).toBe(201);
    const createdId = createRes.body.categoryId;

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ids = res.body.map((c) => c.categoryId);
    expect(ids).toContain(createdId);
  });

  it('user2 카테고리는 user1 목록에 미포함 (격리 검증)', async () => {
    // user2 카테고리 생성
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'user2격리확인카테고리' });
    expect(createRes.status).toBe(201);
    const user2CatId = createRes.body.categoryId;

    // user1 목록 조회
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((c) => c.categoryId);
    expect(ids).not.toContain(user2CatId);
  });
});

// ─── PATCH /api/categories/:id ──────────────────────────────────────────────────
describe('PATCH /api/categories/:id', () => {
  let user1CatId;
  let user2CatId;
  let teamCatId;

  beforeAll(async () => {
    // user1 개인 카테고리 생성
    const r1 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '수정테스트용개인카테고리' });
    user1CatId = r1.body.categoryId;

    // user2 개인 카테고리 생성
    const r2 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: '수정테스트용user2카테고리' });
    user2CatId = r2.body.categoryId;

    // 팀 카테고리 생성 (user1=ADMIN)
    const r3 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '수정테스트용팀카테고리', teamId });
    teamCatId = r3.body.categoryId;
  });

  it('미인증 → 401', async () => {
    const res = await request(app)
      .patch(`${BASE}/${user1CatId}`)
      .send({ name: '수정시도' });
    expect(res.status).toBe(401);
  });

  it('본인 카테고리 수정 → 200, name 변경됨', async () => {
    const res = await request(app)
      .patch(`${BASE}/${user1CatId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '수정완료카테고리' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('수정완료카테고리');
  });

  it('다른 사용자 카테고리 수정 → 403', async () => {
    const res = await request(app)
      .patch(`${BASE}/${user2CatId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '침범수정' });
    expect(res.status).toBe(403);
  });

  it('팀 카테고리 수정 (ADMIN) → 200', async () => {
    const res = await request(app)
      .patch(`${BASE}/${teamCatId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '팀카테고리수정완료' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('팀카테고리수정완료');
  });

  it('팀 카테고리 수정 (MEMBER) → 403', async () => {
    const res = await request(app)
      .patch(`${BASE}/${teamCatId}`)
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ name: '멤버수정시도' });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/categories/:id ─────────────────────────────────────────────────
describe('DELETE /api/categories/:id', () => {
  let deleteCatId;
  let user2CatForDeleteId;
  let teamCatForDeleteId;
  let teamCatForViewerTestId;

  beforeAll(async () => {
    // user1 개인 카테고리 (삭제용)
    const r1 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '삭제테스트용카테고리' });
    deleteCatId = r1.body.categoryId;

    // user2 개인 카테고리 (권한 침범 테스트용)
    const r2 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: '삭제침범테스트user2카테고리' });
    user2CatForDeleteId = r2.body.categoryId;

    // 팀 카테고리 (ADMIN 삭제용)
    const r3 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '삭제테스트용팀카테고리', teamId });
    teamCatForDeleteId = r3.body.categoryId;

    // 팀 카테고리 (VIEWER 403 테스트용)
    const r4 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '뷰어삭제시도팀카테고리', teamId });
    teamCatForViewerTestId = r4.body.categoryId;
  });

  it('미인증 → 401', async () => {
    const res = await request(app).delete(`${BASE}/${deleteCatId}`);
    expect(res.status).toBe(401);
  });

  it('본인 카테고리 삭제 → 204', async () => {
    const res = await request(app)
      .delete(`${BASE}/${deleteCatId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(204);
  });

  it('CAT-002: 삭제 후 해당 todos.category_id → NULL', async () => {
    // 1. 카테고리 생성
    const catRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'SET-NULL테스트카테고리' });
    expect(catRes.status).toBe(201);
    const catId = catRes.body.categoryId;

    // 2. 해당 카테고리로 todo 생성
    const todoRes = await request(app)
      .post(TODOS_BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'SET-NULL테스트할일', categoryId: catId });
    expect(todoRes.status).toBe(201);
    const todoId = todoRes.body.todoId;

    // 3. 카테고리 삭제
    const delRes = await request(app)
      .delete(`${BASE}/${catId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(delRes.status).toBe(204);

    // 4. DB 직접 조회 → category_id가 NULL이어야 함
    const { rows } = await pool.query(
      `SELECT category_id FROM todos WHERE todo_id = $1`,
      [todoId]
    );
    expect(rows.length).toBe(1);
    expect(rows[0].category_id).toBeNull();
  });

  it('다른 사용자 카테고리 삭제 → 403', async () => {
    const res = await request(app)
      .delete(`${BASE}/${user2CatForDeleteId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(403);
  });

  it('팀 카테고리 삭제 (ADMIN) → 204', async () => {
    const res = await request(app)
      .delete(`${BASE}/${teamCatForDeleteId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(204);
  });

  it('팀 카테고리 삭제 (VIEWER) → 403', async () => {
    const res = await request(app)
      .delete(`${BASE}/${teamCatForViewerTestId}`)
      .set('Authorization', `Bearer ${user4Token}`);
    expect(res.status).toBe(403);
  });
});
