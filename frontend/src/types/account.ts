export interface Account {
  id: string;
  currency: string;
  name: string;
  color: string;
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
  is_active?: boolean;
}

export interface UpdateAccountRequest {
  currency?: string;
  name?: string;
  color?: string;
  is_active?: boolean;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  account?: T;
  accounts?: T[];
} 