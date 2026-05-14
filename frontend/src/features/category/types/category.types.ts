export interface Category {
  categoryId: string;
  ownerId: string;
  ownerType: 'USER' | 'TEAM';
  name: string;
  color: string | null;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  teamId?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string | null;
}
