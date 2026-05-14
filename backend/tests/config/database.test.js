import { execSync } from 'child_process';
import request from 'supertest';
import pool from '../../src/config/database.js';
import app from '../../src/app.js';

describe('DB-006: DB 커넥션 풀', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('싱글톤 — 두 번 import해도 같은 Pool 인스턴스를 반환한다', async () => {
    const { default: pool2 } = await import('../../src/config/database.js');
    expect(pool2).toBe(pool);
  });

  it('DATABASE_URL 누락 시 process.exit(1)로 종료된다', () => {
    let exitCode = 0;
    try {
      execSync(
        `node --input-type=module --eval "import './src/config/env.js'"`,
        {
          cwd: 'C:/Users/student/_vibe/todolist-app/backend',
          env: {
            ...process.env,
            DATABASE_URL: '',
            JWT_ACCESS_SECRET: '',
            JWT_REFRESH_SECRET: '',
            JWT_PASSWORD_RESET_SECRET: '',
            CORS_ORIGIN: '',
            NODE_ENV: 'production',
          },
        },
      );
    } catch (err) {
      exitCode = err.status;
    }
    expect(exitCode).toBe(1);
  });

  it('SELECT 1 쿼리가 성공하고 val이 1이다', async () => {
    const result = await pool.query('SELECT 1 AS val');
    expect(result.rows[0].val).toBe(1);
  });

  it('DATABASE_POOL_MAX가 .env.test의 값(5)으로 오버라이드된다', () => {
    expect(pool.options.max).toBe(5);
  });

  it('GET /health 가 200과 { status: ok, db: ok }를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('ok');
  });
});
