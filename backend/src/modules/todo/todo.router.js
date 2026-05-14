/**
 * @swagger
 * tags:
 *   name: Todos
 *   description: 할일 관련 API
 *
 * /todos:
 *   post:
 *     tags: [Todos]
 *     summary: 할일 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [PLANNED, IN_PROGRESS, DONE, ON_HOLD] }
 *               startDate: { type: string, format: date }
 *               dueDate: { type: string, format: date }
 *               categoryId: { type: string, format: uuid }
 *               teamId: { type: string, format: uuid }
 *     responses:
 *       201: { description: 할일 생성 성공 }
 *       400: { description: 유효성 검증 실패 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *   get:
 *     tags: [Todos]
 *     summary: 할일 목록 조회
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PLANNED, IN_PROGRESS, DONE, ON_HOLD] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: 할일 목록 }
 *       401: { description: 미인증 }
 *
 * /todos/today:
 *   get:
 *     tags: [Todos]
 *     summary: 오늘의 할일 조회 (KST 기준)
 *     responses:
 *       200: { description: 오늘 할일 목록 }
 *       401: { description: 미인증 }
 *
 * /todos/this-week:
 *   get:
 *     tags: [Todos]
 *     summary: 이번 주 할일 조회 (KST 기준)
 *     responses:
 *       200: { description: 이번 주 할일 목록 }
 *       401: { description: 미인증 }
 *
 * /todos/{id}:
 *   get:
 *     tags: [Todos]
 *     summary: 할일 단건 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 할일 상세 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 할일 없음 }
 *   patch:
 *     tags: [Todos]
 *     summary: 할일 수정
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [PLANNED, IN_PROGRESS, DONE, ON_HOLD] }
 *               startDate: { type: string, format: date }
 *               dueDate: { type: string, format: date }
 *               categoryId: { type: string, format: uuid }
 *     responses:
 *       200: { description: 수정된 할일 }
 *       400: { description: 유효성 검증 실패 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 할일 없음 }
 *   delete:
 *     tags: [Todos]
 *     summary: 할일 삭제
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: 삭제 완료 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 할일 없음 }
 *
 * /todos/{id}/status:
 *   patch:
 *     tags: [Todos]
 *     summary: 할일 상태 변경
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PLANNED, IN_PROGRESS, DONE, ON_HOLD] }
 *     responses:
 *       200: { description: 변경된 할일 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 할일 없음 }
 *       422: { description: 허용되지 않은 상태 전이 }
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createTodoController,
  getTodoController,
  listTodosController,
  getTodayTodosController,
  getThisWeekTodosController,
  updateTodoController,
  updateTodoStatusController,
  deleteTodoController,
} from './todo.controller.js';

const router = Router();

// ─── Zod 스키마 ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, '제목을 입력해주세요.').max(500),
      description: z.string().optional(),
      status: z.enum(['PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD']).optional(),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .nullable(),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .nullable(),
      categoryId: z.string().uuid().optional().nullable(),
      teamId: z.string().uuid().optional().nullable(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.dueDate) return data.dueDate >= data.startDate;
        return true;
      },
      { message: '종료일은 시작일 이상이어야 합니다.' }
    ),
});

const updateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(1, '제목을 입력해주세요.').max(500).optional(),
      description: z.string().optional(),
      status: z.enum(['PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD']).optional(),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .nullable(),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .nullable(),
      categoryId: z.string().uuid().optional().nullable(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.dueDate) return data.dueDate >= data.startDate;
        return true;
      },
      { message: '종료일은 시작일 이상이어야 합니다.' }
    ),
});

const updateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD']),
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ─── 라우트 등록 ───────────────────────────────────────────────────────────────
// 중요: /today, /this-week 는 /:id 보다 먼저 등록

router.post('/', authenticate, validate(createSchema), createTodoController);
router.get('/', authenticate, listTodosController);
router.get('/today', authenticate, getTodayTodosController);
router.get('/this-week', authenticate, getThisWeekTodosController);
router.get('/:id', authenticate, validate(idParamSchema), getTodoController);
router.patch('/:id', authenticate, validate(updateSchema), updateTodoController);
router.patch('/:id/status', authenticate, validate(updateStatusSchema), updateTodoStatusController);
router.delete('/:id', authenticate, validate(idParamSchema), deleteTodoController);

export default router;
