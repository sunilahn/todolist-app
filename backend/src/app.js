import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import pool from './config/database.js';
import logger from './shared/utils/logger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './shared/errors/index.js';
import { swaggerSpec } from './config/swagger.js';
import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/user/user.router.js';
import todoRouter from './modules/todo/todo.router.js';
import categoryRouter from './modules/category/category.router.js';
import teamRouter, { invitationRouter } from './modules/team/team.router.js';
import notificationRouter from './modules/notification/notification.router.js';

const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '100kb' }));

// Request logging middleware (uses winston)
app.use((req, _res, next) => {
  const start = Date.now();
  const { method, url } = req;
  logger.debug(`--> ${method} ${url}`);

  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`<-- ${method} ${url} ${_res.statusCode} (${duration}ms)`);
  });

  next();
});

// Rate limiter for auth endpoints (login, register, password-reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'TOO_MANY_REQUESTS', message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
  skip: () => env.NODE_ENV === 'test',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/password-reset', authLimiter);

// Swagger UI — non-production only
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/todos', todoRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/teams', teamRouter);
app.use('/api/invitations', invitationRouter);
app.use('/api/notifications', notificationRouter);

// Health check endpoint — also verifies DB connectivity
app.get('/health', async (_req, res) => {
  let db = 'ok';
  try {
    await pool.query('SELECT 1');
  } catch {
    db = 'error';
  }
  const httpStatus = db === 'ok' ? 200 : 503;
  res.status(httpStatus).json({
    status: db === 'ok' ? 'ok' : 'degraded',
    db,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler — wraps into NotFoundError so the global handler formats it uniformly
app.use((_req, _res, next) => {
  next(new NotFoundError('The requested resource was not found.'));
});

// Global error handler (must be registered last and have 4 arguments)
app.use(errorHandler);

export default app;
