import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

export default pool;
