import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/shared/utils/errorUtils';
import { ALL_STATUSES, TODO_STATUS_LABELS } from '@/shared/constants/todoStatus';
import { useCategories } from '@/features/category/hooks/useCategories';
import { useCreateTodo } from '../hooks/useCreateTodo';
import { useUpdateTodo } from '../hooks/useUpdateTodo';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/todo.types';
import type { TodoStatus } from '@/shared/constants/todoStatus';

interface TodoFormValues {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: TodoStatus;
  categoryId: string;
}

interface TodoFormProps {
  todo?: Todo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

export function TodoForm({ todo, onSuccess, onCancel }: TodoFormProps) {
  const isEdit = !!todo;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<TodoFormValues>({
    defaultValues: {
      title: todo?.title ?? '',
      description: todo?.description ?? '',
      startDate: toDateInputValue(todo?.startDate),
      dueDate: toDateInputValue(todo?.dueDate),
      status: todo?.status ?? 'PLANNED',
      categoryId: todo?.categoryId ?? '',
    },
  });

  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const startDate = watch('startDate');

  const onSubmit = (values: TodoFormValues) => {
    if (isEdit && todo) {
      const data: UpdateTodoRequest = {
        title: values.title,
        description: values.description || undefined,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        categoryId: values.categoryId || null,
      };
      updateMutation.mutate(
        { id: todo.todoId, data },
        {
          onSuccess: () => onSuccess?.(),
          onError: (error) => {
            setError('root', { message: getErrorMessage(error) });
          },
        }
      );
    } else {
      const data: CreateTodoRequest = {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        categoryId: values.categoryId || undefined,
      };
      createMutation.mutate(data, {
        onSuccess: () => onSuccess?.(),
        onError: (error) => {
          setError('root', { message: getErrorMessage(error) });
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="제목 *"
        error={errors.title?.message}
        {...register('title', { required: '제목을 입력해주세요.' })}
      />

      <div>
        <label className="block text-base text-neutral-700 mb-1">설명</label>
        <textarea
          {...register('description')}
          className="w-full min-h-24 px-3 py-2 rounded-md border border-neutral-300 text-base text-neutral-700 bg-white placeholder:text-neutral-500 resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-[border-color,box-shadow] duration-normal ease-standard"
          placeholder="설명을 입력하세요"
        />
      </div>

      {!isEdit && (
        <div>
          <label className="block text-base text-neutral-700 mb-1">상태</label>
          <select
            {...register('status')}
            className="w-full h-10 pl-3 pr-9 rounded-md border border-neutral-300 text-base text-neutral-700 bg-white appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-[border-color,box-shadow] duration-normal ease-standard cursor-pointer"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TODO_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        label="시작일"
        type="date"
        {...register('startDate')}
      />

      <Input
        label="마감일"
        type="date"
        error={errors.dueDate?.message}
        {...register('dueDate', {
          validate: (value) => {
            if (value && startDate && value < startDate) {
              return '마감일은 시작일 이상이어야 합니다.';
            }
            return true;
          },
        })}
      />

      <div>
        <label className="block text-base text-neutral-700 mb-1">카테고리</label>
        {isCategoriesLoading ? (
          <Spinner size="sm" />
        ) : (
          <select
            {...register('categoryId')}
            className="w-full h-10 pl-3 pr-9 rounded-md border border-neutral-300 text-base text-neutral-700 bg-white appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-[border-color,box-shadow] duration-normal ease-standard cursor-pointer"
          >
            <option value="">선택 안함</option>
            {categories?.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.color ? `${category.name} (${category.ownerType === 'TEAM' ? '팀' : '개인'})` : category.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {errors.root && (
        <p className="text-sm text-danger">{errors.root.message}</p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          {isEdit ? '저장' : '추가'}
        </Button>
      </div>
    </form>
  );
}
