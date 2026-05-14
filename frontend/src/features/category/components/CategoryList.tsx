import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { ROUTES } from '@/shared/constants/routes';
import { useDeleteCategory } from '../hooks/useDeleteCategory';
import type { Category } from '../types/category.types';

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  onEdit: (category: Category) => void;
}

export function CategoryList({ categories, isLoading, onEdit }: CategoryListProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteCategory();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.categoryId, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`${ROUTES.TODOS}?categoryId=${category.categoryId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 px-6 text-neutral-500">
        <span className="material-symbols-outlined text-5xl text-neutral-300">label</span>
        <p className="text-md text-neutral-500">카테고리가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col">
        {categories.map((category) => (
          <li
            key={category.categoryId}
            className="flex items-center gap-3 min-h-14 px-4 py-3 border-b border-neutral-200 hover:bg-neutral-50 transition-colors duration-fast ease-standard"
          >
            {category.color && (
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
            )}
            <button
              type="button"
              className="flex-1 text-left text-base text-neutral-900 cursor-pointer"
              onClick={() => handleCategoryClick(category)}
            >
              {category.name}
            </button>
            <span className="text-sm text-neutral-500">
              {category.ownerType === 'TEAM' ? '팀' : '개인'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(category);
                }}
              >
                <span className="material-symbols-outlined text-[18px] text-danger">delete</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="카테고리 삭제"
      >
        <p className="text-base text-neutral-700 mb-2">
          <strong>"{deleteTarget?.name}"</strong> 카테고리를 삭제하시겠습니까?
        </p>
        <p className="text-base text-neutral-700 mb-6">
          속한 할일의 카테고리가 해제됩니다.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteTarget(null)}
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
    </>
  );
}
