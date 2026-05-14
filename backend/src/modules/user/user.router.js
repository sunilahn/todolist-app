/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관련 API
 *
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: 내 정보 조회
 *     responses:
 *       200: { description: 사용자 정보 }
 *       401: { description: 미인증 }
 *   patch:
 *     tags: [Users]
 *     summary: 내 정보 수정
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: 수정된 사용자 정보 }
 *       400: { description: 유효성 검증 실패 }
 *       401: { description: 미인증 }
 *   delete:
 *     tags: [Users]
 *     summary: 회원 탈퇴
 *     responses:
 *       204: { description: 탈퇴 완료 }
 *       401: { description: 미인증 }
 */
import express from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getMeController, updateMeController, deleteMeController } from './user.controller.js';

const updateSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, '이름을 입력해주세요.').max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: '수정할 항목을 입력해주세요.',
    }),
});

const router = express.Router();

// 모든 /users 라우트에 인증 필요
router.use(authenticate);

router.get('/me', getMeController);
router.patch('/me', validate(updateSchema), updateMeController);
router.delete('/me', deleteMeController);

export default router;
