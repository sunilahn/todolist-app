import pool from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnprocessableError,
} from '../../shared/errors/index.js';
import { createNotification } from '../notification/notification.service.js';
import { logAudit } from '../audit/audit.service.js';

function mapTeam(row) {
  return {
    teamId: row.team_id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row) {
  return {
    teamMemberId: row.team_member_id,
    teamId: row.team_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapInvitation(row) {
  return {
    invitationId: row.invitation_id,
    teamId: row.team_id,
    invitedUserId: row.invited_user_id,
    invitedBy: row.invited_by,
    role: row.role,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

export async function getTeamRole(teamId, userId) {
  const { rows } = await pool.query(
    `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );
  return rows.length > 0 ? rows[0].role : null;
}

// ─── Team CRUD ────────────────────────────────────────────────────────────────

export async function createTeam(userId, { name }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name, userId]
    );
    const team = rows[0];

    const memberRow = await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'ADMIN') RETURNING *`,
      [team.team_id, userId]
    );

    await client.query('COMMIT');

    const teamObj = mapTeam(team);
    await logAudit('Team', team.team_id, 'CREATE', userId, null, teamObj);
    await logAudit('TeamMember', memberRow.rows[0].team_member_id, 'CREATE', userId, null, mapMember(memberRow.rows[0]));
    return teamObj;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getTeams(userId) {
  const { rows } = await pool.query(
    `SELECT t.* FROM teams t
     JOIN team_members tm ON t.team_id = tm.team_id
     WHERE tm.user_id = $1
     ORDER BY t.created_at ASC`,
    [userId]
  );
  return rows.map(mapTeam);
}

export async function getTeam(teamId, userId) {
  const role = await getTeamRole(teamId, userId);
  if (role === null) {
    throw new ForbiddenError('해당 팀에 접근 권한이 없습니다.');
  }

  const { rows } = await pool.query(`SELECT * FROM teams WHERE team_id = $1`, [teamId]);
  if (rows.length === 0) {
    throw new NotFoundError('팀을 찾을 수 없습니다.');
  }
  return mapTeam(rows[0]);
}

export async function updateTeam(teamId, userId, { name }) {
  const role = await getTeamRole(teamId, userId);
  if (role !== 'ADMIN') {
    throw new ForbiddenError('팀 정보는 ADMIN만 수정할 수 있습니다.');
  }

  const { rows: beforeRows } = await pool.query(`SELECT * FROM teams WHERE team_id = $1`, [teamId]);
  if (beforeRows.length === 0) throw new NotFoundError('팀을 찾을 수 없습니다.');

  const { rows } = await pool.query(
    `UPDATE teams SET name = $1, updated_at = NOW() WHERE team_id = $2 RETURNING *`,
    [name, teamId]
  );
  if (rows.length === 0) {
    throw new NotFoundError('팀을 찾을 수 없습니다.');
  }
  const before = mapTeam(beforeRows[0]);
  const after = mapTeam(rows[0]);
  await logAudit('Team', teamId, 'UPDATE', userId, before, after);
  return after;
}

export async function deleteTeam(teamId, userId) {
  const role = await getTeamRole(teamId, userId);
  if (role !== 'ADMIN') {
    throw new ForbiddenError('팀 삭제는 ADMIN만 할 수 있습니다.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 팀의 카테고리 삭제 (todos.category_id는 SET NULL됨)
    await client.query(`DELETE FROM categories WHERE owner_id = $1 AND owner_type = 'TEAM'`, [teamId]);

    // 팀 할일 삭제 (ON DELETE CASCADE로도 처리되지만 명시적으로)
    await client.query(`DELETE FROM todos WHERE team_id = $1`, [teamId]);

    // 팀 삭제 (team_members, team_invitations은 ON DELETE CASCADE)
    await client.query(`DELETE FROM teams WHERE team_id = $1`, [teamId]);

    await client.query('COMMIT');
    await logAudit('Team', teamId, 'DELETE', userId, null, null);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getMembers(teamId, userId) {
  const role = await getTeamRole(teamId, userId);
  if (role === null) {
    throw new ForbiddenError('해당 팀에 접근 권한이 없습니다.');
  }

  const { rows } = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
    [teamId]
  );
  return rows.map(mapMember);
}

export async function changeMemberRole(teamId, targetUserId, requesterId, { role }) {
  const requesterRole = await getTeamRole(teamId, requesterId);
  if (requesterRole !== 'ADMIN') {
    throw new ForbiddenError('역할 변경은 ADMIN만 할 수 있습니다.');
  }

  const { rows: targetRows } = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, targetUserId]
  );
  if (targetRows.length === 0) {
    throw new NotFoundError('해당 팀 멤버를 찾을 수 없습니다.');
  }

  // 마지막 ADMIN 보호 (TEAM-002)
  if (targetRows[0].role === 'ADMIN' && role !== 'ADMIN') {
    const { rows: adminRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = $1 AND role = 'ADMIN'`,
      [teamId]
    );
    if (parseInt(adminRows[0].cnt, 10) <= 1) {
      throw new UnprocessableError('마지막 ADMIN의 역할은 변경할 수 없습니다.');
    }
  }

  const before = mapMember(targetRows[0]);
  const { rows } = await pool.query(
    `UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3 RETURNING *`,
    [role, teamId, targetUserId]
  );
  const after = mapMember(rows[0]);
  await logAudit('TeamMember', rows[0].team_member_id, 'UPDATE', requesterId, before, after);
  return after;
}

export async function kickMember(teamId, targetUserId, requesterId) {
  const requesterRole = await getTeamRole(teamId, requesterId);
  if (requesterRole !== 'ADMIN') {
    throw new ForbiddenError('멤버 추방은 ADMIN만 할 수 있습니다.');
  }

  const { rows } = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, targetUserId]
  );
  if (rows.length === 0) {
    throw new NotFoundError('해당 팀 멤버를 찾을 수 없습니다.');
  }

  // NULL 처리: 추방된 멤버가 생성한 팀 할일의 user_id를 NULL로 변경 (TEAM-004)
  await pool.query(
    `UPDATE todos SET user_id = NULL WHERE team_id = $1 AND user_id = $2`,
    [teamId, targetUserId]
  );

  const memberId = rows[0].team_member_id;
  await pool.query(
    `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, targetUserId]
  );
  await logAudit('TeamMember', memberId, 'DELETE', requesterId, mapMember(rows[0]), null);
}

export async function leaveTeam(teamId, userId) {
  const role = await getTeamRole(teamId, userId);
  if (role === null) {
    throw new NotFoundError('해당 팀의 멤버가 아닙니다.');
  }

  // 마지막 ADMIN은 탈퇴 불가 (TEAM-002)
  if (role === 'ADMIN') {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = $1 AND role = 'ADMIN'`,
      [teamId]
    );
    if (parseInt(rows[0].cnt, 10) <= 1) {
      throw new UnprocessableError('마지막 ADMIN은 팀을 탈퇴할 수 없습니다.');
    }
  }

  const { rows: memberRows } = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );

  // 탈퇴 시 생성한 팀 할일의 user_id를 NULL로 변경 (TEAM-004)
  await pool.query(
    `UPDATE todos SET user_id = NULL WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );

  await pool.query(
    `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );
  if (memberRows.length > 0) {
    await logAudit('TeamMember', memberRows[0].team_member_id, 'DELETE', userId, mapMember(memberRows[0]), null);
  }
}

// ─── Invitations ──────────────────────────────────────────────────────────────

const INVITATION_EXPIRY_DAYS = 7;

export async function createInvitation(teamId, requesterId, { invitedUserId, role }) {
  const requesterRole = await getTeamRole(teamId, requesterId);
  if (requesterRole !== 'ADMIN') {
    throw new ForbiddenError('초대는 ADMIN만 생성할 수 있습니다.');
  }

  // 이미 팀 멤버인지 확인 (TEAM-003)
  const existingMember = await pool.query(
    `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, invitedUserId]
  );
  if (existingMember.rows.length > 0) {
    throw new ConflictError('이미 팀에 소속된 사용자입니다.');
  }

  // PENDING 초대가 이미 있는지 확인 (INV-002)
  const existingInvite = await pool.query(
    `SELECT 1 FROM team_invitations
     WHERE team_id = $1 AND invited_user_id = $2 AND status = 'PENDING'`,
    [teamId, invitedUserId]
  );
  if (existingInvite.rows.length > 0) {
    throw new ConflictError('이미 PENDING 상태의 초대가 존재합니다.');
  }

  const { rows } = await pool.query(
    `INSERT INTO team_invitations (team_id, invited_user_id, invited_by, role, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${INVITATION_EXPIRY_DAYS} days')
     RETURNING *`,
    [teamId, invitedUserId, requesterId, role]
  );
  const invitation = rows[0];
  const mappedInvitation = mapInvitation(invitation);

  // NOTIF-002: TEAM_INVITE 알림 발송
  const { rows: teamRows } = await pool.query(`SELECT name FROM teams WHERE team_id = $1`, [teamId]);
  const teamName = teamRows[0]?.name ?? '팀';
  await createNotification(
    invitedUserId,
    'TEAM_INVITE',
    `"${teamName}" 팀에 초대되었습니다.`,
    invitation.invitation_id
  );

  await logAudit('TeamInvitation', invitation.invitation_id, 'CREATE', requesterId, null, mappedInvitation);
  return mappedInvitation;
}

export async function getInvitations(teamId, userId) {
  const role = await getTeamRole(teamId, userId);
  if (role !== 'ADMIN') {
    throw new ForbiddenError('초대 목록은 ADMIN만 조회할 수 있습니다.');
  }

  const { rows } = await pool.query(
    `SELECT * FROM team_invitations WHERE team_id = $1 ORDER BY created_at DESC`,
    [teamId]
  );
  return rows.map(mapInvitation);
}

export async function acceptInvitation(invitationId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM team_invitations WHERE invitation_id = $1`,
    [invitationId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('초대를 찾을 수 없습니다.');
  }

  const invitation = rows[0];

  if (invitation.invited_user_id !== userId) {
    throw new ForbiddenError('본인의 초대만 수락할 수 있습니다.');
  }

  if (invitation.status !== 'PENDING') {
    throw new UnprocessableError('PENDING 상태의 초대만 수락할 수 있습니다.');
  }

  // 만료 확인 (INV-005)
  if (new Date(invitation.expires_at) < new Date()) {
    await pool.query(
      `UPDATE team_invitations SET status = 'EXPIRED', responded_at = NOW() WHERE invitation_id = $1`,
      [invitationId]
    );
    throw new UnprocessableError('만료된 초대입니다.');
  }

  // 이미 팀 멤버인지 확인 (TEAM-003)
  const existingMember = await pool.query(
    `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [invitation.team_id, userId]
  );
  if (existingMember.rows.length > 0) {
    throw new ConflictError('이미 팀에 소속된 사용자입니다.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: updatedInv } = await client.query(
      `UPDATE team_invitations SET status = 'ACCEPTED', responded_at = NOW() WHERE invitation_id = $1 RETURNING *`,
      [invitationId]
    );

    const { rows: newMember } = await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING *`,
      [invitation.team_id, userId, invitation.role]
    );

    // 관련 TEAM_INVITE 알림 읽음 처리 (수락 시)
    await client.query(
      `UPDATE notifications SET is_read = true
       WHERE user_id = $1 AND type = 'TEAM_INVITE' AND reference_id = $2`,
      [userId, invitationId]
    );

    await client.query('COMMIT');

    await logAudit('TeamInvitation', invitationId, 'UPDATE', userId, mapInvitation(invitation), mapInvitation(updatedInv[0]));
    await logAudit('TeamMember', newMember[0].team_member_id, 'CREATE', userId, null, mapMember(newMember[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function declineInvitation(invitationId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM team_invitations WHERE invitation_id = $1`,
    [invitationId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('초대를 찾을 수 없습니다.');
  }

  const invitation = rows[0];

  if (invitation.invited_user_id !== userId) {
    throw new ForbiddenError('본인의 초대만 거절할 수 있습니다.');
  }

  if (invitation.status !== 'PENDING') {
    throw new UnprocessableError('PENDING 상태의 초대만 거절할 수 있습니다.');
  }

  const { rows: updated } = await pool.query(
    `UPDATE team_invitations SET status = 'DECLINED', responded_at = NOW() WHERE invitation_id = $1 RETURNING *`,
    [invitationId]
  );
  await logAudit('TeamInvitation', invitationId, 'UPDATE', userId, mapInvitation(invitation), mapInvitation(updated[0]));
}
