import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import type { TeamMember, TeamRole } from '../types/team.types';
import { useUpdateMemberRole } from '../hooks/useUpdateMemberRole';
import { useKickMember } from '../hooks/useKickMember';

interface TeamMemberListProps {
  teamId: string;
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: TeamRole;
  isLoading: boolean;
}

const ROLE_OPTIONS: TeamRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

export function TeamMemberList({ teamId, members, currentUserId, currentUserRole, isLoading }: TeamMemberListProps) {
  const updateRole = useUpdateMemberRole(teamId);
  const kickMember = useKickMember(teamId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      {members.map((member) => {
        const isMe = member.userId === currentUserId;
        const isAdmin = currentUserRole === 'ADMIN';

        return (
          <div key={member.teamMemberId} className="flex items-center gap-3 min-h-14 px-4 py-3 border-b border-neutral-200 hover:bg-neutral-50 last:border-b-0">
            <span className="flex-1 text-base text-neutral-900">{member.userId}</span>
            <Badge variant={member.role} />
            {isAdmin && !isMe && (
              <div className="flex items-center gap-2">
                <select
                  className="h-8 px-2 text-sm border border-neutral-300 rounded-md text-neutral-700 focus:outline-none focus:border-primary"
                  value={member.role}
                  onChange={(e) =>
                    updateRole.mutate({ userId: member.userId, role: e.target.value as TeamRole })
                  }
                  disabled={updateRole.isPending}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <Button
                  variant="danger-outline"
                  size="sm"
                  loading={kickMember.isPending}
                  onClick={() => kickMember.mutate(member.userId)}
                >
                  추방
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
