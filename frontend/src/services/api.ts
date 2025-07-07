import axios from 'axios';
import { getUser } from './auth';
import { 
  Category, 
  CategoryWithSubcategories, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryType,
  ApiResponse 
} from '../types/category';
import {
  Account,
  CreateAccountRequest as CreateAccountRequestType,
  UpdateAccountRequest as UpdateAccountRequestType,
  ApiResponse as AccountApiResponse
} from '../types/account';

const API_BASE_URL = 'http://localhost:8080/api';

// Função para obter o user_id do usuário logado
const getUserId = (): string => {
  const user = getUser();
  if (!user || !user.id) {
    throw new Error('Usuário não autenticado');
  }
  return user.id;
};

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
    //console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    //console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const categoryService = {
  // Criar categoria
  createCategory: async (data: CreateCategoryRequest): Promise<string> => {
    const userId = getUserId();
    const response = await api.post<ApiResponse<void>>(`/categories?user_id=${userId}`, data);
    return response.data.message || 'Categoria criada com sucesso';
  },

  // Buscar todas as categorias
  getAllCategories: async (): Promise<Category[]> => {
    const userId = getUserId();
    const response = await api.get<ApiResponse<Category[]>>(`/categories?user_id=${userId}`);
    return response.data.categories || [];
  },

  // Buscar categorias por tipo
  getCategoriesByType: async (type: CategoryType): Promise<Category[]> => {
    const userId = getUserId();
    const response = await api.get<ApiResponse<Category[]>>(`/categories/by-type?type=${type}&user_id=${userId}`);
    return response.data.categories || [];
  },

  // Buscar categorias com subcategorias
  getCategoriesWithSubcategories: async (type: CategoryType): Promise<CategoryWithSubcategories[]> => {
    const userId = getUserId();
    const response = await api.get<ApiResponse<CategoryWithSubcategories[]>>(`/categories/with-subcategories?type=${type}&user_id=${userId}`);
    return (response.data.categories || []) as CategoryWithSubcategories[];
  },

  // Buscar categoria por ID
  getCategoryById: async (id: string): Promise<Category> => {
    const userId = getUserId();
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}?user_id=${userId}`);
    return response.data.category!;
  },

  // Buscar subcategorias
  getSubcategories: async (parentId: string): Promise<Category[]> => {
    const userId = getUserId();
    const response = await api.get<ApiResponse<Category[]>>(`/categories/${parentId}/subcategories?user_id=${userId}`);
    return response.data.subcategories || [];
  },

  // Atualizar categoria
  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<string> => {
    const userId = getUserId();
    const response = await api.put<ApiResponse<void>>(`/categories/${id}?user_id=${userId}`, data);
    return response.data.message || 'Categoria atualizada com sucesso';
  },

  // Deletar categoria (soft delete)
  deleteCategory: async (id: string): Promise<string> => {
    const userId = getUserId();
    const response = await api.delete<ApiResponse<void>>(`/categories/${id}?user_id=${userId}`);
    return response.data.message || 'Categoria excluída com sucesso';
  },

  // Deletar categoria permanentemente
  hardDeleteCategory: async (id: string): Promise<void> => {
    const userId = getUserId();
    await api.delete(`/categories/${id}/permanent?user_id=${userId}`);
  },
};

export const accountService = {
  // Criar conta
  createAccount: async (data: CreateAccountRequestType): Promise<string> => {
    const userId = getUserId();
    const response = await api.post<AccountApiResponse>(`/accounts?user_id=${userId}`, data);
    return response.data.message || 'Conta criada com sucesso';
  },

  // Buscar todas as contas
  getAllAccounts: async (): Promise<Account[]> => {
    const userId = getUserId();
    const response = await api.get<AccountApiResponse>(`/accounts?user_id=${userId}`);
    return response.data.accounts || [];
  },

  // Buscar conta por ID
  getAccountById: async (id: string): Promise<Account> => {
    const userId = getUserId();
    const response = await api.get<AccountApiResponse>(`/accounts/${id}?user_id=${userId}`);
    return response.data.account!;
  },

  // Atualizar conta
  updateAccount: async (id: string, data: UpdateAccountRequestType): Promise<string> => {
    const userId = getUserId();
    const response = await api.put<AccountApiResponse>(`/accounts/${id}?user_id=${userId}`, data);
    return response.data.message || 'Conta atualizada com sucesso';
  },

  // Deletar conta (soft delete)
  deleteAccount: async (id: string): Promise<string> => {
    const userId = getUserId();
    const response = await api.delete<AccountApiResponse>(`/accounts/${id}?user_id=${userId}`);
    return response.data.message || 'Conta excluída com sucesso';
  },
};

// Função para login
export async function login(email: string, senha: string) {
  const response = await api.post('/login', { email, senha });
  return response.data;
}

// Função para signup
export async function signup(nome: string, email: string, senha: string) {
  const response = await api.post('/signup', { nome, email, senha });
  return response.data;
}

export default api; 