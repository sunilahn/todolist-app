import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { useProfile } from '@/features/user/hooks/useProfile';
import { useUpdateProfile } from '@/features/user/hooks/useUpdateProfile';
import { useDeleteAccount } from '@/features/user/hooks/useDeleteAccount';

interface NameFormValues {
  name: string;
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { updateProfile, isLoading: isUpdating, successMessage, formError } = useUpdateProfile();
  const { deleteAccount, isLoading: isDeleting, error: deleteError, setError: setDeleteError } =
    useDeleteAccount();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormValues>({
    values: profile ? { name: profile.name } : undefined,
  });

  const onSubmit = (data: NameFormValues) => {
    updateProfile({ name: data.name });
  };

  const handleDeleteClick = () => {
    setPassword('');
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteAccount({ password });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg text-neutral-900 mb-6">내 정보</h1>

      <section className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-md text-neutral-900 mb-4">프로필</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="이름"
            error={errors.name?.message}
            {...register('name', { required: '이름을 입력해주세요.' })}
          />
          <div>
            <label className="block text-base text-neutral-700 mb-1">이메일 (변경 불가)</label>
            <input
              value={profile?.email ?? ''}
              readOnly
              aria-readonly="true"
              className="w-full h-10 px-3 rounded-md border border-neutral-200 text-base text-neutral-500 bg-neutral-50 cursor-not-allowed"
            />
          </div>
          {successMessage && <p className="text-sm text-success">{successMessage}</p>}
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Button type="submit" loading={isUpdating}>
            저장
          </Button>
        </form>
      </section>

      <section className="bg-white border border-danger rounded-lg p-6">
        <h2 className="text-md text-neutral-900 mb-2">위험 구역</h2>
        <p className="text-base text-neutral-700 mb-4">
          계정을 탈퇴하면 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <Button variant="danger-outline" onClick={handleDeleteClick}>
          회원 탈퇴
        </Button>
      </section>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="정말 탈퇴하시겠습니까?"
      >
        <div className="space-y-4">
          <p className="text-base text-neutral-700">
            모든 데이터가 즉시 삭제되며 복구할 수 없습니다.
          </p>
          <ul className="text-base text-neutral-700 list-disc list-inside space-y-1">
            <li>모든 개인 할일</li>
            <li>모든 카테고리</li>
            <li>팀 멤버십</li>
          </ul>
          <Input
            label="확인을 위해 비밀번호를 입력하세요"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={deleteError ?? undefined}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              loading={isDeleting}
              disabled={!password}
              onClick={handleDeleteConfirm}
            >
              탈퇴 확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
