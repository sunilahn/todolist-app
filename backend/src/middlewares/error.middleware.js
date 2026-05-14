import { AppError } from '../shared/errors/index.js';
import logger from '../shared/utils/logger.js';
import { env } from '../config/env.js';

/**
 * Express global error-handling middleware (4-argument signature required by Express).
 *
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    logger.warn(`[error] ${err.code}`, {
      statusCode: err.statusCode,
      message: err.message,
      path: _req.originalUrl,
      method: _req.method,
      userId: _req.user?.userId,
    });
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  // Unexpected error — always log with stack trace
  logger.error(err.message, { stack: err.stack });

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : (err.message ?? 'An unexpected error occurred.');

  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message,
  });
}
