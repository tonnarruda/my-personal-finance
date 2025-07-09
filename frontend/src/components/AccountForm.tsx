import React, { useState, useRef, useEffect } from 'react';
import { Account } from '../types/account';
import { Transaction } from '../types/transaction';
import CurrencyInput from './CurrencyInput';
import Select from './Select';
import ElegantSelect from './ElegantSelect';
import DateInput from './DateInput';
import { accountService } from '../services/api';

export interface AccountFormData {
  type: string;
  accountType: 'income' | 'expense'; // Tipo da conta (income/expense)
  currency: string;
  name: string;
  initialDate: string;
  initialValue: number;
  initialBalanceType: 'credit' | 'debit';
  color: string;
  is_active: boolean;
}

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const typeOptions = [
  { value: 'Conta Corrente', label: 'Conta Corrente' },
  { value: 'Conta Poupança', label: 'Conta Poupança' },
  { value: 'Carteira', label: 'Carteira' },
  { value: 'Outro', label: 'Outro' },
];

const accountTypeOptions = [
  { value: 'income', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
];

const currencyOptions = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'Libra (GBP)' },
];

// Paleta igual à de categorias
const PREDEFINED_COLORS = [
  '#22c55e', '#16a34a', '#4ade80', '#166534',
  '#3b82f6', '#2563eb', '#60a5fa', '#1e40af',
  '#ef4444', '#dc2626', '#f87171', '#991b1b',
  '#facc15', '#eab308', '#fde047', '#ca8a04',
  '#a78bfa', '#8b5cf6', '#c4b5fd', '#6d28d9',
  '#fb923c', '#f97316', '#fdba74', '#c2410c',
  '#6b7280', '#9ca3af', '#d1d5db',
  '#f472b6', '#db2777', '#f9a8d4'
];



const AccountForm: React.FC<AccountFormProps> = ({ account, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<AccountFormData>({
    type: 'Conta Corrente',
    accountType: 'income',
    currency: 'BRL',
    name: '',
    initialDate: '',
    initialValue: 0,
    initialBalanceType: 'credit',
    color: PREDEFINED_COLORS[0],
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadAccountData = async () => {
      if (account) {
        // Buscar a transação inicial da conta
        try {
          const initialTransaction = await accountService.getInitialTransaction(account.id);
          
          setFormData({
            type: 'Conta Corrente',
            accountType: (account.type as 'income' | 'expense') || 'income',
            currency: account.currency,
            name: account.name,
            initialDate: initialTransaction ? new Date(initialTransaction.due_date).toISOString().split('T')[0] : '',
            initialValue: initialTransaction ? initialTransaction.amount / 100 : 0, // Converter de centavos para reais
            initialBalanceType: 'credit',
            color: account.color || PREDEFINED_COLORS[0],
            is_active: account.is_active,
          });
        } catch (error) {
          console.error('Erro ao buscar transação inicial:', error);
          // Se não conseguir buscar a transação inicial, usar valores padrão
          setFormData({
            type: 'Conta Corrente',
            accountType: (account.type as 'income' | 'expense') || 'income',
            currency: account.currency,
            name: account.name,
            initialDate: '',
            initialValue: 0,
            initialBalanceType: 'credit',
            color: account.color || PREDEFINED_COLORS[0],
            is_active: account.is_active,
          });
        }
      } else {
        // Reset form when not editing
        setFormData({
          type: 'Conta Corrente',
          accountType: 'income',
          currency: 'BRL',
          name: '',
          initialDate: '',
          initialValue: 0,
          initialBalanceType: 'credit',
          color: PREDEFINED_COLORS[0],
          is_active: true,
        });
      }
    };

    loadAccountData();
  }, [account]);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [account]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome da conta é obrigatório';
    if (!formData.initialDate && !account) newErrors.initialDate = 'Data do saldo inicial é obrigatória';
    if (formData.initialValue === undefined || formData.initialValue === null) newErrors.initialValue = 'Valor do saldo inicial é obrigatório';
    if (!formData.color) newErrors.color = 'Cor é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof AccountFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };



  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{account ? 'Editar Conta' : 'Adicionar Conta'}</h2>
      <p className="text-lg text-gray-500 mb-8">Preencha os dados para {account ? 'editar' : 'adicionar'} uma nova conta bancária.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Tipo de Conta</label>
          <ElegantSelect
            value={formData.type}
            onChange={(value) => handleInputChange('type', value)}
            options={typeOptions}
            disabled={!!account}
          />
        </div>
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Moeda</label>
          <ElegantSelect
            value={formData.currency}
            onChange={(value) => handleInputChange('currency', value)}
            options={currencyOptions}
          />
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-base font-medium text-gray-700 mb-2">Tipo de Operação</label>
        <ElegantSelect
          value={formData.accountType}
          onChange={(value) => handleInputChange('accountType', value)}
          options={accountTypeOptions}
        />
      </div>
      <div className="mb-6">
        <label className="block text-base font-medium text-gray-700 mb-2">Nome da Conta</label>
        <input
          type="text"
          ref={nameInputRef}
          className={`w-full px-4 py-3 rounded-xl border text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
          placeholder="Ex: Conta principal"
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
        />
        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Data do Saldo Inicial</label>
          <DateInput
            value={formData.initialDate}
            onChange={value => handleInputChange('initialDate', value)}
            error={!!errors.initialDate}
          />
          {errors.initialDate && <div className="text-red-500 text-sm mt-1">{errors.initialDate}</div>}
        </div>
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Valor do Saldo Inicial</label>
          <CurrencyInput
            value={formData.initialValue}
            onChange={(value) => handleInputChange('initialValue', value)}
            currency={formData.currency}
            error={!!errors.initialValue}
          />
          {errors.initialValue && <div className="text-red-500 text-sm mt-1">{errors.initialValue}</div>}
        </div>
      </div>
      <div className="mb-8">
        <label className="block text-base font-medium text-gray-700 mb-2">Cor</label>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-10 gap-5 mb-2">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none bg-white
                  ${formData.color === color ? 'ring-2 ring-gray-400 border-gray-400' : 'border-transparent'}`}
                style={{ backgroundColor: color, cursor: 'pointer' }}
                onClick={() => handleInputChange('color', color)}
                aria-label={`Selecionar cor ${color}`}
              >
                {formData.color === color && (
                  <svg className="w-6 h-6" fill="none" stroke="black" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
        {errors.color && <div className="text-red-500 text-sm mt-1">{errors.color}</div>}
      </div>
      {/* Switch de ativação só na edição */}
      {account && (
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="is_active" className="block text-base font-medium text-gray-700">Status:</label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none shadow-sm ${formData.is_active ? 'bg-[#22c55e]' : 'bg-gray-300'}`}
            id="is_active"
          >
            <span
              className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform ${formData.is_active ? 'translate-x-8' : 'translate-x-1'}`}
            />
          </button>
          <span className={`ml-3 text-base font-medium ${formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.is_active ? 'Conta ativa' : 'Conta inativa'}
          </span>
        </div>
      )}
      <button
        type="submit"
        className="w-full py-4 rounded-xl text-lg font-bold bg-[#f1f3fe] text-[#6366f1] shadow hover:bg-indigo-100 transition disabled:opacity-50 mt-2"
        disabled={isLoading}
      >
        {account ? 'Salvar' : 'Adicionar'}
      </button>
      <button
        type="button"
        className="w-full py-4 rounded-xl text-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition mt-3"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancelar
      </button>
    </form>
  );
};

export default AccountForm; 