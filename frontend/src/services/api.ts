import axios from 'axios';
import { getUser, getAuthToken, clearAuth } from './auth';
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
import { Transaction, CreateTransactionRequest } from '../types/transaction';
import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.BASE_URL;

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
    // Verifica se o usuário está autenticado para rotas protegidas
    const user = getUser();
    const token = getAuthToken();
    
    console.log(`[API] Requisição para: ${config.url}`);
    console.log(`[API] User: ${user ? 'presente' : 'ausente'}`);
    console.log(`[API] Token: ${token ? 'presente' : 'ausente'}`);
    
    // Não bloqueia requisições de login/signup
    if (config.url?.includes('/login') || config.url?.includes('/signup')) {
      console.log(`[API] Permitindo requisição de auth: ${config.url}`);
      return config;
    }
    
    // Para outras requisições, verifica se está autenticado
    if (!user || !token) {
      console.log('[API] Usuário não autenticado, redirecionando para login');
      window.location.href = '/login';
      return Promise.reject(new Error('Usuário não autenticado'));
    }
    
    // Adiciona o token no header Authorization se existir
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] Token adicionado ao header para: ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('[API-RESPONSE] Resposta recebida:', response.config.url, response.status);
    console.log('[API-RESPONSE] Data:', response.data);
    return response;
  },
  (error) => {
    console.error('[API-RESPONSE] Erro:', error.config?.url, error.response?.status);
    if (error.response && error.response.status === 401) {
      // Limpa o estado do usuário (logout)
      clearAuth();
      // Redireciona para login
      window.location.href = '/login';
    }
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
    const payload = { ...data, user_id: userId };
    const response = await api.put<ApiResponse<void>>(`/categories/${id}?user_id=${userId}`, payload);
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
    const payload = {
      ...data,
      user_id: userId,
      due_date: data.due_date,
      competence_date: data.competence_date,
      initial_value: data.initial_value
    };
    const response = await api.put<AccountApiResponse>(`/accounts/${id}?user_id=${userId}`, payload);
    return response.data.message || 'Conta atualizada com sucesso';
  },

  // Deletar conta (soft delete)
  deleteAccount: async (id: string): Promise<string> => {
    const userId = getUserId();
    const response = await api.delete<AccountApiResponse>(`/accounts/${id}?user_id=${userId}`);
    return response.data.message || 'Conta excluída com sucesso';
  },

  // Buscar transação inicial de uma conta
  getInitialTransaction: async (accountId: string): Promise<Transaction | null> => {
    const userId = getUserId();
    try {
      const response = await api.get<{ transaction: Transaction }>(`/accounts/${accountId}/initial-transaction?user_id=${userId}`);
      return response.data.transaction || null;
    } catch (error) {
      // Se não encontrar a transação inicial, retorna null
      return null;
    }
  },
};

export const transactionService = {
  // Criar transação
  createTransaction: async (data: any): Promise<Transaction> => {
    const userId = getUserId();
    console.log('DEBUG API - createTransaction:', {
      userId,
      data,
      url: `/transactions?user_id=${userId}`
    });
    const response = await api.post<Transaction>(`/transactions?user_id=${userId}`, data);
    return response.data;
  },

  // Buscar todas as transações
  getAllTransactions: async (): Promise<Transaction[]> => {
    const userId = getUserId();
    const response = await api.get<Transaction[]>(`/transactions?user_id=${userId}`);
    return response.data;
  },

  // Buscar transação por ID
  getTransactionById: async (id: string): Promise<Transaction> => {
    const userId = getUserId();
    const response = await api.get<Transaction>(`/transactions/${id}?user_id=${userId}`);
    return response.data;
  },

  // Atualizar transação
  updateTransaction: async (id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> => {
    const userId = getUserId();
    const payload = {
      ...data,
      user_id: userId
    };
    const response = await api.put<Transaction>(`/transactions/${id}?user_id=${userId}`, payload);
    return response.data;
  },

  // Deletar transação
  deleteTransaction: async (id: string): Promise<void> => {
    const userId = getUserId();
    await api.delete(`/transactions/${id}?user_id=${userId}`);
  },
};

// Serviço de câmbio
export const exchangeService = {
  // Obter taxa de câmbio com conversão de valor
  getExchangeRate: async (fromCurrency: string, toCurrency: string, amount: number) => {
    const response = await api.post('/exchange/rate', {
      from_currency: fromCurrency,
      to_currency: toCurrency,
      amount: amount
    });
    return response.data;
  },

  // Obter apenas a taxa de câmbio
  getExchangeRateSimple: async (fromCurrency: string, toCurrency: string) => {
    const response = await api.get(`/exchange/rate/simple?from=${fromCurrency}&to=${toCurrency}`);
    return response.data;
  },
};

// Função para login
export async function login(email: string, senha: string) {
  console.log('[LOGIN-API] Iniciando login para:', email);
  console.log('[LOGIN-API] URL da API:', API_BASE_URL);
  
  try {
    const response = await api.post('/login', { email, senha });
    console.log('[LOGIN-API] Resposta completa:', response);
    console.log('[LOGIN-API] Resposta recebida:', response.data);
    console.log('[LOGIN-API] Headers:', response.headers);
    return response.data;
  } catch (error: any) {
    console.error('[LOGIN-API] Erro na requisição:', error);
    console.error('[LOGIN-API] Status:', error.response?.status);
    console.error('[LOGIN-API] Data:', error.response?.data);
    throw error;
  }
}

// Função para signup
export async function signup(nome: string, email: string, senha: string) {
  const response = await api.post('/signup', { nome, email, senha });
  return response.data;
}

// Função para logout
export async function logout() {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  } finally {
    // Sempre limpa o localStorage e redireciona
    clearAuth();
    window.location.href = '/login';
  }
}

// Função utilitária para buscar ou criar categoria por nome e tipo
export async function getOrCreateCategoryByName(name: string, type: CategoryType): Promise<Category> {
  const all = await categoryService.getCategoriesByType(type);
  let found = all.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  if (found) return found;
  // Cria categoria padrão se não existir
  const userId = getUserId();
  const newCat: CreateCategoryRequest = {
    name,
    description: name,
    type,
    color: '#22c55e',
    icon: '💰',
    user_id: userId, // <-- Adiciona user_id aqui
  } as any;
  await categoryService.createCategory(newCat);
  // Buscar novamente para garantir que temos o id
  const allAfter = await categoryService.getCategoriesByType(type);
  found = allAfter.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  if (!found) throw new Error('Falha ao criar categoria de saldo inicial');
  return found;
}

export default api; 