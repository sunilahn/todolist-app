import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InviteMemberForm } from './InviteMemberForm';

vi.mock('../hooks/useCreateInvitation', () => ({
  useCreateInvitation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('InviteMemberForm', () => {
  it('사용자 ID 필드와 역할 선택이 렌더링된다', () => {
    render(<InviteMemberForm teamId="t1" onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByLabelText(/사용자 ID/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '멤버' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '뷰어' })).toBeInTheDocument();
  });

  it('사용자 ID 미입력 시 유효성 에러가 표시된다', async () => {
    render(<InviteMemberForm teamId="t1" onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '초대' }));
    expect(await screen.findByText('사용자 ID를 입력해주세요.')).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
    const onCancel = vi.fn();
    render(<InviteMemberForm teamId="t1" onSuccess={vi.fn()} onCancel={onCancel} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('기본 역할은 멤버(MEMBER)로 선택된다', () => {
    render(<InviteMemberForm teamId="t1" onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByRole('radio', { name: '멤버' })).toBeChecked();
  });

  it('409 에러 시 "이미 팀에 소속되었거나 초대가 존재합니다." 메시지가 표시된다', async () => {
    const conflictError = { response: { status: 409, data: { code: 'CONFLICT', message: 'Conflict' } } };
    vi.doMock('../hooks/useCreateInvitation', () => ({
      useCreateInvitation: () => ({
        mutate: (_: unknown, { onError }: { onError: (e: unknown) => void }) => onError(conflictError),
        isPending: false,
      }),
    }));

    const { unmount } = render(<InviteMemberForm teamId="t1" onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.type(screen.getByLabelText(/사용자 ID/i), 'some-uuid');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));
    unmount();
  });
});
