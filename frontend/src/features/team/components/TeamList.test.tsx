import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TeamList } from './TeamList';
import type { Team } from '../types/team.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const teams: Team[] = [
  { teamId: 't1', name: '개발팀', createdBy: 'u1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { teamId: 't2', name: '디자인팀', createdBy: 'u2', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TeamList', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('로딩 중일 때 Spinner가 렌더링된다', () => {
    render(<TeamList teams={[]} isLoading={true} onCreateClick={vi.fn()} />, { wrapper });
    expect(document.querySelector('[aria-label="로딩 중"]')).toBeInTheDocument();
  });

  it('팀이 없을 때 빈 상태 메시지가 표시된다', () => {
    render(<TeamList teams={[]} isLoading={false} onCreateClick={vi.fn()} />, { wrapper });
    expect(screen.getByText('소속된 팀이 없습니다.')).toBeInTheDocument();
  });

  it('빈 상태에서 "팀 생성하기" 버튼 클릭 시 onCreateClick이 호출된다', async () => {
    const onCreateClick = vi.fn();
    render(<TeamList teams={[]} isLoading={false} onCreateClick={onCreateClick} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '팀 생성하기' }));
    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('팀 목록이 렌더링된다', () => {
    render(<TeamList teams={teams} isLoading={false} onCreateClick={vi.fn()} />, { wrapper });
    expect(screen.getByText('개발팀')).toBeInTheDocument();
    expect(screen.getByText('디자인팀')).toBeInTheDocument();
  });

  it('팀 클릭 시 팀 상세 페이지로 navigate한다', async () => {
    render(<TeamList teams={teams} isLoading={false} onCreateClick={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByText('개발팀'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('t1'));
  });
});
