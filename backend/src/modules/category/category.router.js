/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: 카테고리 관련 API
 *
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: 카테고리 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               color: { type: string, pattern: '^#[0-9A-Fa-f]{6}$' }
 *               teamId: { type: string, format: uuid }
 *     responses:
 *       201: { description: 카테고리 생성 성공 }
 *       400: { description: 유효성 검증 실패 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 (팀 ADMIN 아님) }
 *       409: { description: 이름 중복 }
 *   get:
 *     tags: [Categories]
 *     summary: 카테고리 목록 조회
 *     responses:
 *       200: { description: 카테고리 목록 }
 *       401: { description: 미인증 }
 *
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: 카테고리 단건 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 카테고리 상세 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 카테고리 없음 }
 *   patch:
 *     tags: [Categories]
 *     summary: 카테고리 수정
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
 *               name: { type: string }
 *               color: { type: string }
 *     responses:
 *       200: { description: 수정된 카테고리 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 카테고리 없음 }
 *   delete:
 *     tags: [Categories]
 *     summary: 카테고리 삭제
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: 삭제 완료 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 카테고리 없음 }
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from './category.controller.js';

const router = Router();

// ─── Zod 스키마 ────────────────────────────────────────────────────────────────

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, '색상은 #RRGGBB 형식이어야 합니다.')
  .optional()
  .nullable();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1, '카테고리 이름을 입력해주세요.').max(100),
    color: colorSchema,
    teamId: z.string().uuid().optional().nullable(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().min(1, '카테고리 이름을 입력해주세요.').max(100).optional(),
      color: colorSchema,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: '수정할 항목을 입력해주세요.',
    }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ─── 라우트 등록 ───────────────────────────────────────────────────────────────

router.post('/', authenticate, validate(createSchema), createCategoryController);
router.get('/', authenticate, getCategoriesController);
router.get('/:id', authenticate, validate(idParamSchema), getCategoryController);
router.patch('/:id', authenticate, validate(updateSchema), updateCategoryController);
router.delete('/:id', authenticate, validate(idParamSchema), deleteCategoryController);

export default router;
