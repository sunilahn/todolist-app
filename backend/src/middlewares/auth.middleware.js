import { UnauthorizedError } from '../shared/errors/index.js';
import { verifyAccessToken } from '../shared/utils/jwtUtils.js';

export function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication required.'));
  }

  const token = authHeader.slice(7);

  if (!token) {
    return next(new UnauthorizedError('Authentication required.'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token.'));
  }
}
