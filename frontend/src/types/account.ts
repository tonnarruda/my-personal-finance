export interface Account {
  id: string;
  currency: string;
  name: string;
  color: string;
  type: string; // income ou expense
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user_id: string;
}

export interface CreateAccountRequest {
  currency: string;
  name: string;
  color?: string;
  type: string; // income ou expense
  is_active?: boolean;
  due_date?: string;
  competence_date?: string;
  initial_value?: number; // Valor inicial da conta em reais
}

export interface UpdateAccountRequest {
  currency?: string;
  name?: string;
  color?: string;
  type?: string; // income ou expense
  is_active?: boolean;
  user_id?: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  account?: T;
  accounts?: T[];
} 