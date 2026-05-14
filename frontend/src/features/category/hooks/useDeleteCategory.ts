import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '../api/category.api';

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
