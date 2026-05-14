import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { TeamMemberList } from '@/features/team/components/TeamMemberList';
import { InviteMemberForm } from '@/features/team/components/InviteMemberForm';
import { useTeam } from '@/features/team/hooks/useTeam';
import { useTeamMembers } from '@/features/team/hooks/useTeamMembers';
import { useDeleteTeam } from '@/features/team/hooks/useDeleteTeam';
import { useLeaveTeam } from '@/features/team/hooks/useLeaveTeam';
import { useProfile } from '@/features/user/hooks/useProfile';
import type { UpdateTeamRequest } from '@/features/team/types/team.types';
import api from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';

export default function TeamDetailPage() {
  const { id: teamId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(teamId);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutate: deleteTeam, isPending: isDeleting } = useDeleteTeam();
  const { mutate: leaveTeam, isPending: isLeaving } = useLeaveTeam();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateTeamRequest>();

  const myMember = profile ? members.find((m) => m.userId === profile.userId) : undefined;
  const currentUserRole = myMember?.role ?? 'VIEWER';
  const isAdmin = currentUserRole === 'ADMIN';

  const onEditSubmit = async (data: UpdateTeamRequest) => {
    await api.patch(`/teams/${teamId}`, data);
    queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
    setIsEditOpen(false);
    reset();
  };

  if (teamLoading || profileLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return <div className="flex justify-center py-16 text-neutral-500">팀을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg text-neutral-900">{team.name}</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="secondary" size="sm" onClick={() => { reset({ name: team.name }); setIsEditOpen(true); }}>
              팀 이름 수정
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
              팀 삭제
            </Button>
          )}
          {!isAdmin && (
            <Button variant="danger-outline" size="sm" onClick={() => setIsLeaveOpen(true)}>
              팀 탈퇴
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/todos?teamId=${teamId}`)}>
          팀 할일 보기
        </Button>
        {(isAdmin || currentUserRole === 'MEMBER') && (
          <Button variant="secondary" size="sm" onClick={() => navigate(`/todos/new?teamId=${teamId}`)}>
            + 팀 할일 추가
          </Button>
        )}
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
            팀원 초대
          </Button>
        )}
      </div>

      <h2 className="text-base text-neutral-700 mb-3">팀원 목록</h2>
      <TeamMemberList
        teamId={teamId}
        members={members}
        currentUserId={profile?.userId ?? ''}
        currentUserRole={currentUserRole}
        isLoading={membersLoading}
      />

      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); reset(); }} title="팀 이름 수정">
        <form onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
          <Input
            label="팀 이름"
            error={errors.name?.message}
            {...register('name', { required: '팀 이름을 입력해주세요.' })}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setIsEditOpen(false); reset(); }}>취소</Button>
            <Button type="submit" variant="primary">수정</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="팀 삭제">
        <p className="text-base text-neutral-700 mb-6">
          팀을 삭제하면 모든 할일과 카테고리가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(false)}>취소</Button>
          <Button
            variant="danger"
            loading={isDeleting}
            onClick={() => deleteTeam(teamId)}
          >
            삭제
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isLeaveOpen} onClose={() => setIsLeaveOpen(false)} title="팀 탈퇴">
        <p className="text-base text-neutral-700 mb-6">
          팀을 탈퇴하시겠습니까? 팀 탈퇴 후에는 팀 할일에 접근할 수 없습니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsLeaveOpen(false)}>취소</Button>
          <Button
            variant="danger-outline"
            loading={isLeaving}
            onClick={() => leaveTeam(teamId)}
          >
            탈퇴
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="팀원 초대">
        <InviteMemberForm
          teamId={teamId}
          onSuccess={() => setIsInviteOpen(false)}
          onCancel={() => setIsInviteOpen(false)}
        />
      </Modal>
    </div>
  );
}
