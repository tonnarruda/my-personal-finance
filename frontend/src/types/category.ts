export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  description: string;
  type: CategoryType;
  color: string;
  icon: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  type: CategoryType;
  color: string;
  icon: string;
  parent_id?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  message?: string;
  error?: string;
  category?: T;
  categories?: T extends Category[] ? Category[] : T extends CategoryWithSubcategories[] ? CategoryWithSubcategories[] : T[];
  subcategories?: Category[];
} 