import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createHash } from 'node:crypto';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

const BASE = '/api/auth';

function sha256(v) {
  return createHash('sha256').update(v).digest('hex');
}

async function cleanupUser(email) {
  const { rows } = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
  if (rows.length > 0) {
    await pool.query('DELETE FROM users WHERE user_id=$1', [rows[0].user_id]);
  }
}

const TEST_EMAIL = 'auth_test_user@example.com';
const TEST_PASS = 'Test1234!';
const TEST_NAME = '테스트유저';

afterAll(async () => {
  await cleanupUser(TEST_EMAIL);
  await cleanupUser('dup@example.com');
  await pool.end();
});

// ─── POST /auth/register ────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  afterEach(async () => {
    await cleanupUser(TEST_EMAIL);
  });

  it('비밀번호 8자 미만 → 400', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: 'Ab1!',
    });
    expect(res.status).toBe(400);
  });

  it('영문자 없는 비밀번호 → 400', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: '12345678!',
    });
    expect(res.status).toBe(400);
  });

  it('숫자 없는 비밀번호 → 400', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: 'Abcdefgh!',
    });
    expect(res.status).toBe(400);
  });

  it('특수문자 없는 비밀번호 → 400', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: 'Abcdefg1',
    });
    expect(res.status).toBe(400);
  });

  it('유효한 데이터로 회원가입 → 201', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASS,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: TEST_EMAIL, name: TEST_NAME });
    expect(res.body.userId).toBeDefined();
  });

  it('회원가입 성공 시 DB에 bcrypt 해시된 비밀번호가 저장된다', async () => {
    await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASS,
    });
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email=$1', [TEST_EMAIL]);
    expect(rows[0].password_hash).toMatch(/^\$2[ab]\$/);
    expect(rows[0].password_hash).not.toBe(TEST_PASS);
  });

  it('회원가입 성공 시 기본 카테고리 6종이 생성된다', async () => {
    await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASS,
    });
    const { rows: users } = await pool.query('SELECT user_id FROM users WHERE email=$1', [TEST_EMAIL]);
    const { rows: cats } = await pool.query(
      "SELECT name FROM categories WHERE owner_id=$1 AND owner_type='USER' ORDER BY name",
      [users[0].user_id]
    );
    const names = cats.map((c) => c.name);
    expect(cats).toHaveLength(6);
    ['개인', '긴급 업무', '업무', '학습', '회의', '프로젝트'].forEach((n) =>
      expect(names).toContain(n)
    );
  });

  it('중복 이메일 회원가입 → 409', async () => {
    await request(app).post(`${BASE}/register`).send({
      email: 'dup@example.com', name: TEST_NAME, password: TEST_PASS,
    });
    const res = await request(app).post(`${BASE}/register`).send({
      email: 'dup@example.com', name: TEST_NAME, password: TEST_PASS,
    });
    expect(res.status).toBe(409);
    await cleanupUser('dup@example.com');
  });
});

// ─── POST /auth/login ───────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASS,
    });
  });
  afterEach(async () => {
    await cleanupUser(TEST_EMAIL);
  });

  it('올바른 자격증명으로 로그인 → 200 + accessToken + refreshToken', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: TEST_EMAIL, password: TEST_PASS,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('잘못된 비밀번호 → 401', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: TEST_EMAIL, password: 'WrongPass1!',
    });
    expect(res.status).toBe(401);
  });

  it('존재하지 않는 이메일 → 401', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: 'nobody@example.com', password: TEST_PASS,
    });
    expect(res.status).toBe(401);
  });
});

