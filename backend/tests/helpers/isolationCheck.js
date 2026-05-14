/**
 * DB-005 완료 조건 검증: 2회 연속 테스트 실행 시 격리 보장
 * 실행: NODE_ENV=test node tests/helpers/isolationCheck.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');
// dotenv 로드를 dynamic import 이전에 완료해야 함
dotenv.config({ path: path.join(rootDir, '.env.test') });

// dynamic import로 환경변수 로드 이후에 dbHelper 초기화
const { pool, teardown, loadFixture } = await import('./dbHelper.js');

async function countUsers() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM users');
  return rows[0].cnt;
}

async function run() {
  console.log('=== DB-005 격리 검증 ===\n');

  async function runCycle(label) {
    console.log(`[${label}] teardown → loadFixture 순서로 실행`);
    await teardown();
    const afterTeardown = await countUsers();
    console.log(`  teardown 후 users 수: ${afterTeardown}`);

    await loadFixture();
    const afterFixture = await countUsers();
    console.log(`  loadFixture 후 users 수: ${afterFixture}`);
    return afterFixture;
  }

  const count1 = await runCycle('1회차');
  const count2 = await runCycle('2회차');

  console.log('\n--- 결과 ---');
  if (count1 === count2 && count1 > 0) {
    console.log(`✅ PASS: 1회차(${count1}건) = 2회차(${count2}건) — 테스트 격리 보장`);
  } else {
    console.log(`❌ FAIL: 1회차(${count1}건) ≠ 2회차(${count2}건)`);
    process.exit(1);
  }

  await pool.end();
}

run().catch((err) => {
  console.error('오류:', err.message);
  process.exit(1);
});
