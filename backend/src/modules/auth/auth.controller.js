import {
  register,
  login,
  logout,
  refresh,
  requestPasswordReset,
  confirmPasswordReset,
} from './auth.service.js';
import { logApiRequest, logApiSuccess, logApiError } from '../../shared/utils/logger.js';

export async function registerController(req, res, next) {
  try {
    const { email, name, password } = req.body;
    logApiRequest(req, 'auth.register', { email, name });
    const result = await register(email, name, password);
    logApiSuccess(req, 'auth.register', { createdUserId: result.userId, email: result.email });
    res.status(201).json(result);
  } catch (err) {
    logApiError(req, 'auth.register', err);
    next(err);
  }
}

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    logApiRequest(req, 'auth.login', { email });
    const result = await login(email, password);
    logApiSuccess(req, 'auth.login', {
      email,
      issuedAccessToken: Boolean(result.accessToken),
      issuedRefreshToken: Boolean(result.refreshToken),
    });
    res.status(200).json(result);
  } catch (err) {
    logApiError(req, 'auth.login', err);
    next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    const { refreshToken } = req.body;
    logApiRequest(req, 'auth.logout');
    await logout(refreshToken, req.user.userId);
    logApiSuccess(req, 'auth.logout');
    res.status(204).send();
  } catch (err) {
    logApiError(req, 'auth.logout', err);
    next(err);
  }
}

export async function refreshController(req, res, next) {
  try {
    const { refreshToken } = req.body;
    logApiRequest(req, 'auth.refresh');
    const result = await refresh(refreshToken);
    logApiSuccess(req, 'auth.refresh', { issuedAccessToken: Boolean(result.accessToken) });
    res.status(200).json(result);
  } catch (err) {
    logApiError(req, 'auth.refresh', err);
    next(err);
  }
}

export async function requestPasswordResetController(req, res, next) {
  try {
    const { email } = req.body;
    logApiRequest(req, 'auth.requestPasswordReset', { email });
    await requestPasswordReset(email);
    logApiSuccess(req, 'auth.requestPasswordReset', { email });
    res.status(200).json({ message: '비밀번호 재설정 이메일이 발송되었습니다.' });
  } catch (err) {
    logApiError(req, 'auth.requestPasswordReset', err);
    next(err);
  }
}

export async function confirmPasswordResetController(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    logApiRequest(req, 'auth.confirmPasswordReset');
    await confirmPasswordReset(token, newPassword);
    logApiSuccess(req, 'auth.confirmPasswordReset');
    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    logApiError(req, 'auth.confirmPasswordReset', err);
    next(err);
  }
}
