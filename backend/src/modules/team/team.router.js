/**
 * @swagger
 * tags:
 *   - name: Teams
 *     description: 팀 관련 API
 *   - name: Invitations
 *     description: 초대 관련 API
 *
 * /teams:
 *   post:
 *     tags: [Teams]
 *     summary: 팀 생성 (생성자 ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: 팀 생성 성공 }
 *       400: { description: 유효성 검증 실패 }
 *       401: { description: 미인증 }
 *   get:
 *     tags: [Teams]
 *     summary: 소속 팀 목록 조회
 *     responses:
 *       200: { description: 팀 목록 }
 *       401: { description: 미인증 }
 *
 * /teams/{teamId}:
 *   get:
 *     tags: [Teams]
 *     summary: 팀 상세 조회
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 팀 상세 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       404: { description: 팀 없음 }
 *   patch:
 *     tags: [Teams]
 *     summary: 팀 수정 (ADMIN 전용)
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: 수정된 팀 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *   delete:
 *     tags: [Teams]
 *     summary: 팀 삭제 (ADMIN 전용, 할일·카테고리 연쇄 삭제)
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: 삭제 완료 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *
 * /teams/{teamId}/members:
 *   get:
 *     tags: [Teams]
 *     summary: 팀 멤버 목록 조회
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 멤버 목록 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *
 * /teams/{teamId}/members/{userId}/role:
 *   patch:
 *     tags: [Teams]
 *     summary: 멤버 역할 변경 (ADMIN 전용)
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [ADMIN, MEMBER, VIEWER] }
 *     responses:
 *       200: { description: 변경된 멤버 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       422: { description: 마지막 ADMIN }
 *
 * /teams/{teamId}/members/me:
 *   delete:
 *     tags: [Teams]
 *     summary: 팀 탈퇴
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: 탈퇴 완료 }
 *       401: { description: 미인증 }
 *       422: { description: 마지막 ADMIN }
 *
 * /teams/{teamId}/members/{userId}:
 *   delete:
 *     tags: [Teams]
 *     summary: 멤버 추방 (ADMIN 전용)
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: 추방 완료 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *
 * /teams/{teamId}/invitations:
 *   post:
 *     tags: [Teams]
 *     summary: 팀 초대 생성 (ADMIN 전용)
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitedUserId, role]
 *             properties:
 *               invitedUserId: { type: string, format: uuid }
 *               role: { type: string, enum: [MEMBER, VIEWER] }
 *     responses:
 *       201: { description: 초대 생성 성공 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       409: { description: 이미 소속 또는 PENDING 초대 존재 }
 *   get:
 *     tags: [Teams]
 *     summary: 초대 목록 조회 (ADMIN 전용)
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 초대 목록 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *
 * /invitations/{invitationId}/accept:
 *   patch:
 *     tags: [Invitations]
 *     summary: 초대 수락
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 수락 완료 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 *       409: { description: 이미 소속 }
 *       422: { description: 만료된 초대 }
 *
 * /invitations/{invitationId}/decline:
 *   patch:
 *     tags: [Invitations]
 *     summary: 초대 거절
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: 거절 완료 }
 *       401: { description: 미인증 }
 *       403: { description: 권한 없음 }
 */
import express from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  createTeamController,
  getTeamsController,
  getTeamController,
  updateTeamController,
  deleteTeamController,
  getMembersController,
  changeMemberRoleController,
  kickMemberController,
  leaveTeamController,
  createInvitationController,
  getInvitationsController,
} from './team.controller.js';
import {
  acceptInvitationController,
  declineInvitationController,
} from './team.controller.js';

const teamBodySchema = z.object({ body: z.object({ name: z.string().min(1).max(100) }) });
const invitationBodySchema = z.object({
  body: z.object({
    invitedUserId: z.string().uuid(),
    role: z.enum(['MEMBER', 'VIEWER']),
  }),
});
const roleBodySchema = z.object({
  body: z.object({ role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']) }),
});

const router = express.Router();

router.use(authenticate);

// Teams
router.post('/', validate(teamBodySchema), createTeamController);
router.get('/', getTeamsController);
router.get('/:teamId', getTeamController);
router.patch('/:teamId', validate(teamBodySchema), updateTeamController);
router.delete('/:teamId', deleteTeamController);

// Members — /me must come before /:userId
router.get('/:teamId/members', getMembersController);
router.patch('/:teamId/members/:userId/role', validate(roleBodySchema), changeMemberRoleController);
router.delete('/:teamId/members/me', leaveTeamController);
router.delete('/:teamId/members/:userId', kickMemberController);

// Invitations
router.post('/:teamId/invitations', validate(invitationBodySchema), createInvitationController);
router.get('/:teamId/invitations', getInvitationsController);

export default router;

// ─── Invitation accept/decline router (mounted at /invitations) ───────────────
export const invitationRouter = express.Router();

invitationRouter.use(authenticate);
invitationRouter.patch('/:invitationId/accept', acceptInvitationController);
invitationRouter.patch('/:invitationId/decline', declineInvitationController);
