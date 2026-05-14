import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  getMembers,
  changeMemberRole,
  kickMember,
  leaveTeam,
  createInvitation,
  getInvitations,
  acceptInvitation,
  declineInvitation,
} from './team.service.js';
import { logApiRequest, logApiSuccess, logApiError } from '../../shared/utils/logger.js';

export async function createTeamController(req, res, next) {
  try {
    logApiRequest(req, 'team.create');
    const team = await createTeam(req.user.userId, req.body);
    logApiSuccess(req, 'team.create', { teamId: team.teamId, name: team.name });
    return res.status(201).json(team);
  } catch (err) {
    logApiError(req, 'team.create', err);
    return next(err);
  }
}

export async function getTeamsController(req, res, next) {
  try {
    logApiRequest(req, 'team.list');
    const teams = await getTeams(req.user.userId);
    logApiSuccess(req, 'team.list', { count: teams.length });
    return res.status(200).json(teams);
  } catch (err) {
    logApiError(req, 'team.list', err);
    return next(err);
  }
}

export async function getTeamController(req, res, next) {
  try {
    logApiRequest(req, 'team.get');
    const team = await getTeam(req.params.teamId, req.user.userId);
    logApiSuccess(req, 'team.get', { teamId: team.teamId, name: team.name });
    return res.status(200).json(team);
  } catch (err) {
    logApiError(req, 'team.get', err);
    return next(err);
  }
}

export async function updateTeamController(req, res, next) {
  try {
    logApiRequest(req, 'team.update');
    const team = await updateTeam(req.params.teamId, req.user.userId, req.body);
    logApiSuccess(req, 'team.update', { teamId: team.teamId, name: team.name });
    return res.status(200).json(team);
  } catch (err) {
    logApiError(req, 'team.update', err);
    return next(err);
  }
}

export async function deleteTeamController(req, res, next) {
  try {
    logApiRequest(req, 'team.delete');
    await deleteTeam(req.params.teamId, req.user.userId);
    logApiSuccess(req, 'team.delete', { teamId: req.params.teamId });
    return res.status(204).send();
  } catch (err) {
    logApiError(req, 'team.delete', err);
    return next(err);
  }
}

export async function getMembersController(req, res, next) {
  try {
    logApiRequest(req, 'team.members.list');
    const members = await getMembers(req.params.teamId, req.user.userId);
    logApiSuccess(req, 'team.members.list', { teamId: req.params.teamId, count: members.length });
    return res.status(200).json(members);
  } catch (err) {
    logApiError(req, 'team.members.list', err);
    return next(err);
  }
}

export async function changeMemberRoleController(req, res, next) {
  try {
    logApiRequest(req, 'team.members.changeRole');
    const member = await changeMemberRole(
      req.params.teamId,
      req.params.userId,
      req.user.userId,
      req.body
    );
    logApiSuccess(req, 'team.members.changeRole', {
      teamId: req.params.teamId,
      targetUserId: req.params.userId,
      role: member.role,
    });
    return res.status(200).json(member);
  } catch (err) {
    logApiError(req, 'team.members.changeRole', err);
    return next(err);
  }
}

export async function kickMemberController(req, res, next) {
  try {
    logApiRequest(req, 'team.members.kick');
    await kickMember(req.params.teamId, req.params.userId, req.user.userId);
    logApiSuccess(req, 'team.members.kick', {
      teamId: req.params.teamId,
      targetUserId: req.params.userId,
    });
    return res.status(204).send();
  } catch (err) {
    logApiError(req, 'team.members.kick', err);
    return next(err);
  }
}

export async function leaveTeamController(req, res, next) {
  try {
    logApiRequest(req, 'team.leave');
    await leaveTeam(req.params.teamId, req.user.userId);
    logApiSuccess(req, 'team.leave', { teamId: req.params.teamId });
    return res.status(204).send();
  } catch (err) {
    logApiError(req, 'team.leave', err);
    return next(err);
  }
}

export async function createInvitationController(req, res, next) {
  try {
    logApiRequest(req, 'team.invitation.create');
    const invitation = await createInvitation(req.params.teamId, req.user.userId, req.body);
    logApiSuccess(req, 'team.invitation.create', {
      teamId: req.params.teamId,
      invitationId: invitation.invitationId,
    });
    return res.status(201).json(invitation);
  } catch (err) {
    logApiError(req, 'team.invitation.create', err);
    return next(err);
  }
}

export async function getInvitationsController(req, res, next) {
  try {
    logApiRequest(req, 'team.invitation.list');
    const invitations = await getInvitations(req.params.teamId, req.user.userId);
    logApiSuccess(req, 'team.invitation.list', {
      teamId: req.params.teamId,
      count: invitations.length,
    });
    return res.status(200).json(invitations);
  } catch (err) {
    logApiError(req, 'team.invitation.list', err);
    return next(err);
  }
}

export async function acceptInvitationController(req, res, next) {
  try {
    logApiRequest(req, 'team.invitation.accept');
    await acceptInvitation(req.params.invitationId, req.user.userId);
    logApiSuccess(req, 'team.invitation.accept', { invitationId: req.params.invitationId });
    return res.status(200).json({ message: '초대를 수락했습니다.' });
  } catch (err) {
    logApiError(req, 'team.invitation.accept', err);
    return next(err);
  }
}

export async function declineInvitationController(req, res, next) {
  try {
    logApiRequest(req, 'team.invitation.decline');
    await declineInvitation(req.params.invitationId, req.user.userId);
    logApiSuccess(req, 'team.invitation.decline', { invitationId: req.params.invitationId });
    return res.status(200).json({ message: '초대를 거절했습니다.' });
  } catch (err) {
    logApiError(req, 'team.invitation.decline', err);
    return next(err);
  }
}
