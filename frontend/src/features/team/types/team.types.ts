export type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Team {
  teamId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamMemberId: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
}

export interface Invitation {
  invitationId: string;
  teamId: string;
  invitedUserId: string;
  invitedBy: string;
  role: 'MEMBER' | 'VIEWER';
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
}

export interface CreateTeamRequest { name: string; }
export interface UpdateTeamRequest { name: string; }
export interface CreateInvitationRequest { invitedUserId: string; role: 'MEMBER' | 'VIEWER'; }
export interface UpdateMemberRoleRequest { role: TeamRole; }
