import React, { useState, useEffect, useRef } from 'react';
import { TransactionType, CreateTransactionRequest } from '../types/transaction';
import { transactionService, accountService, categoryService } from '../services/api';
import { getUser } from '../services/auth';
import DateInput from './DateInput';
import CurrencyInput from './CurrencyInput';
import Select from './Select';
import CategorySelect from './CategorySelect';
import AccountSelect from './AccountSelect';
import { ThumbsUp, Infinity, Repeat2 } from 'lucide-react';

interface TransactionFormProps {
  typeDefault?: TransactionType;
  onSubmit: (data: CreateTransactionRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  currency?: string;
  id?: string;
  type?: TransactionType;
  description?: string;
  amount?: number;
  due_date?: string;
  competence_date?: string;
  account_id?: string;
  category_id?: string;
  observation?: string;
  repeat_type?: 'none' | 'fixed' | 'parcel';
  repeat_count?: number;
  repeat_period?: 'days' | 'weeks' | 'months' | 'years';
  initialIsPaid?: boolean;
}



const TransactionForm: React.FC<TransactionFormProps> = (props) => {
  const {
    typeDefault = 'expense',
    onSubmit,
    onCancel,
    isLoading = false,
    currency = 'BRL',
    id,
    type,
    description,
    amount,
    due_date,
    competence_date,
    account_id,
    category_id,
    observation,
    repeat_type,
    repeat_count,
    repeat_period,
    initialIsPaid,
  } = props;

  const [form, setForm] = useState<CreateTransactionRequest>({
    type: type || typeDefault,
    description: description || '',
    amount: amount || 0,
    due_date: toDateInputValue(due_date) || getToday(),
    competence_date: toDateInputValue(competence_date) || getToday(),
    account_id: account_id || '',
    category_id: category_id || '',
    is_recurring: false,
    observation: observation || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPaid, setIsPaid] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [repeatType, setRepeatType] = useState<'none' | 'fixed' | 'parcel'>('none');
  const [repeatCount, setRepeatCount] = useState(2);
  const [repeatPeriod, setRepeatPeriod] = useState<'days' | 'weeks' | 'months' | 'years'>('months');
  const periodOptions = [
    { value: 'days', label: 'Dias' },
    { value: 'weeks', label: 'Semanas' },
    { value: 'months', label: 'Meses' },
    { value: 'years', label: 'Anos' },
  ];
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      type: type || typeDefault,
      description: description || '',
      amount: amount || 0,
      due_date: toDateInputValue(due_date) || getToday(),
      competence_date: toDateInputValue(competence_date) || getToday(),
      account_id: account_id || '',
      category_id: category_id || '',
      is_recurring: false,
      observation: observation || '',
    });
    setRepeatType(repeat_type || 'none');
    setRepeatCount(repeat_count || 2);
    setRepeatPeriod(repeat_period || 'months');
    // Só calcular isPaid automaticamente se for criação (sem id)
    if (!id) {
      if (due_date) {
        const shouldBePaid = calculateIsPaid(due_date);
        setIsPaid(shouldBePaid);
      } else {
        setIsPaid(initialIsPaid !== undefined ? initialIsPaid : false);
      }
    } else {
      setIsPaid(initialIsPaid !== undefined ? initialIsPaid : false);
    }
    // Em modo de edição, sempre iniciar toggles como false
    if (id) {
      setIsFixed(false);
      setRepeatType('none');
    }
  }, [id, type, description, amount, due_date, competence_date, account_id, category_id, observation, repeat_type, repeat_count, repeat_period, typeDefault, initialIsPaid]);

  useEffect(() => {
    accountService.getAllAccounts().then(accs => {
      const accountsArray = Array.isArray(accs) ? accs : [];
      setAccounts(accountsArray);
      
      // Verificar se a conta selecionada ainda é válida para a moeda atual
      if (form.account_id) {
        const selectedAccount = accountsArray.find(acc => acc.id === form.account_id);
        if (selectedAccount && selectedAccount.currency !== currency) {
          setForm(prev => ({ ...prev, account_id: '' }));
        }
      }
    });
  }, [currency, form.account_id]);

  useEffect(() => {
    categoryService.getCategoriesWithSubcategories(form.type).then(cats => setCategories(Array.isArray(cats) ? cats : []));
  }, [form.type]);

  // Limpar conta selecionada quando a moeda mudar
  useEffect(() => {
    if (form.account_id) {
      const selectedAccount = accounts.find(acc => acc.id === form.account_id);
      if (selectedAccount && selectedAccount.currency !== currency) {
        setForm(prev => ({ ...prev, account_id: '' }));
      }
    }
  }, [currency, accounts, form.account_id]);

  // Focar no input de descrição quando o modal abrir
  useEffect(() => {
    if (descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, []);

  // Handler para ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleChange = (field: keyof CreateTransactionRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    
    // Se mudou a conta, verificar se ela ainda é válida para a moeda atual
    if (field === 'account_id' && value) {
      const selectedAccount = accounts.find(acc => acc.id === value);
      if (selectedAccount && selectedAccount.currency !== currency) {
        // Se a conta selecionada não corresponde à moeda atual, limpar a seleção
        setForm(prev => ({ ...prev, account_id: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.description.trim()) newErrors.description = 'Descrição obrigatória';
    
    // Na edição (quando há id), permitir valor zero
    if (id) {
      if (form.amount < 0) newErrors.amount = 'Valor não pode ser negativo';
    } else {
      // Na criação, valor deve ser maior que zero
      if (!form.amount || form.amount <= 0) newErrors.amount = 'Valor obrigatório';
    }
    
    if (!form.due_date) newErrors.due_date = 'Data obrigatória';
    if (!form.competence_date) newErrors.competence_date = 'Competência obrigatória';
    if (!form.account_id) newErrors.account_id = 'Conta obrigatória';
    if (!form.category_id) newErrors.category_id = 'Categoria obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Converter datas para o formato ISO completo
  function toISODate(dateStr: string) {
    if (!dateStr) return undefined;
    return dateStr.length === 10 ? `${dateStr}T00:00:00Z` : dateStr;
  }

  // Função para converter data ISO para YYYY-MM-DD
  function toDateInputValue(dateStr: string | undefined) {
    if (!dateStr) return '';
    return dateStr.length > 10 ? dateStr.slice(0, 10) : dateStr;
  }

  // Função para calcular se está pago baseado na data
  const calculateIsPaid = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const transactionDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return transactionDate <= today;
  };

  // Atualizar isPaid quando a data mudar, só em modo criação
  useEffect(() => {
    if (!id && form.due_date) {
      const shouldBePaid = calculateIsPaid(form.due_date);
      setIsPaid(shouldBePaid);
    }
  }, [form.due_date, id]);

  // Função utilitária para pegar a data de hoje no formato YYYY-MM-DD
  function getToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (onSubmit) onSubmit({ ...form, is_paid: isPaid });
    } catch (err) {
      // TODO: feedback de erro
    } finally {
      setSubmitting(false);
    }
  };

  // Função para converter categorias com subcategorias em opções do dropdown
  const getCategoryOptions = () => {
    const options = [];
    
    for (const categoryWithSubs of categories) {
      // Adicionar categoria principal
      options.push({
        value: categoryWithSubs.id,
        label: categoryWithSubs.name,
        isSubcategory: false
      });
      
      // Adicionar subcategorias
      if (categoryWithSubs.subcategories && categoryWithSubs.subcategories.length > 0) {
        for (const subcategory of categoryWithSubs.subcategories) {
          options.push({
            value: subcategory.id,
            label: subcategory.name,
            isSubcategory: true
          });
        }
      }
    }
    
    return options;
  };



  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 md:p-10 relative mx-auto flex flex-col gap-4 md:gap-6" style={{minWidth: 0}}>
      <button type="button" className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-3xl" onClick={onCancel}>
        &times;
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 md:mb-4 text-center">
        {id ? 'Editar transação' : `Nova ${form.type === 'income' ? 'receita' : 'despesa'}`}
      </h2>
      {/* Tipo */}
      <div className="flex gap-2 md:gap-4 mb-2 md:mb-4 justify-center">
        <button type="button" onClick={() => handleChange('type', 'income')} className={`flex-1 px-0 py-2 rounded-xl border text-lg font-semibold transition-all ${form.type === 'income' ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Receita</button>
        <button type="button" onClick={() => handleChange('type', 'expense')} className={`flex-1 px-0 py-2 rounded-xl border text-lg font-semibold transition-all ${form.type === 'expense' ? 'bg-red-50 border-red-400 text-red-600 ring-2 ring-red-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Despesa</button>
      </div>
      {/* Primeira linha: Valor, Data, Competência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Valor */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">Valor</label>
          <CurrencyInput
            value={form.amount}
            onChange={(value) => handleChange('amount', value)}
            currency={currency}
            error={!!errors.amount}
            autoFocus
          />
          {errors.amount && <span className="text-xs text-red-500">{errors.amount}</span>}
        </div>
        {/* Data + Joinha */}
        <div className="relative flex flex-col">
          <label className="block text-base font-medium text-gray-700 mb-1">Data</label>
          <div className="flex items-center gap-2">
            <DateInput
              value={form.due_date}
              onChange={(value) => handleChange('due_date', value)}
              error={!!errors.due_date}
              id="transaction-date"
              submitButtonRef={submitButtonRef}
            />
            <button
              type="button"
              className="ml-1 focus:outline-none hover:scale-110 transition-transform"
              title={isPaid ? 'Pago' : 'Pendente'}
              onClick={() => setIsPaid(!isPaid)}
              tabIndex={0}
            >
              <ThumbsUp 
                size={28}
                className={`${isPaid ? 'text-green-500 fill-green-500' : 'text-gray-300'}`}
                strokeWidth={2.2}
              />
            </button>
          </div>
          {errors.due_date && <span className="text-xs text-red-500">{errors.due_date}</span>}
        </div>
        {/* Competência */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">Competência</label>
          <DateInput
            value={form.competence_date}
            onChange={(value) => handleChange('competence_date', value)}
            error={!!errors.competence_date}
            id="transaction-competence"
            submitButtonRef={submitButtonRef}
          />
          {errors.competence_date && <span className="text-xs text-red-500">{errors.competence_date}</span>}
        </div>
      </div>
      {/* Segunda linha: Descrição, Conta/Cartão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Descrição */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">Descrição</label>
          <input type="text" className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50`} placeholder="Descrição da transação" value={form.description} onChange={e => handleChange('description', e.target.value)} ref={descriptionInputRef} />
          {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
        </div>
        {/* Conta/Cartão */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">Conta/Cartão</label>
          <AccountSelect
            value={form.account_id}
            onChange={(value) => handleChange('account_id', value)}
            options={[
              { value: '', label: 'Selecione um banco' },
              ...accounts
                .filter(acc => acc.currency === currency)
                .map(acc => ({ value: acc.id, label: acc.name }))
            ]}
            error={!!errors.account_id}
          />
          {errors.account_id && <span className="text-xs text-red-500">{errors.account_id}</span>}
        </div>
      </div>
      {/* Terceira linha: Categoria, bloco com Despesa fixa e Repetir */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-end">
        {/* Categoria */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">Categoria</label>
          <CategorySelect
            value={form.category_id}
            onChange={(value) => handleChange('category_id', value)}
            options={[
              { value: '', label: 'Buscar a categoria..' },
              ...getCategoryOptions()
            ]}
            error={!!errors.category_id}
          />
          {errors.category_id && <span className="text-xs text-red-500">{errors.category_id}</span>}
        </div>
        {/* Bloco: Despesa fixa e Repetir */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Infinity size={28} strokeWidth={2.2} className={repeatType === 'fixed' ? 'text-indigo-500' : 'text-gray-300'} />
            <span className="text-gray-700 text-base font-medium">Despesa fixa</span>
            <button
              type="button"
              className={`ml-2 w-10 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${repeatType === 'fixed' ? 'bg-[#f1f3fe]' : 'bg-gray-200'} ${repeatType === 'fixed' ? 'ring-2 ring-indigo-200' : ''} ${id ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !id && setRepeatType(repeatType === 'fixed' ? 'none' : 'fixed')}
              aria-pressed={repeatType === 'fixed'}
              disabled={!!id}
            >
              <span className={`inline-block w-5 h-5 transform rounded-full shadow transition-transform duration-200 ${repeatType === 'fixed' ? 'translate-x-4 bg-[#6366f1]' : 'bg-white'}`}></span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Repeat2 size={28} strokeWidth={2.2} className={repeatType === 'parcel' ? 'text-indigo-500' : 'text-gray-300'} />
            <span className="text-gray-700 text-base font-medium">Repetir</span>
            <button
              type="button"
              className={`ml-2 w-10 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${repeatType === 'parcel' ? 'bg-[#f1f3fe]' : 'bg-gray-200'} ${repeatType === 'parcel' ? 'ring-2 ring-indigo-200' : ''} ${id ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !id && setRepeatType(repeatType === 'parcel' ? 'none' : 'parcel')}
              aria-pressed={repeatType === 'parcel'}
              disabled={!!id}
            >
              <span className={`inline-block w-5 h-5 transform rounded-full shadow transition-transform duration-200 ${repeatType === 'parcel' ? 'translate-x-4 bg-[#6366f1]' : 'bg-white'}`}></span>
            </button>
            {repeatType === 'parcel' && (
              <div className="flex items-center gap-2 ml-6">
                <input
                  type="number"
                  min={2}
                  className="w-14 text-lg text-gray-900 font-medium border-b-2 border-gray-300 focus:border-indigo-400 outline-none bg-transparent text-center"
                  value={repeatCount}
                  onChange={e => !id && setRepeatCount(Number(e.target.value))}
                  disabled={!!id}
                />
                <span className="text-gray-700 text-base font-medium">vezes</span>
                <div className="relative">
                  <select
                    className="appearance-none text-gray-700 text-base font-medium bg-transparent border-b-2 border-gray-300 focus:border-indigo-400 outline-none pr-8"
                    value={repeatPeriod}
                    onChange={e => !id && setRepeatPeriod(e.target.value as any)}
                    disabled={!!id}
                  >
                    {periodOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="text-gray-700 text-base font-medium">{opt.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Observação */}
      <div className="flex flex-col items-center mb-4 md:mb-6">
        <textarea className="w-full mt-2 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-center" rows={2} placeholder="Observação (opcional)" value={form.observation} onChange={e => handleChange('observation', e.target.value)} />
      </div>
      {/* Botão de submit */}
      <div className="flex justify-center mt-4 md:mt-6">
        <button 
          ref={submitButtonRef}
          type="submit" 
          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl shadow-lg hover:bg-green-600 transition disabled:opacity-60" 
          disabled={isLoading || submitting}
        >
          ✓
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;