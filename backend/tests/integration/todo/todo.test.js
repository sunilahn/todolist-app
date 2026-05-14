import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import pool from '../../../src/config/database.js';

const BASE = '/api/todos';
const AUTH_BASE = '/api/auth';

// ─── 헬퍼: 사용자 등록 + 로그인 후 { userId, token } 반환 ────────────────────
async function registerAndLogin(email, name, password = 'Test1234!') {
  await request(app).post(`${AUTH_BASE}/register`).send({ email, name, password });
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  const userId = rows[0]?.user_id;
  const loginRes = await request(app).post(`${AUTH_BASE}/login`).send({ email, password });
  const token = loginRes.body.accessToken;
  return { userId, token };
}

// ─── 헬퍼: 할일 직접 생성 (POST API 사용) ────────────────────────────────────
async function createTodoViaApi(token, body) {
  const res = await request(app)
    .post(BASE)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
  if (res.status !== 201) {
    throw new Error(`createTodo failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.todoId;
}

// ─── 테스트 전역 상태 ──────────────────────────────────────────────────────────
let user1Token, user1Id;
let user2Token, user2Id;
let user3Token, user3Id;
let teamId;

beforeAll(async () => {
  // 기존 테스트 데이터 정리: todos → teams → users 순서 (ON DELETE SET NULL 제약 방지)
  const { rows: oldUsers } = await pool.query(`
    SELECT user_id FROM users WHERE email IN (
      'todo_u1@example.com',
      'todo_u2@example.com',
      'todo_u3@example.com'
    )
  `);
  for (const { user_id } of oldUsers) {
    await pool.query('DELETE FROM todos WHERE user_id = $1', [user_id]);
  }
  const { rows: oldTeams } = await pool.query(
    `SELECT team_id FROM teams WHERE created_by = ANY($1::uuid[])`,
    [oldUsers.map((u) => u.user_id)]
  );
  for (const { team_id } of oldTeams) {
    await pool.query('DELETE FROM teams WHERE team_id = $1', [team_id]);
  }
  await pool.query(`
    DELETE FROM users WHERE email IN (
      'todo_u1@example.com',
      'todo_u2@example.com',
      'todo_u3@example.com'
    )
  `);

  // 사용자 3명 생성 + 로그인
  ({ userId: user1Id, token: user1Token } = await registerAndLogin(
    'todo_u1@example.com', '투두유저1'
  ));
  ({ userId: user2Id, token: user2Token } = await registerAndLogin(
    'todo_u2@example.com', '투두유저2'
  ));
  ({ userId: user3Id, token: user3Token } = await registerAndLogin(
    'todo_u3@example.com', '투두유저3'
  ));

  // 팀 생성 (user1이 생성)
  const { rows: teamRows } = await pool.query(
    `INSERT INTO teams(team_id, name, created_by) VALUES(gen_random_uuid(), $1, $2) RETURNING *`,
    ['테스트팀', user1Id]
  );
  teamId = teamRows[0].team_id;

  // user1 → ADMIN
  await pool.query(
    `INSERT INTO team_members(team_member_id, team_id, user_id, role)
     VALUES(gen_random_uuid(), $1, $2, 'ADMIN')`,
    [teamId, user1Id]
  );
  // user2 → MEMBER
  await pool.query(
    `INSERT INTO team_members(team_member_id, team_id, user_id, role)
     VALUES(gen_random_uuid(), $1, $2, 'MEMBER')`,
    [teamId, user2Id]
  );
  // user3 → VIEWER
  await pool.query(
    `INSERT INTO team_members(team_member_id, team_id, user_id, role)
     VALUES(gen_random_uuid(), $1, $2, 'VIEWER')`,
    [teamId, user3Id]
  );
});

afterAll(async () => {
  // 팀 정리 (team ON DELETE CASCADE → todos, team_members 자동 정리)
  if (teamId) {
    await pool.query('DELETE FROM teams WHERE team_id = $1', [teamId]);
  }
  // 사용자 정리 (user ON DELETE SET NULL → todos 에서 user_id=NULL)
  // 먼저 개인 할일 삭제 후 사용자 삭제
  if (user1Id) {
    await pool.query('DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL', [user1Id]);
  }
  if (user2Id) {
    await pool.query('DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL', [user2Id]);
  }
  if (user3Id) {
    await pool.query('DELETE FROM todos WHERE user_id = $1 AND team_id IS NULL', [user3Id]);
  }
  await pool.query(`
    DELETE FROM users WHERE email IN (
      'todo_u1@example.com',
      'todo_u2@example.com',
      'todo_u3@example.com'
    )
  `);
  await pool.end();
});

// ─── POST /api/todos ────────────────────────────────────────────────────────────
describe('POST /api/todos', () => {
  it('TODO-001: 제목 누락 → 400', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ description: '설명만 있음' });
    expect(res.status).toBe(400);
  });

  it('TODO-002: due_date < start_date → 400', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: '날짜 오류 할일',
        startDate: '2025-12-31',
        dueDate: '2025-01-01',
      });
    expect(res.status).toBe(400);
  });

  it('개인 할일 생성 성공 → 201, todoId 존재', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: '개인 할일', description: '내용' });
    expect(res.status).toBe(201);
    expect(res.body.todoId).toBeDefined();
    expect(res.body.title).toBe('개인 할일');
  });

  it('팀 할일 생성 (MEMBER) → 201', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: '팀 할일 (MEMBER)', teamId });
    expect(res.status).toBe(201);
    expect(res.body.todoId).toBeDefined();
    expect(res.body.teamId).toBe(teamId);
  });

  it('AUTH-003: VIEWER가 팀 할일 생성 → 403', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ title: '뷰어 할일', teamId });
    expect(res.status).toBe(403);
  });

  it('미인증 요청 → 401', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ title: '인증 없는 할일' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/todos/:id ─────────────────────────────────────────────────────────
describe('GET /api/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    todoId = await createTodoViaApi(user1Token, { title: '조회 테스트용 할일' });
  });

  it('본인 할일 조회 → 200', async () => {
    const res = await request(app)
      .get(`${BASE}/${todoId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.todoId).toBe(todoId);
  });

  it('AUTH-002: 다른 사용자의 개인 할일 조회 → 403', async () => {
    const res = await request(app)
      .get(`${BASE}/${todoId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.status).toBe(403);
  });

  it('존재하지 않는 할일 조회 → 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${BASE}/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/todos/:id ───────────────────────────────────────────────────────
describe('PATCH /api/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    todoId = await createTodoViaApi(user1Token, { title: '수정 전 할일' });
  });

  it('본인 할일 수정 → 200', async () => {
    const res = await request(app)
      .patch(`${BASE}/${todoId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: '수정 후 할일' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정 후 할일');
  });

  it('다른 사용자 할일 수정 → 403', async () => {
    const res = await request(app)
      .patch(`${BASE}/${todoId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: '침범 수정' });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/todos/:id ──────────────────────────────────────────────────────
describe('DELETE /api/todos/:id', () => {
  let user1TodoId;
  let user1AnotherTodoId;

  beforeAll(async () => {
    user1TodoId = await createTodoViaApi(user1Token, { title: '삭제 테스트용 할일 (user1)' });
    user1AnotherTodoId = await createTodoViaApi(user1Token, { title: '권한 침범 테스트용 할일' });
  });

  it('다른 사용자 할일 삭제 → 403', async () => {
    const res = await request(app)
      .delete(`${BASE}/${user1AnotherTodoId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.status).toBe(403);
  });

  it('본인 할일 삭제 → 204', async () => {
    const res = await request(app)
      .delete(`${BASE}/${user1TodoId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(204);
  });
});

// ─── PATCH /api/todos/:id/status ───────────────────────────────────────────────
describe('PATCH /api/todos/:id/status', () => {
  let plannedTodoId;
  let doneTodoId;
  let plannedTodoId2;

  beforeAll(async () => {
    // PLANNED 상태 할일
    plannedTodoId = await createTodoViaApi(user1Token, { title: '상태전이 테스트 할일 (PLANNED)' });

    // DONE 상태 할일 (DB에 직접 INSERT - user_id 명시, team_id NULL)
    const { rows } = await pool.query(
      `INSERT INTO todos(user_id, team_id, title, status)
       VALUES($1, NULL, $2, 'DONE') RETURNING *`,
      [user1Id, '상태전이 테스트 할일 (DONE)']
    );
    doneTodoId = rows[0].todo_id;

    // PLANNED → DONE 불허 테스트용
    plannedTodoId2 = await createTodoViaApi(user1Token, { title: '불허 전이 테스트' });
  });

  it('PLANNED → IN_PROGRESS → 200 (허용)', async () => {
    const res = await request(app)
      .patch(`${BASE}/${plannedTodoId}/status`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('DONE → IN_PROGRESS → 200 (허용)', async () => {
    const res = await request(app)
      .patch(`${BASE}/${doneTodoId}/status`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('PLANNED → DONE → 422 (불허)', async () => {
    const res = await request(app)
      .patch(`${BASE}/${plannedTodoId2}/status`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ status: 'DONE' });
    expect(res.status).toBe(422);
  });

  it('미인증 상태 변경 → 401', async () => {
    const res = await request(app)
      .patch(`${BASE}/${plannedTodoId}/status`)
      .send({ status: 'DONE' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/todos/today ───────────────────────────────────────────────────────
describe('GET /api/todos/today', () => {
  beforeAll(async () => {
    const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO todos(user_id, team_id, title, start_date, due_date)
       VALUES($1, NULL, $2, $3, $4)`,
      [user1Id, '오늘 할일', today, today]
    );
  });

  it('오늘 할일 목록 → 200, 배열 반환', async () => {
    const res = await request(app)
      .get(`${BASE}/today`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /api/todos/this-week ───────────────────────────────────────────────────
describe('GET /api/todos/this-week', () => {
  beforeAll(async () => {
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dayOfWeek = kstDate.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(kstDate);
    monday.setUTCDate(kstDate.getUTCDate() + diffToMonday);
    const weekStart = monday.toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO todos(user_id, team_id, title, due_date)
       VALUES($1, NULL, $2, $3)`,
      [user1Id, '이번주 할일', weekStart]
    );
  });

  it('이번 주 할일 목록 → 200, 배열 반환', async () => {
    const res = await request(app)
      .get(`${BASE}/this-week`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /api/todos (목록) ──────────────────────────────────────────────────────
describe('GET /api/todos', () => {
  it('목록 조회 → 200, { todos, total, page, limit }', async () => {
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.todos)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBeDefined();
    expect(res.body.limit).toBeDefined();
  });

  it('page/limit 파라미터 적용 → 200', async () => {
    const res = await request(app)
      .get(`${BASE}?page=1&limit=5`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.todos.length).toBeLessThanOrEqual(5);
  });

  it('미인증 목록 조회 → 401', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });
});
