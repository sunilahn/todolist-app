import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { getErrorMessage, isConflictError } from '@/shared/utils/errorUtils';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import type { Category } from '../types/category.types';

interface CategoryFormValues {
  name: string;
  color: string;
}

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? '',
    },
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: CategoryFormValues) => {
    const color = values.color || undefined;

    if (isEdit && category) {
      updateMutation.mutate(
        {
          id: category.categoryId,
          data: {
            name: values.name,
            color: values.color || null,
          },
        },
        {
          onSuccess: () => onSuccess?.(),
          onError: (error) => {
            if (isConflictError(error)) {
              setError('name', { message: '이미 사용 중인 카테고리명입니다.' });
            } else {
              setError('root', { message: getErrorMessage(error) });
            }
          },
        }
      );
    } else {
      createMutation.mutate(
        { name: values.name, color },
        {
          onSuccess: () => onSuccess?.(),
          onError: (error) => {
            if (isConflictError(error)) {
              setError('name', { message: '이미 사용 중인 카테고리명입니다.' });
            } else {
              setError('root', { message: getErrorMessage(error) });
            }
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="이름 *"
        error={errors.name?.message}
        {...register('name', { required: '이름을 입력해주세요.' })}
      />

      <div>
        <label className="block text-base text-neutral-700 mb-1">색상 (#RRGGBB)</label>
        <input
          type="text"
          placeholder="#RRGGBB"
          className={`w-full h-10 px-3 rounded-md border text-base text-neutral-700 bg-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-[border-color,box-shadow] duration-normal ease-standard ${
            errors.color
              ? 'border-2 border-danger focus:ring-danger-light'
              : 'border-neutral-300'
          }`}
          {...register('color', {
            validate: (value) => {
              if (!value) return true;
              return HEX_REGEX.test(value) || '색상은 #RRGGBB 형식이어야 합니다. (예: #FF5733)';
            },
          })}
        />
        {errors.color && (
          <p className="mt-1 text-sm text-danger">{errors.color.message}</p>
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
