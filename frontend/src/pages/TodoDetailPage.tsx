import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { TodoForm } from '@/features/todo/components/TodoForm';
import { TodoStatusSelect } from '@/features/todo/components/TodoStatusSelect';
import { useTodo } from '@/features/todo/hooks/useTodo';
import { useDeleteTodo } from '@/features/todo/hooks/useDeleteTodo';
import { useUpdateTodoStatus } from '@/features/todo/hooks/useUpdateTodo';
import { ROUTES } from '@/shared/constants/routes';

export default function TodoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const isNew = id === 'new';

  const { data: todo, isLoading } = useTodo(isNew ? '' : (id ?? ''));
  const deleteMutation = useDeleteTodo();
  const statusMutation = useUpdateTodoStatus();

  const handleSuccess = () => {
    navigate(ROUTES.TODOS);
  };

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => navigate(ROUTES.TODOS),
    });
  };

  const handleStatusChange = (status: Parameters<typeof statusMutation.mutate>[0]['status']) => {
    if (!id) return;
    statusMutation.mutate({ id, status });
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isNew && !todo) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-md text-neutral-500">할일을 찾을 수 없습니다.</p>
        <Button variant="secondary" onClick={() => navigate(ROUTES.TODOS)}>
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[640px]">
      <div className="flex items-center justify-between">
        <h1 className="text-lg text-neutral-900">
          {isNew ? '할일 추가' : '할일 편집'}
        </h1>
        <Button variant="ghost" onClick={() => navigate(ROUTES.TODOS)}>
          목록으로
        </Button>
      </div>

      {!isNew && todo && (
        <div className="flex items-center gap-3">
          <span className="text-base text-neutral-700">상태</span>
          <TodoStatusSelect
            currentStatus={todo.status}
            onChange={handleStatusChange}
            loading={statusMutation.isPending}
          />
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
        <TodoForm
          todo={isNew ? undefined : todo}
          onSuccess={handleSuccess}
          onCancel={() => navigate(ROUTES.TODOS)}
        />
      </div>

      {!isNew && (
        <div className="flex justify-end">
          <Button
            variant="danger-outline"
            onClick={() => setDeleteModalOpen(true)}
          >
            삭제
          </Button>
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="할일 삭제"
      >
        <p className="text-base text-neutral-700 mb-6">
          이 할일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteMutation.isPending}
          >
            취소
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            삭제
          </Button>
        </div>
      </Modal>
    </div>
  );
}
