export type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  ADMIN: '관리자',
  MEMBER: '멤버',
  VIEWER: '뷰어',
};

export const ALL_ROLES: TeamRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];
