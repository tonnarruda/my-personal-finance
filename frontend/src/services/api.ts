import axios from 'axios';
import { 
  Category, 
  CategoryWithSubcategories, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryType,
  ApiResponse 
} from '../types/category';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para logs de debug
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const categoryService = {
  // Criar categoria
  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data.category!;
  },

  // Buscar todas as categorias
  getAllCategories: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.categories || [];
  },

  // Buscar categorias por tipo
  getCategoriesByType: async (type: CategoryType): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>(`/categories/by-type?type=${type}`);
    return response.data.categories || [];
  },

  // Buscar categorias com subcategorias
  getCategoriesWithSubcategories: async (type: CategoryType): Promise<CategoryWithSubcategories[]> => {
    const response = await api.get<ApiResponse<CategoryWithSubcategories[]>>(`/categories/with-subcategories?type=${type}`);
    return (response.data.categories || []) as CategoryWithSubcategories[];
  },

  // Buscar categoria por ID
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.category!;
  },

  // Buscar subcategorias
  getSubcategories: async (parentId: string): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>(`/categories/${parentId}/subcategories`);
    return response.data.subcategories || [];
  },

  // Atualizar categoria
  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.category!;
  },

  // Deletar categoria (soft delete)
  deleteCategory: async (id: string): Promise<string> => {
    const response = await api.delete<ApiResponse<void>>(`/categories/${id}`);
    return response.data.message || 'Categoria excluída com sucesso';
  },

  // Deletar categoria permanentemente
  hardDeleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}/permanent`);
  },
};

export default api; 