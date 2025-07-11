import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TransactionForm from '../components/TransactionForm';
import Select from '../components/Select';
import CategorySelect from '../components/CategorySelect';
import DateInput from '../components/DateInput';
import { accountService, transactionService, categoryService } from '../services/api';
import { Transaction } from '../types/transaction';
import { getUser } from '../services/auth';
import { useToast } from '../contexts/ToastContext';
import { useSidebar } from '../contexts/SidebarContext';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função para gerar cor RGBA a partir do hex e opacidade
function hexToRgba(hex: string, alpha: number) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const TransactionsPage: React.FC = () => {
  // Garanta que o valor inicial dos filtros seja ''
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const today = new Date();
  const [selectedMonthYear, setSelectedMonthYear] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { showSuccess, showError } = useToast();
  
  // Estados para o menu flutuante
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchData();
  }, []);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMonthDropdown && !(event.target as Element).closest('.relative')) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);

  const normalizeTransaction = (t: any) => ({
    ...t,
    amount: typeof t.amount === 'number' ? t.amount / 100 : 0,
    account_id: t.account_id,
    category_id: t.category_id,
    initialIsPaid: t.is_paid,
    transfer_id: t.transfer_id,
  });

  // Função para detectar se uma transação é uma transferência
  const isTransferTransaction = (transaction: Transaction): boolean => {
    return transaction.transfer_id !== undefined && transaction.transfer_id !== null && transaction.transfer_id !== '';
  };

  // Função para obter o nome da categoria, tratando transferências
  const getCategoryDisplayName = (transaction: Transaction): string => {
    if (isTransferTransaction(transaction)) {
      return 'Transferência';
    }
    const cat = categories.find(c => c.id === transaction.category_id);
    return cat?.name || '-';
  };

  // Função para obter a cor da categoria, tratando transferências
  const getCategoryColor = (transaction: Transaction): string => {
    if (isTransferTransaction(transaction)) {
      return '#6B7280'; // Cor cinza para transferências
    }
    const cat = categories.find(c => c.id === transaction.category_id);
    return cat?.color || '#a7f3d0';
  };

  const fetchData = async () => {
    try {
      const [accs, txs, incomeCategories, expenseCategories] = await Promise.all([
        accountService.getAllAccounts(),
        transactionService.getAllTransactions(),
        categoryService.getCategoriesWithSubcategories('income'),
        categoryService.getCategoriesWithSubcategories('expense'),
      ]);
      setAccounts(Array.isArray(accs) ? accs : []);
      setTransactions(Array.isArray(txs) ? txs.map(normalizeTransaction) : []);
      
      // Combinar todas as categorias (principais e subcategorias) em uma lista plana
      const allCategories: any[] = [];
      const incomeList = Array.isArray(incomeCategories) ? incomeCategories : [];
      const expenseList = Array.isArray(expenseCategories) ? expenseCategories : [];
      
      [...incomeList, ...expenseList].forEach(categoryWithSubs => {
        allCategories.push(categoryWithSubs);
        if (categoryWithSubs.subcategories) {
          allCategories.push(...categoryWithSubs.subcategories);
        }
      });
      
      setCategories(allCategories);
    } catch (err) {
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
    }
  };

  // Agrupar contas por currency
  const accountsByCurrency: { [currency: string]: any[] } = {};
  accounts.forEach(acc => {
    if (!accountsByCurrency[acc.currency]) accountsByCurrency[acc.currency] = [];
    accountsByCurrency[acc.currency].push(acc);
  });
  const currencies = Object.keys(accountsByCurrency);

  function extractMonthYear(dateStr: string | undefined) {
    if (!dateStr) return { month: 0, year: 0 };
    // Tenta formato YYYY-MM-DD
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month] = match;
      return { month: Number(month), year: Number(year) };
    }
    // Fallback para objeto Date
    const d = parseDateString(dateStr);
    if (!d) return { month: 0, year: 0 };
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }

  // Função utilitária para parsear datas em formato ISO ou SQL
  function parseDateString(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    // Tenta ISO primeiro
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    // Tenta formato SQL (YYYY-MM-DD HH:MM:SS)
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      // Cria a data como local (ano, mês-1, dia)
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return null;
  }

  // Função para verificar se uma transação pertence a uma categoria ou suas subcategorias
  function transactionMatchesCategory(transaction: Transaction, selectedCategoryId: string) {
    if (!selectedCategoryId) return true; // Se nenhuma categoria selecionada, mostra todas
    
    // Verifica correspondência direta
    if (transaction.category_id === selectedCategoryId) return true;
    
    // Verifica se a categoria da transação é subcategoria da categoria selecionada
    const transactionCategory = categories.find(cat => cat.id === transaction.category_id);
    if (transactionCategory && transactionCategory.parent_id === selectedCategoryId) {
      return true;
    }
    
    return false;
  }

  // Aplique os filtros nas transações:
  const transactionsForCurrency = transactions.filter(t => {
    const acc = accounts.find(a => a.id === t.account_id);
    const { month, year } = extractMonthYear(t.competence_date);
    const bankMatch = selectedBank === '' || t.account_id === selectedBank;
    const categoryMatch = transactionMatchesCategory(t, selectedCategory);
    
    // Filtro por range de data personalizado
    if (isCustomDateRange && customStartDate && customEndDate) {
      const competenceDate = parseDateString(t.competence_date);
      const startDate = parseDateString(customStartDate);
      const endDate = parseDateString(customEndDate);
      
      if (competenceDate && startDate && endDate) {
        const dateMatch = competenceDate >= startDate && competenceDate <= endDate;
        return acc && acc.currency === selectedCurrency && bankMatch && categoryMatch && dateMatch;
      }
    }
    
    return (
      acc &&
      acc.currency === selectedCurrency &&
      month === selectedMonthYear.month &&
      year === selectedMonthYear.year &&
      bankMatch &&
      categoryMatch
    );
  });

  // Ordenar transações da competência selecionada pela data de lançamento (due_date)
  const transactionsForCurrencySorted = [...transactionsForCurrency].sort((a, b) => {
    const da = parseDateString(a.due_date);
    const db = parseDateString(b.due_date);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  // Encontre a menor data de lançamento do período selecionado
  const datasDoMes = transactionsForCurrencySorted.map(t => parseDateString(t.due_date)).filter(Boolean);
  const primeiraDataDoMes = datasDoMes.length > 0 ? new Date(Math.min(...datasDoMes.map(d => d!.getTime()))) : null;



  const handleOpenForm = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };
  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowForm(true);
  };
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };
  // Função utilitária para converter objeto para snake_case e mapear campos para o backend
  function toBackendPayload(obj: any) {
    return {
      user_id: getUser()?.id,
      description: obj.description,
      amount: Math.round(obj.amount * 100),
      type: obj.type,
      category_id: obj.category_id,
      account_id: obj.account_id,
      due_date: obj.due_date ? formatDateToISO(obj.due_date) : undefined,
      competence_date: obj.competence_date ? formatDateToISO(obj.competence_date) : undefined,
      is_paid: typeof obj.is_paid === 'boolean' ? obj.is_paid : false,
      observation: obj.observation,
      is_recurring: !!obj.is_recurring,
      recurring_type: obj.recurring_type,
      installments: obj.installments,
      current_installment: obj.current_installment,
      parent_transaction_id: obj.parent_transaction_id,
    };
  }

  // Função para formatar data para ISO com timezone
  function formatDateToISO(dateStr: string): string {
    if (!dateStr) return '';
    
    // Se já está no formato ISO completo, retorna como está
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      return dateStr;
    }
    
    // Se está no formato YYYY-MM-DD, adiciona T00:00:00Z
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return `${dateStr}T00:00:00Z`;
    }
    
    // Para outros formatos, converte para Date e depois para ISO
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Formata para YYYY-MM-DDTHH:mm:ss.sssZ
    return date.toISOString();
  }

  const handleSubmitForm = async (data: any) => {
    try {
      const payload = toBackendPayload(data);
      if (editingTransaction && editingTransaction.id) {
        await transactionService.updateTransaction(editingTransaction.id, payload);
        showSuccess('Transação atualizada com sucesso!');
      } else {
        await transactionService.createTransaction(payload);
        showSuccess('Transação criada com sucesso!');
      }
      setShowForm(false);
      setEditingTransaction(null);
      fetchData();
    } catch (err) {
      showError('Erro ao salvar transação.');
    }
  };
  const handleDelete = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) setTransactionToDelete(tx);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await transactionService.deleteTransaction(transactionToDelete.id!);
      showSuccess('Transação excluída com sucesso!');
      setTransactionToDelete(null);
      fetchData();
    } catch {
      showError('Erro ao excluir transação.');
    }
  };

  const cancelDeleteTransaction = () => setTransactionToDelete(null);

  function formatDateBR(dateStr: string | undefined) {
    const d = parseDateString(dateStr);
    if (!d) return '-';
  
    // Se vier no formato YYYY-MM-DD, extrai direto
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
    }
  
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatCompetenceBR(dateStr: string | undefined) {
    const d = parseDateString(dateStr);
    if (!d) return '-';
    // Se vier no formato YYYY-MM-DD, extrai direto
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [_unused, year, month] = dateStr.match(/^(\d{4})-(\d{2})-/) || [];
      if (year && month) return `${month}/${year}`;
    }
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Função para avançar mês
  const handleNextMonth = () => {
    setIsCustomDateRange(false);
    setSelectedMonthYear(prev => {
      let month = prev.month + 1;
      let year = prev.year;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      return { month, year };
    });
  };
  // Função para retroceder mês
  const handlePrevMonth = () => {
    setIsCustomDateRange(false);
    setSelectedMonthYear(prev => {
      let month = prev.month - 1;
      let year = prev.year;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { month, year };
    });
  };

  // Agrupar transações por data de lançamento (date)
  const groupedByDate = transactionsForCurrencySorted.reduce((acc, t) => {
    const dateKey = formatDateBR(t.due_date); // ex: '05/07/2025'
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, typeof transactionsForCurrencySorted>);

  // Ordenar as datas
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const da = parseDateString(a);
    const db = parseDateString(b);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  // Calcular saldo do dia para cada grupo
  function getSaldoDoDia(transactions: typeof transactionsForCurrencySorted) {
    return transactions.reduce((acc, t) => {
      if (t.is_paid) {
        return acc + (t.type === 'income' ? t.amount : -t.amount);
      }
      return acc;
    }, 0);
  }

  // Saldo anterior: acumulado até o período anterior ao selecionado
  // Usar apenas as transações que passaram pelos filtros (moeda, banco, categoria)
  // Para visualização por competência, considerar transações com competence_date anterior ao período
  const transacoesParaSaldoAnterior = transactions.filter(t => {
    const acc = accounts.find(a => a.id === t.account_id);
    const bankMatch = selectedBank === '' || t.account_id === selectedBank;
    const categoryMatch = transactionMatchesCategory(t, selectedCategory);
    const competence = parseDateString(t.competence_date);
    
    // Para range personalizado, usar a data inicial do range como referência
    let periodoInicio: Date | null = null;
    if (isCustomDateRange && customStartDate) {
      periodoInicio = parseDateString(customStartDate);
    } else {
      // Para visualização mensal, usar o primeiro dia do mês selecionado
      periodoInicio = new Date(selectedMonthYear.year, selectedMonthYear.month - 1, 1);
    }
    
    const shouldInclude = (
      acc &&
      acc.currency === selectedCurrency &&
      bankMatch &&
      categoryMatch &&
      t.is_paid &&
      competence &&
      periodoInicio &&
      competence < periodoInicio
    );



    return shouldInclude;
  });

  const saldoAnteriorCalc = transacoesParaSaldoAnterior.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
  // Garante que zero seja sempre positivo (evita -0)
  const saldoAnterior = saldoAnteriorCalc === 0 ? 0 : saldoAnteriorCalc;



  // Calcular saldo acumulado para cada dia (saldo do dia = saldo anterior + transações pagas do dia)
  let saldoAcumulado = saldoAnterior;
  const saldoPorDia: Record<string, number> = {};
  for (const dateKey of sortedDates) {
    const transacoesDoDia = groupedByDate[dateKey];
    const somaDoDia = transacoesDoDia.reduce((acc, t) => {
      if (t.is_paid) {
        return acc + (t.type === 'income' ? t.amount : -t.amount);
      }
      return acc;
    }, 0);
    saldoAcumulado += somaDoDia;
    // Garante que zero seja sempre positivo (evita -0)
    saldoPorDia[dateKey] = saldoAcumulado === 0 ? 0 : saldoAcumulado;
  }

  // Função para decidir cor do texto baseada na cor de fundo (hex)
  function getTextColor(bg: string) {
    if (!bg) return 'text-gray-800';
    let hex = bg.replace('#', '');
    // Suporta hex abreviado (#333)
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    if (hex.length !== 6) return 'text-gray-800';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Luminância relativa (W3C)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.5 ? 'text-white' : 'text-gray-800';
  }

  // Funções para o menu dropdown
  const handleGoToPreviousMonth = () => {
    setIsCustomDateRange(false);
    setSelectedMonthYear(prev => {
      let month = prev.month - 1;
      let year = prev.year;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { month, year };
    });
    setShowMonthDropdown(false);
  };

  const handleGoToCurrentMonth = () => {
    setIsCustomDateRange(false);
    setCustomStartDate('');
    setCustomEndDate('');
    const now = new Date();
    setSelectedMonthYear({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    setShowMonthDropdown(false);
  };

  const handleSetCustomRange = () => {
    setIsCustomDateRange(true);
    setShowMonthDropdown(false);
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      
      if (startDate <= endDate) {
        setIsCustomDateRange(true);
        setShowMonthDropdown(false);
      } else {
        alert('A data final deve ser maior que a data inicial');
      }
    }
  };

  // Verificar se as datas estão válidas
  const isCustomRangeValid = () => {
    if (!customStartDate || !customEndDate) return false;
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    return startDate <= endDate;
  };

  // Formatação do período exibido
  const getDisplayPeriod = () => {
    if (isCustomDateRange && customStartDate && customEndDate) {
      const startDate = parseDateString(customStartDate);
      const endDate = parseDateString(customEndDate);
      if (startDate && endDate) {
        return `${formatDateBR(customStartDate)} - ${formatDateBR(customEndDate)}`;
      }
    }
    return `${monthNames[selectedMonthYear.month - 1]} ${selectedMonthYear.year}`;
  };

  // Funções helper para conversão de datas para o DateInput
  const handleCustomStartDateChange = (value: string) => {
    setCustomStartDate(value);
  };

  const handleCustomEndDateChange = (value: string) => {
    setCustomEndDate(value);
  };

  // Função para converter categorias estruturadas em opções do dropdown
  const getCategoryOptions = () => {
    const options = [];
    
    // Buscar apenas categorias principais para estruturar
    const mainCategories = categories.filter(cat => !cat.parent_id);
    
    for (const mainCategory of mainCategories) {
      // Adicionar categoria principal
      options.push({
        value: mainCategory.id,
        label: mainCategory.name,
        isSubcategory: false
      });
      
      // Adicionar subcategorias
      const subcategories = categories.filter(cat => cat.parent_id === mainCategory.id);
      for (const subcategory of subcategories) {
        options.push({
          value: subcategory.id,
          label: subcategory.name,
          isSubcategory: true
        });
      }
    }
    
    return options;
  };

  return (
    <Layout>
      {/* Bloco fixo no topo, alinhado ao conteúdo principal */}
      <div
        className={`fixed top-0 bg-white shadow z-50 px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col transition-all duration-300 ${
          isCollapsed 
            ? 'left-20 w-[calc(100vw-5rem)]' 
            : 'left-64 w-[calc(100vw-16rem)]'
        }`}
        style={{ minHeight: 200 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Transações</h1>
            <p className="mt-2 text-lg text-gray-600">Gerencie suas transações financeiras</p>
          </div>
          <button
            onClick={handleOpenForm}
            className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            + Nova Transação
          </button>
        </div>
        {/* Tabs de currency */}
        <div className="flex gap-2 mb-4">
          {currencies.map(cur => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-6 py-2 rounded-xl font-semibold text-base transition-colors border ${selectedCurrency === cur ? 'bg-indigo-50 text-indigo-700 border-indigo-400' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {cur}
            </button>
          ))}
        </div>
        {/* Linha com filtros e seletor de mês */}
        <div className="flex items-center justify-between gap-6 w-full mb-2">
          {/* Filtros à esquerda */}
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
              <Select
                value={selectedBank}
                onChange={val => setSelectedBank(val)}
                options={[
                  { value: '', label: 'Todos' },
                  ...(accountsByCurrency[selectedCurrency]?.map(acc => ({ value: acc.id, label: acc.name })) || [])
                ]}
                className="min-w-[200px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <CategorySelect
                value={selectedCategory}
                onChange={val => setSelectedCategory(val)}
                options={[
                  { value: '', label: 'Todas' },
                  ...getCategoryOptions()
                ]}
                className="min-w-[200px]"
              />
            </div>
          </div>

          {/* Seletor de mês no centro */}
          <div className="flex items-center gap-4 select-none relative">
            <button
              className="p-2 rounded-full hover:bg-indigo-100 active:scale-90 transition group shadow-sm"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              title="Mês anterior"
            >
              <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          
          {/* Botão principal do mês com dropdown */}
          <div className="relative">
            <button
              className="px-8 py-2 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-indigo-50 shadow-lg border border-indigo-100 text-2xl font-extrabold text-gray-900 tracking-wide transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
              style={{ minWidth: 280, textAlign: 'center', letterSpacing: '0.04em' }}
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
                {getDisplayPeriod()}
              </span>
              <svg className={`w-4 h-4 text-indigo-400 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Menu dropdown */}
            {showMonthDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                <button
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                  onClick={handleGoToPreviousMonth}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Mês anterior
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                  onClick={handleGoToCurrentMonth}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mês atual
                </button>
                <hr className="my-2 border-gray-100" />
                <div className="px-4 py-2">
                  <button
                    className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-2 rounded-lg ${
                      isCustomDateRange
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                    onClick={handleSetCustomRange}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Personalizado
                    {isCustomDateRange && (
                      <span className="ml-auto text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                        Ativo
                      </span>
                    )}
                  </button>
                  
                  {/* Campos de data personalizados */}
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                      <DateInput
                        value={customStartDate}
                        onChange={handleCustomStartDateChange}
                        placeholder="DD/MM/AAAA"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                      <DateInput
                        value={customEndDate}
                        onChange={handleCustomEndDateChange}
                        placeholder="DD/MM/AAAA"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                          isCustomRangeValid()
                            ? 'bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={handleApplyCustomRange}
                        disabled={!isCustomRangeValid()}
                      >
                        Aplicar
                      </button>
                      {isCustomDateRange && (
                        <button
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-150 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          onClick={handleGoToCurrentMonth}
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
            <button
              className="p-2 rounded-full hover:bg-indigo-100 active:scale-90 transition group shadow-sm"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              title="Próximo mês"
            >
              <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Saldo anterior à direita */}
          <div className="text-base text-gray-700 font-medium">
            Saldo anterior: <span className="font-bold">
              {saldoAnterior.toLocaleString('pt-BR', { style: 'currency', currency: selectedCurrency })}
            </span>
          </div>
        </div>
      </div>
      {/* Espaço para não sobrepor o conteúdo */}
      <div className="h-[230px]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabela de transações agrupada por data */}
        <div className="bg-white rounded-2xl shadow mt-6">
          {sortedDates.length === 0 && (
            <div className="text-center py-6 text-gray-400">Nenhuma transação encontrada.</div>
          )}
          {sortedDates.map(dateKey => (
            <div key={dateKey} className="mb-8">
              <div className="flex items-center justify-between bg-gray-50 rounded-t-2xl px-8 py-4">
                <span className="text-xl font-bold text-gray-900">{dateKey}</span>
                <span className="text-base text-gray-700 font-medium">
                  Saldo do dia: <span className="font-bold">
                    {saldoPorDia[dateKey].toLocaleString('pt-BR', { style: 'currency', currency: selectedCurrency })}
                  </span>
                </span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-sm">
                    <th className="font-semibold px-4 py-3 text-left min-w-[220px] max-w-[320px] w-1/3">DESCRIÇÃO</th>
                    <th className="font-semibold px-4 py-3 text-left">DATA</th>
                    <th className="font-semibold px-4 py-3 text-left">COMPETÊNCIA</th>
                    <th className="font-semibold px-4 py-3 text-left">STATUS</th>
                    <th className="font-semibold px-4 py-3 text-right">VALOR</th>
                    <th className="font-semibold px-4 py-3 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 text-base divide-y divide-gray-100">
                  {groupedByDate[dateKey].map(t => {
                    const acc = accounts.find(a => a.id === t.account_id);
                    // Função para decidir cor do texto
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 align-middle text-left min-w-[220px] max-w-[320px] w-1/3 truncate">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium truncate">{t.description}</span>
                            <div className="flex gap-2 mt-1">
                              <span
                                className={`text-xs font-semibold rounded-full px-3 py-1 border`}
                                style={{
                                  color: acc?.color || '#facc15',
                                  background: hexToRgba(acc?.color || '#facc15', 0.10),
                                  borderColor: hexToRgba(acc?.color || '#facc15', 0.30),
                                }}
                              >
                                {acc?.name || '-'}
                              </span>
                              <span
                                className={`text-xs font-semibold rounded-full px-3 py-1 border`}
                                style={{
                                  color: getCategoryColor(t),
                                  background: hexToRgba(getCategoryColor(t), 0.10),
                                  borderColor: hexToRgba(getCategoryColor(t), 0.30),
                                }}
                              >
                                {getCategoryDisplayName(t)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-left">{formatDateBR(t.due_date)}</td>
                        <td className="px-4 py-3 align-middle text-left">{formatCompetenceBR(t.competence_date)}</td>
                        <td className="px-4 py-3 align-middle text-left">
                          <span className={`text-xs font-semibold rounded px-2 py-0.5 ${t.is_paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {t.is_paid ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          <span className={`font-bold flex items-center gap-1 justify-end ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}> 
                            {t.amount.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: acc?.currency || selectedCurrency 
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
                          <button className="inline-flex items-center p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar" onClick={() => handleEdit(t)}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 0 0 .707-.293l9.414-9.414a2 2 0 0 0 0-2.828l-2.172-2.172a2 2 0 0 0-2.828 0L4.293 15.293A1 1 0 0 0 4 16v4z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button className="inline-flex items-center p-1 text-red-600 hover:bg-red-50 rounded ml-2" title="Excluir" onClick={() => handleDelete(t.id!)}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-7 0h10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        {/* Modal de formulário de transação */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={handleCloseForm}
                className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-3xl"
                title="Fechar"
              >
                &times;
              </button>
              <TransactionForm onSubmit={handleSubmitForm} onCancel={handleCloseForm} currency={selectedCurrency} {...(editingTransaction ? { ...editingTransaction } : {})} />
            </div>
          </div>
        )}
        {/* Modal de confirmação de exclusão de transação */}
        {transactionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Excluir transação</h2>
              <p className="mb-6">Tem certeza que deseja excluir a transação <span className="font-semibold">{transactionToDelete.description}</span>?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelDeleteTransaction}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteTransaction}
                  className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsPage; 