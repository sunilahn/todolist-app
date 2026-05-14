import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from './notification.service.js';
import { logApiRequest, logApiSuccess, logApiError } from '../../shared/utils/logger.js';

export async function getNotificationsController(req, res, next) {
  try {
    logApiRequest(req, 'notification.list');
    const notifications = await getNotifications(req.user.userId);
    logApiSuccess(req, 'notification.list', { count: notifications.length });
    return res.status(200).json(notifications);
  } catch (err) {
    logApiError(req, 'notification.list', err);
    return next(err);
  }
}

export async function markAsReadController(req, res, next) {
  try {
    logApiRequest(req, 'notification.markAsRead');
    const notification = await markAsRead(req.params.id, req.user.userId);
    logApiSuccess(req, 'notification.markAsRead', { notificationId: notification.notificationId });
    return res.status(200).json(notification);
  } catch (err) {
    logApiError(req, 'notification.markAsRead', err);
    return next(err);
  }
}

export async function markAllAsReadController(req, res, next) {
  try {
    logApiRequest(req, 'notification.markAllAsRead');
    await markAllAsRead(req.user.userId);
    logApiSuccess(req, 'notification.markAllAsRead');
    return res.status(204).send();
  } catch (err) {
    logApiError(req, 'notification.markAllAsRead', err);
    return next(err);
  }
}
