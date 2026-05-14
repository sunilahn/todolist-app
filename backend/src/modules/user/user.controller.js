import { getMe, updateMe, deleteMe } from './user.service.js';
import { logApiRequest, logApiSuccess, logApiError } from '../../shared/utils/logger.js';

/**
 * GET /api/users/me
 * 인증된 사용자의 프로필 정보를 반환합니다. (password_hash 미포함)
 */
export async function getMeController(req, res, next) {
  try {
    logApiRequest(req, 'user.getMe');
    const result = await getMe(req.user.userId);
    logApiSuccess(req, 'user.getMe', { userId: result.userId, email: result.email });
    res.status(200).json(result);
  } catch (err) {
    logApiError(req, 'user.getMe', err);
    next(err);
  }
}

/**
 * PATCH /api/users/me
 * 인증된 사용자의 name을 수정합니다.
 */
export async function updateMeController(req, res, next) {
  try {
    logApiRequest(req, 'user.updateMe');
    const result = await updateMe(req.user.userId, req.body);
    logApiSuccess(req, 'user.updateMe', { userId: result.userId, name: result.name });
    res.status(200).json(result);
  } catch (err) {
    logApiError(req, 'user.updateMe', err);
    next(err);
  }
}

/**
 * DELETE /api/users/me
 * 인증된 사용자를 하드 삭제하고, 보유한 refresh_tokens를 모두 폐기합니다.
 */
export async function deleteMeController(req, res, next) {
  try {
    logApiRequest(req, 'user.deleteMe');
    const { password } = req.body;
    await deleteMe(req.user.userId, password);
    logApiSuccess(req, 'user.deleteMe', { userId: req.user.userId });
    res.status(204).send();
  } catch (err) {
    logApiError(req, 'user.deleteMe', err);
    next(err);
  }
}
