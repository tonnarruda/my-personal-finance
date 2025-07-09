export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: string;
  type: TransactionType;
  description: string;
  amount: number;
  due_date: string;
  competence_date: string;
  account_id: string;
  category_id: string;
  status: 'Pago' | 'Pendente';
  is_recurring?: boolean;
  observation?: string;
  created_at?: string;
  updated_at?: string;
  is_paid?: boolean;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  description: string;
  amount: number;
  due_date: string;
  competence_date: string;
  account_id: string;
  category_id: string;
  is_recurring?: boolean;
  observation?: string;
  is_paid?: boolean;
} 