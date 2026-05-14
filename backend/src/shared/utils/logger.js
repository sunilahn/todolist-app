import { createLogger, format, transports } from 'winston';
import { AppError } from '../errors/index.js';

const { combine, timestamp, colorize, simple, json, errors } = format;

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction
    ? combine(errors({ stack: true }), timestamp(), json())
    : combine(errors({ stack: true }), colorize(), simple()),
  transports: [new transports.Console()],
});

const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
]);

function sanitizeLogValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? '[REDACTED]' : sanitizeLogValue(nestedValue),
      ])
    );
  }

  return value;
}

function buildRequestMeta(req, extra = {}) {
  return sanitizeLogValue({
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.userId,
    params: Object.keys(req.params ?? {}).length > 0 ? req.params : undefined,
    query: Object.keys(req.query ?? {}).length > 0 ? req.query : undefined,
    body: Object.keys(req.body ?? {}).length > 0 ? req.body : undefined,
    ...extra,
  });
}

export function logApiRequest(req, action, extra = {}) {
  logger.info(`[api] ${action} request`, buildRequestMeta(req, extra));
}

export function logApiSuccess(req, action, extra = {}) {
  logger.info(`[api] ${action} success`, buildRequestMeta(req, extra));
}

export function logApiError(req, action, err, extra = {}) {
  const meta = buildRequestMeta(req, {
    errorName: err.name,
    errorCode: err.code,
    statusCode: err.statusCode,
    message: err.message,
    stack: err instanceof AppError ? undefined : err.stack,
    ...extra,
  });

  if (err instanceof AppError) {
    logger.warn(`[api] ${action} failed`, meta);
    return;
  }

  logger.error(`[api] ${action} failed`, meta);
}

export default logger;
