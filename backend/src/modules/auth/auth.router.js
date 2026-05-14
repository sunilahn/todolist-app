/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 *
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 회원가입
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: 회원가입 성공 }
 *       400: { description: 유효성 검증 실패 }
 *       409: { description: 이메일 중복 }
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 로그인
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *       401: { description: 인증 실패 }
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: 로그아웃
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       204: { description: 로그아웃 성공 }
 *       401: { description: 미인증 }
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: 액세스 토큰 갱신
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401: { description: 유효하지 않은 토큰 }
 *
 * /auth/password-reset/request:
 *   post:
 *     tags: [Auth]
 *     summary: 비밀번호 재설정 요청
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: 처리 완료 (이메일 노출 방지) }
 *       400: { description: 유효하지 않은 이메일 형식 }
 *
 * /auth/password-reset/confirm:
 *   post:
 *     tags: [Auth]
 *     summary: 비밀번호 재설정 확인
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: 재설정 성공 }
 *       400: { description: 비밀번호 정책 위반 }
 *       422: { description: 유효하지 않은 토큰 }
 */
import express from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  requestPasswordResetController,
  confirmPasswordResetController,
} from './auth.controller.js';

const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .regex(/[a-zA-Z]/, '비밀번호에 영문자가 포함되어야 합니다.')
  .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다.')
  .regex(/[^a-zA-Z0-9]/, '비밀번호에 특수문자가 포함되어야 합니다.');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
    name: z.string().min(1, '이름을 입력해주세요.').max(100),
    password: passwordSchema,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1) }),
});

const passwordResetRequestSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

const passwordResetConfirmSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: passwordSchema,
  }),
});

const router = express.Router();

router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);
router.post(
  '/logout',
  authenticate,
  validate(z.object({ body: z.object({ refreshToken: z.string().min(1) }) })),
  logoutController
);
router.post('/refresh', validate(refreshSchema), refreshController);
router.post('/password-reset/request', validate(passwordResetRequestSchema), requestPasswordResetController);
router.post('/password-reset/confirm', validate(passwordResetConfirmSchema), confirmPasswordResetController);

export default router;