// ─── POST /auth/logout ─────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  let accessToken;
  let refreshToken;

  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASS,
    });
    const loginRes = await request(app).post(`${BASE}/login`).send({
      email: TEST_EMAIL, password: TEST_PASS,
    });
    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
  });
  afterEach(async () => {
    await cleanupUser(TEST_EMAIL);
  });

  it('로그아웃 → 204, refresh_tokens.revoked_at이 설정됨', async () => {
    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(204);

    const tokenHash = sha256(refreshToken);
    const { rows } = await pool.query(
      'SELECT revoked_at FROM refresh_tokens WHERE token_hash=$1',
      [tokenHash]
    );
    expect(rows[0].revoked_at).not.toBeNull();
  });

  it('인증 헤더 없이 로그아웃 → 401', async () => {
    const res = await request(app).post(`${BASE}/logout`).send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('다른 사용자의 refresh token으로 로그아웃 시도 → 204이지만 해당 토큰은 revoke되지 않는다', async () => {
    const OTHER_EMAIL = 'auth_other_user@example.com';
    await request(app).post(`${BASE}/register`).send({
      email: OTHER_EMAIL, name: '다른유저', password: TEST_PASS,
    });
    const otherLogin = await request(app).post(`${BASE}/login`).send({
      email: OTHER_EMAIL, password: TEST_PASS,
    });
    const otherRefreshToken = otherLogin.body.refreshToken;

    // User A가 User B의 refresh token으로 logout 시도
    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: otherRefreshToken });
    expect(res.status).toBe(204);

    // User B의 토큰은 여전히 유효해야 함
    const tokenHash = sha256(otherRefreshToken);
    const { rows } = await pool.query(
      'SELECT revoked_at FROM refresh_tokens WHERE token_hash=$1',
      [tokenHash]
    );
    expect(rows[0].revoked_at).toBeNull();

    await cleanupUser(OTHER_EMAIL);
  });
});

// ─── POST /auth/refresh ────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  let refreshToken;

  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send({
      email: TEST_EMAIL, name: TEST_NAME, password: TEST_PASS,
    });
    const loginRes = await request(app).post(`${BASE}/login`).send({
      email: TEST_EMAIL, password: TEST_PASS,
    });
    refreshToken = loginRes.body.refreshToken;
  });
  afterEach(async () => {
    await cleanupUser(TEST_EMAIL);
  });

  it('유효한 refresh token → 200 + 새 accessToken + 새 refreshToken (rotation)', async () => {
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it('rotation 후 이전 refresh token 재사용 → 401 (reuse detection)', async () => {
    await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('잘못된 refresh token → 401', async () => {
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });

  it('폐기된 refresh token → 401', async () => {
    const accessTokenRes = await request(app).post(`${BASE}/login`).send({
      email: TEST_EMAIL, password: TEST_PASS,
    });
    const { accessToken: at, refreshToken: rt } = accessTokenRes.body;

    await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${at}`)
      .send({ refreshToken: rt });

    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken: rt });
    expect(res.status).toBe(401);
  });
});

// ─── POST /auth/password-reset/request ────────────────────────────
describe('POST /api/auth/password-reset/request', () => {
  it('등록되지 않은 이메일도 200 반환 (이메일 노출 방지)', async () => {
    const res = await request(app)
      .post(`${BASE}/password-reset/request`)
      .send({ email: 'nobody@nowhere.com' });
    expect(res.status).toBe(200);
  });

  it('유효하지 않은 이메일 형식 → 400', async () => {
    const res = await request(app)
      .post(`${BASE}/password-reset/request`)
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/password-reset/confirm ────────────────────────────
describe('POST /api/auth/password-reset/confirm', () => {
  it('만료된 토큰 → 422', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000000', type: 'password_reset' },
      process.env.JWT_PASSWORD_RESET_SECRET,
      { expiresIn: 0 }
    );
    const res = await request(app).post(`${BASE}/password-reset/confirm`).send({
      token: expiredToken,
      newPassword: 'NewPass1!',
    });
    expect(res.status).toBe(422);
  });

  it('유효하지 않은 토큰 → 422', async () => {
    const res = await request(app).post(`${BASE}/password-reset/confirm`).send({
      token: 'invalid.token.here',
      newPassword: 'NewPass1!',
    });
    expect(res.status).toBe(422);
  });

  it('access token 시크릿으로 서명된 토큰 → 422 (시크릿 분리 검증)', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    const crossToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000000', type: 'password_reset' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '30m' }
    );
    const res = await request(app).post(`${BASE}/password-reset/confirm`).send({
      token: crossToken,
      newPassword: 'NewPass1!',
    });
    expect(res.status).toBe(422);
  });

  it('비밀번호 정책 위반 시 → 400', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    const token = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000000', type: 'password_reset' },
      process.env.JWT_PASSWORD_RESET_SECRET,
      { expiresIn: '30m' }
    );
    const res = await request(app).post(`${BASE}/password-reset/confirm`).send({
      token,
      newPassword: 'weak',
    });
    expect(res.status).toBe(400);
  });
});
