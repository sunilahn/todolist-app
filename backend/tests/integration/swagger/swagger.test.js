import { describe, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import pool from '../../../src/config/database.js';
import { swaggerSpec } from '../../../src/config/swagger.js';

afterAll(async () => {
  await pool.end();
});

describe('GET /api-docs', () => {
  it('Swagger UI가 정상 렌더링된다', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });

  it('Swagger JSON 스펙을 반환한다', async () => {
    const res = await request(app).get('/api-docs/swagger.json');
    expect([200, 301, 302]).toContain(res.status);
  });
});

describe('Swagger 스펙 완전성 검증', () => {
  const paths = swaggerSpec.paths || {};
  const pathKeys = Object.keys(paths);

  it('auth 엔드포인트 6개가 문서화되어 있다', () => {
    const authPaths = pathKeys.filter((p) => p.startsWith('/auth'));
    expect(authPaths.length).toBeGreaterThanOrEqual(6);
  });

  it('user 엔드포인트 3개가 문서화되어 있다', () => {
    const userPaths = pathKeys.filter((p) => p.startsWith('/users'));
    expect(userPaths.length).toBeGreaterThanOrEqual(1);
    // GET /users/me, PATCH /users/me, DELETE /users/me → 같은 경로에 3 메서드
    const methods = Object.keys(paths['/users/me'] || {});
    expect(methods.length).toBeGreaterThanOrEqual(3);
  });

  it('todo 엔드포인트 8개가 문서화되어 있다', () => {
    const todoPaths = pathKeys.filter((p) => p.startsWith('/todos'));
    // 경로 수 × 메서드 수 합계 ≥ 8
    let methodCount = 0;
    for (const p of todoPaths) {
      methodCount += Object.keys(paths[p]).length;
    }
    expect(methodCount).toBeGreaterThanOrEqual(8);
  });

  it('category 엔드포인트 4개가 문서화되어 있다', () => {
    const catPaths = pathKeys.filter((p) => p.startsWith('/categories'));
    let methodCount = 0;
    for (const p of catPaths) {
      methodCount += Object.keys(paths[p]).length;
    }
    expect(methodCount).toBeGreaterThanOrEqual(4);
  });

  it('team 엔드포인트 및 invitation 엔드포인트가 문서화되어 있다', () => {
    const teamPaths = pathKeys.filter((p) => p.startsWith('/teams') || p.startsWith('/invitations'));
    expect(teamPaths.length).toBeGreaterThanOrEqual(8);
  });

  it('notification 엔드포인트 3개가 문서화되어 있다', () => {
    const notifPaths = pathKeys.filter((p) => p.startsWith('/notifications'));
    let methodCount = 0;
    for (const p of notifPaths) {
      methodCount += Object.keys(paths[p]).length;
    }
    expect(methodCount).toBeGreaterThanOrEqual(3);
  });

  it('bearerAuth 보안 스키마가 정의되어 있다', () => {
    expect(swaggerSpec.components?.securitySchemes?.bearerAuth).toBeDefined();
  });
});
