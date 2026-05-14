// =============================================================================
// DB-005: 테스트 DB 헬퍼
// ESM 모듈 (package.json "type": "module" 또는 .mjs 환경)
// =============================================================================
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// DATABASE_URL 이 todolist_test 를 가리키는지 런타임에 검증
const connectionString = process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('todolist_test')) {
  throw new Error(
    `[dbHelper] DATABASE_URL must point to todolist_test, got: ${connectionString}`
  );
}

/**
 * 테스트 DB 연결 풀
 * NODE_ENV=test 환경에서 .env.test 를 미리 로드한 뒤 import 해야 합니다.
 */
export const pool = new pg.Pool({ connectionString });

/**
 * 모든 테이블을 TRUNCATE CASCADE 로 초기화합니다.
 * 각 테스트 케이스의 afterEach / afterAll 에서 호출하세요.
 */
export async function teardown() {
  await pool.query(
    `TRUNCATE
       audit_logs,
       refresh_tokens,
       notifications,
       team_invitations,
       team_members,
       todos,
       categories,
       teams,
       users
     RESTART IDENTITY CASCADE`
  );
}

/**
 * test_fixture.sql 을 읽어 테스트 DB에 실행합니다.
 * 각 테스트 케이스의 beforeEach / beforeAll 에서 호출하세요.
 *
 * 픽스처 경로: <repo-root>/database/seeds/test_fixture.sql
 */
export async function loadFixture() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fixturePath = path.join(
    __dirname,
    '../../../database/seeds/test_fixture.sql'
  );
  const sql = readFileSync(fixturePath, 'utf-8');
  await pool.query(sql);
}
