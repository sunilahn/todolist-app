import api from '@/lib/axios';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types';

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories');
  return data;
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const { data: response } = await api.post<Category>('/categories', data);
  return response;
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const { data: response } = await api.patch<Category>(`/categories/${id}`, data);
  return response;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
