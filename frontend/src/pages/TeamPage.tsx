import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { TeamList } from '@/features/team/components/TeamList';
import { useTeams } from '@/features/team/hooks/useTeams';
import { useCreateTeam } from '@/features/team/hooks/useCreateTeam';
import type { CreateTeamRequest } from '@/features/team/types/team.types';

export default function TeamPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: teams = [], isLoading } = useTeams();
  const { mutate: createTeam, isPending } = useCreateTeam();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTeamRequest>();

  const onSubmit = (data: CreateTeamRequest) => {
    createTeam(data, {
      onSuccess: () => {
        reset();
        setIsCreateOpen(false);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg text-neutral-900">팀 관리</h1>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>+ 팀 생성</Button>
      </div>

      <TeamList
        teams={teams}
        isLoading={isLoading}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); reset(); }} title="팀 생성">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="팀 이름"
            error={errors.name?.message}
            placeholder="팀 이름을 입력하세요"
            {...register('name', { required: '팀 이름을 입력해주세요.' })}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreateOpen(false); reset(); }}>취소</Button>
            <Button type="submit" variant="primary" loading={isPending}>생성</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
