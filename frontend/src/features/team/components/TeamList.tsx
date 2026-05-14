import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { ROUTES } from '@/shared/constants/routes';
import type { Team } from '../types/team.types';

interface TeamListProps {
  teams: Team[];
  isLoading: boolean;
  onCreateClick: () => void;
}

export function TeamList({ teams, isLoading, onCreateClick }: TeamListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 px-6 text-neutral-500">
        <p className="text-md text-neutral-500">소속된 팀이 없습니다.</p>
        <Button variant="primary" onClick={onCreateClick}>팀 생성하기</Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      {teams.map((team) => (
        <div
          key={team.teamId}
          className="flex items-center gap-3 min-h-14 px-4 py-3 border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer last:border-b-0"
          onClick={() => navigate(ROUTES.TEAM_DETAIL(team.teamId))}
        >
          <span className="flex-1 text-base text-neutral-900">{team.name}</span>
          <span className="text-sm text-primary">관리하기 &gt;</span>
        </div>
      ))}
    </div>
  );
}
