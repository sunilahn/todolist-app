import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TeamMemberList } from './TeamMemberList';
import type { TeamMember } from '../types/team.types';

vi.mock('../hooks/useUpdateMemberRole', () => ({
  useUpdateMemberRole: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useKickMember', () => ({
  useKickMember: () => ({ mutate: vi.fn(), isPending: false }),
}));

const members: TeamMember[] = [
  { teamMemberId: 'tm1', teamId: 't1', userId: 'u1', role: 'ADMIN', joinedAt: '2026-01-01T00:00:00Z' },
  { teamMemberId: 'tm2', teamId: 't1', userId: 'u2', role: 'MEMBER', joinedAt: '2026-01-02T00:00:00Z' },
  { teamMemberId: 'tm3', teamId: 't1', userId: 'u3', role: 'VIEWER', joinedAt: '2026-01-03T00:00:00Z' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TeamMemberList', () => {
  it('로딩 중일 때 Spinner가 렌더링된다', () => {
    render(
      <TeamMemberList teamId="t1" members={[]} currentUserId="u1" currentUserRole="ADMIN" isLoading={true} />,
      { wrapper },
    );
    expect(document.querySelector('[aria-label="로딩 중"]')).toBeInTheDocument();
  });

  it('멤버 목록이 렌더링된다', () => {
    render(
      <TeamMemberList teamId="t1" members={members} currentUserId="u1" currentUserRole="ADMIN" isLoading={false} />,
      { wrapper },
    );
    expect(screen.getAllByText(/u[123]/).length).toBeGreaterThanOrEqual(3);
  });

  it('ADMIN 역할일 때 자신이 아닌 멤버에게 역할 변경/추방 버튼이 표시된다', () => {
    render(
      <TeamMemberList teamId="t1" members={members} currentUserId="u1" currentUserRole="ADMIN" isLoading={false} />,
      { wrapper },
    );
    const kickButtons = screen.getAllByRole('button', { name: '추방' });
    expect(kickButtons.length).toBe(2);
  });

  it('ADMIN 역할일 때 자신(u1) 행에는 추방 버튼이 없다', () => {
    render(
      <TeamMemberList teamId="t1" members={members} currentUserId="u1" currentUserRole="ADMIN" isLoading={false} />,
      { wrapper },
    );
    expect(screen.queryAllByRole('button', { name: '추방' }).length).toBe(2);
  });

  it('MEMBER 역할일 때 역할 변경/추방 버튼이 표시되지 않는다', () => {
    render(
      <TeamMemberList teamId="t1" members={members} currentUserId="u2" currentUserRole="MEMBER" isLoading={false} />,
      { wrapper },
    );
    expect(screen.queryByRole('button', { name: '추방' })).not.toBeInTheDocument();
  });

  it('VIEWER 역할일 때 역할 변경/추방 버튼이 표시되지 않는다 (AUTH-005)', () => {
    render(
      <TeamMemberList teamId="t1" members={members} currentUserId="u3" currentUserRole="VIEWER" isLoading={false} />,
      { wrapper },
    );
    expect(screen.queryByRole('button', { name: '추방' })).not.toBeInTheDocument();
  });

  it('역할 배지가 렌더링된다', () => {
    render(
      <TeamMemberList teamId="t1" members={members} currentUserId="u1" currentUserRole="ADMIN" isLoading={false} />,
      { wrapper },
    );
    expect(screen.getByText('관리자')).toBeInTheDocument();
    expect(screen.getByText('멤버')).toBeInTheDocument();
    expect(screen.getByText('뷰어')).toBeInTheDocument();
  });
});
