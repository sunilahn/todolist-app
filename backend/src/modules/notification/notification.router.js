/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 알림 관련 API
 *
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: 알림 목록 조회 (최신순)
 *     responses:
 *       200: { description: 알림 목록 }
 *       401: { description: 미인증 }
 *
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: 전체 알림 읽음 처리
 *     responses:
 *       204: { description: 처리 완료 }
 *       401: { description: 미인증 }
 *
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: 단건 알림 읽음 처리
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 읽음 처리된 알림 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 알림 없음 }
 */
import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} from './notification.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotificationsController);
router.patch('/read-all', markAllAsReadController);
router.patch('/:id/read', markAsReadController);

export default router;
