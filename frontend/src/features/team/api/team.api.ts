import api from '@/lib/axios';
import type { Team, TeamMember, Invitation, CreateTeamRequest, UpdateTeamRequest, CreateInvitationRequest, UpdateMemberRoleRequest } from '../types/team.types';

export async function getTeams(): Promise<Team[]> {
  const res = await api.get('/teams');
  return res.data;
}

export async function getTeam(teamId: string): Promise<Team> {
  const res = await api.get(`/teams/${teamId}`);
  return res.data;
}

export async function createTeam(data: CreateTeamRequest): Promise<Team> {
  const res = await api.post('/teams', data);
  return res.data;
}

export async function updateTeam(teamId: string, data: UpdateTeamRequest): Promise<Team> {
  const res = await api.patch(`/teams/${teamId}`, data);
  return res.data;
}

export async function deleteTeam(teamId: string): Promise<void> {
  await api.delete(`/teams/${teamId}`);
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const res = await api.get(`/teams/${teamId}/members`);
  return res.data;
}

export async function updateMemberRole(teamId: string, userId: string, data: UpdateMemberRoleRequest): Promise<TeamMember> {
  const res = await api.patch(`/teams/${teamId}/members/${userId}/role`, data);
  return res.data;
}

export async function leaveTeam(teamId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/me`);
}

export async function kickMember(teamId: string, userId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`);
}

export async function createInvitation(teamId: string, data: CreateInvitationRequest): Promise<Invitation> {
  const res = await api.post(`/teams/${teamId}/invitations`, data);
  return res.data;
}

export async function getInvitations(teamId: string): Promise<Invitation[]> {
  const res = await api.get(`/teams/${teamId}/invitations`);
  return res.data;
}

export async function acceptInvitation(invitationId: string): Promise<{ message: string }> {
  const res = await api.patch(`/invitations/${invitationId}/accept`);
  return res.data;
}

export async function declineInvitation(invitationId: string): Promise<{ message: string }> {
  const res = await api.patch(`/invitations/${invitationId}/decline`);
  return res.data;
}
