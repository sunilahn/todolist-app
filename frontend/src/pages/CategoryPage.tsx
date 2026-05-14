import { useState } from 'react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { CategoryForm } from '@/features/category/components/CategoryForm';
import { CategoryList } from '@/features/category/components/CategoryList';
import { useCategories } from '@/features/category/hooks/useCategories';
import type { Category } from '@/features/category/types/category.types';

export default function CategoryPage() {
  const { data: categories = [], isLoading } = useCategories();
  const [formModal, setFormModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setEditTarget(category);
    setFormModal(true);
  };

  const handleClose = () => {
    setFormModal(false);
    setEditTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg text-neutral-900">카테고리 관리</h1>
        <Button onClick={() => setFormModal(true)}>카테고리 추가</Button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </div>

      <Modal
        isOpen={formModal}
        onClose={handleClose}
        title={editTarget ? '카테고리 수정' : '카테고리 추가'}
      >
        <CategoryForm
          category={editTarget ?? undefined}
          onSuccess={handleClose}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  );
}
