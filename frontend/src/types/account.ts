export interface Account {
  id: string;
  name: string;
  currency: string;
  color: string;
  balance: number;
  type: string; // income ou expense
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateAccountRequest {
  currency: string;
  name: string;
  color?: string;
  type: string; // income ou expense
  is_active?: boolean;
  due_date?: string;
  competence_date?: string;
  initial_value?: number;
}

export interface UpdateAccountRequest {
  currency?: string;
  name?: string;
  color?: string;
  type?: string; // income ou expense
  is_active?: boolean;
  user_id?: string;
  due_date?: string;
  competence_date?: string;
  initial_value?: number;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  account?: T;
  accounts?: T[];
} 