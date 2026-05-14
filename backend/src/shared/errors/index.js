export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} code
   */
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'Authentication is required.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'A conflict occurred with the current state of the resource.') {
    super(message, 409, 'CONFLICT');
  }
}

export class UnprocessableError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'The request was well-formed but could not be processed.') {
    super(message, 422, 'UNPROCESSABLE');
  }
}
