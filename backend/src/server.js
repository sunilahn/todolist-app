// env.js MUST be the first import so environment variables are validated
// before any other module (database, app, …) reads process.env.
import { env } from './config/env.js';
import pool from './config/database.js';
import app from './app.js';
import logger from './shared/utils/logger.js';
import { startScheduler } from './modules/notification/notification.scheduler.js';

const server = app.listen(env.PORT, async () => {
  logger.info(`Server started`);
  logger.info(`Environment  : ${env.NODE_ENV}`);
  logger.info(`Listening on : http://localhost:${env.PORT}`);
  logger.info(`Health check : http://localhost:${env.PORT}/health`);

  // Verify database connectivity immediately after the HTTP server is up
  try {
    const maskedUrl = env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    await pool.query('SELECT 1');
    logger.info(`Database     : ${maskedUrl}`);
    logger.info('Database connection established successfully.');
    startScheduler();
  } catch (err) {
    logger.error('Failed to connect to the database.', { message: err.message, stack: err.stack });
    // Keep the server running; DB may become available later.
    // Alternatively, call process.exit(1) if DB is strictly required at startup.
  }
});

// Graceful shutdown handler
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error while closing HTTP server.', { message: err.message });
      process.exit(1);
    }

    try {
      await pool.end();
      logger.info('Database pool closed.');
    } catch (poolErr) {
      logger.error('Error while closing database pool.', { message: poolErr.message });
    }

    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
