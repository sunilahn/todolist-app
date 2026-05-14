import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/src/config → backend/src → backend → root
const rootDir = path.resolve(__dirname, '../..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.join(rootDir, envFile) });

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_PASSWORD_RESET_SECRET', 'CORS_ORIGIN'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[env] Missing required environment variable(s): ${missing.join(', ')}\n` +
      `[env] Please set them in your .env file or environment before starting the server.`
  );
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),

  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_MIN: Number(process.env.DATABASE_POOL_MIN ?? 5),
  DATABASE_POOL_MAX: Number(process.env.DATABASE_POOL_MAX ?? 20),

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_PASSWORD_RESET_SECRET: process.env.JWT_PASSWORD_RESET_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY ?? '',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS ?? '',

  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
