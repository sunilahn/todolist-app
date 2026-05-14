import { useForm } from 'react-hook-form';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { isConflictError } from '@/shared/utils/errorUtils';
import { useCreateInvitation } from '../hooks/useCreateInvitation';
import type { CreateInvitationRequest } from '../types/team.types';

interface InviteMemberFormProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteMemberForm({ teamId, onSuccess, onCancel }: InviteMemberFormProps) {
  const { mutate, isPending } = useCreateInvitation(teamId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateInvitationRequest>({ defaultValues: { role: 'MEMBER' } });

  const onSubmit = (data: CreateInvitationRequest) => {
    mutate(data, {
      onSuccess,
      onError: (err) => {
        if (isConflictError(err)) {
          setError('invitedUserId', { message: '이미 팀에 소속되었거나 초대가 존재합니다.' });
        } else {
          setError('invitedUserId', { message: '초대 중 오류가 발생했습니다.' });
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="사용자 ID"
        error={errors.invitedUserId?.message}
        placeholder="초대할 사용자 ID를 입력하세요"
        {...register('invitedUserId', { required: '사용자 ID를 입력해주세요.' })}
      />
      <div>
        <p className="block text-base text-neutral-700 mb-1">역할</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input type="radio" value="MEMBER" {...register('role')} />
            멤버
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input type="radio" value="VIEWER" {...register('role')} />
            뷰어
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>취소</Button>
        <Button type="submit" variant="primary" loading={isPending}>초대</Button>
      </div>
    </form>
  );
}
