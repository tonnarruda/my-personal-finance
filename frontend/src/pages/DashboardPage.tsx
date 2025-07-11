import React, { useEffect, useState } from 'react';
import { getUser } from '../services/auth';
import api, { accountService, transactionService, categoryService } from '../services/api';
import { Account } from '../types/account';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { CreateTransactionRequest } from '../types/transaction';
import Layout from '../components/Layout';
import ModernChart from '../components/ModernChart';
import ModernResultCard from '../components/ModernResultCard';
import ModernMetrics from '../components/ModernMetrics';
import TransactionForm from '../components/TransactionForm';
import AccountForm from '../components/AccountForm';
import { useToast } from '../contexts/ToastContext';

const DashboardPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const user = getUser();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'transfer'>('expense');
  
  // Account modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalLoading, setAccountModalLoading] = useState(false);
  
  // Estado para controlar se devem mostrar contas com saldo zerado
  const [hideZeroBalanceAccounts, setHideZeroBalanceAccounts] = useState(() => {
    // Carregar estado do localStorage na inicialização
    const saved = localStorage.getItem('hideZeroBalanceAccounts');
    return saved === 'true';
  });
  
  const { showSuccess, showError } = useToast();

  // Salvar estado do checkbox no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('hideZeroBalanceAccounts', hideZeroBalanceAccounts.toString());
  }, [hideZeroBalanceAccounts]);

  // Função para detectar se uma transação é uma transferência
  const isTransferTransaction = (transaction: Transaction): boolean => {
    return transaction.transfer_id !== undefined && transaction.transfer_id !== null && transaction.transfer_id !== '';
  };

  // Atualizar dados mockados para serem por currency
  interface CategoriaData { label: string; value: number; percent: number; color: string; }
  interface CurrencyData {
    receitaMes: number;
    despesaMes: number;
    resultadoMes: number;
    despesasPorCategoria: CategoriaData[];
    receitasPorCategoria: CategoriaData[];
  }

  useEffect(() => {
    async function fetchNome() {
      if (!user?.id) return;
      try {
        const response = await api.get(`/me?user_id=${user.id}`);
        setNome(response.data.nome);
      } catch (err) {
        setNome(user?.nome || ''); // fallback
      }
    }
    fetchNome();
  }, [user?.id]);



  useEffect(() => {
    async function fetchAllData() {
      setLoadingAccounts(true);
      setLoadingData(true);
      try {
        const [accountsData, transactionsData, categoriesIncome, categoriesExpense] = await Promise.all([
          accountService.getAllAccounts(),
          transactionService.getAllTransactions(),
          categoryService.getCategoriesByType('income'),
          categoryService.getCategoriesByType('expense'),
        ]);
        setAccounts(accountsData || []);
        setTransactions(transactionsData || []);
        setCategories([...(categoriesIncome || []), ...(categoriesExpense || [])]);
      } catch (err) {
        setAccounts([]);
        setTransactions([]);
        setCategories([]);
      } finally {
        setLoadingAccounts(false);
        setLoadingData(false);
      }
    }
    fetchAllData();
  }, [reloadFlag]);

  // Agrupa contas por currency
  const accountsByCurrency: { [currency: string]: Account[] } = {};
  accounts.forEach(acc => {
    if (!accountsByCurrency[acc.currency]) accountsByCurrency[acc.currency] = [];
    accountsByCurrency[acc.currency].push(acc);
  });
  const currencies = Object.keys(accountsByCurrency);

  // Filtra transações do mês atual e moeda selecionada
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const transactionsForCurrency = transactions.filter(tx => {
    const txDate = new Date(tx.competence_date || tx.due_date);
    const acc = accounts.find(a => a.id === tx.account_id);
    return (
      acc && acc.currency === selectedCurrency &&
      txDate.getMonth() + 1 === currentMonth &&
      txDate.getFullYear() === currentYear
    );
  });

  // Calcula receitas, despesas e saldo do mês (apenas pagas, corrigindo para centavos, excluindo transferências)
  const receitaMesCalc = transactionsForCurrency.filter(tx => tx.type === 'income' && tx.is_paid && !isTransferTransaction(tx)).reduce((sum, tx) => sum + (tx.amount / 100), 0);
  const despesaMesCalc = transactionsForCurrency.filter(tx => tx.type === 'expense' && tx.is_paid && !isTransferTransaction(tx)).reduce((sum, tx) => sum + (tx.amount / 100), 0);
  const resultadoMesCalc = receitaMesCalc - despesaMesCalc;
  
  // Garante que zeros sejam sempre positivos (evita -0)
  const receitaMes = receitaMesCalc === 0 ? 0 : receitaMesCalc;
  const despesaMes = despesaMesCalc === 0 ? 0 : despesaMesCalc;
  const resultadoMes = resultadoMesCalc === 0 ? 0 : resultadoMesCalc;

  // Saldo atual acumulado de todas as transações pagas da moeda (corrigindo para centavos)
  const saldoAtualCalc = transactions
    .filter(tx => {
      const acc = accounts.find(a => a.id === tx.account_id);
      return acc && acc.currency === selectedCurrency && tx.is_paid;
    })
    .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount / 100 : -tx.amount / 100), 0);
  // Garante que zero seja sempre positivo (evita -0)
  const saldoAtual = saldoAtualCalc === 0 ? 0 : saldoAtualCalc;

  // Calcula dados do mês anterior para comparação
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  
  const transactionsForCurrencyPreviousMonth = transactions.filter(tx => {
    const txDate = new Date(tx.competence_date || tx.due_date);
    const acc = accounts.find(a => a.id === tx.account_id);
    return (
      acc && acc.currency === selectedCurrency &&
      txDate.getMonth() + 1 === previousMonth &&
      txDate.getFullYear() === previousYear
    );
  });

  const receitaMesAnteriorCalc = transactionsForCurrencyPreviousMonth.filter(tx => tx.type === 'income' && tx.is_paid && !isTransferTransaction(tx)).reduce((sum, tx) => sum + (tx.amount / 100), 0);
  const despesaMesAnteriorCalc = transactionsForCurrencyPreviousMonth.filter(tx => tx.type === 'expense' && tx.is_paid && !isTransferTransaction(tx)).reduce((sum, tx) => sum + (tx.amount / 100), 0);
  const resultadoMesAnteriorCalc = receitaMesAnteriorCalc - despesaMesAnteriorCalc;
  
  // Garante que zeros sejam sempre positivos (evita -0)
  const receitaMesAnterior = receitaMesAnteriorCalc === 0 ? 0 : receitaMesAnteriorCalc;
  const despesaMesAnterior = despesaMesAnteriorCalc === 0 ? 0 : despesaMesAnteriorCalc;
  const resultadoMesAnterior = resultadoMesAnteriorCalc === 0 ? 0 : resultadoMesAnteriorCalc;

  // Para o saldo, calculamos a variação considerando todos os dados históricos
  const saldoMesAnteriorCalc = transactions
    .filter(tx => {
      const txDate = new Date(tx.competence_date || tx.due_date);
      const acc = accounts.find(a => a.id === tx.account_id);
      return (
        acc && acc.currency === selectedCurrency && tx.is_paid &&
        (txDate.getFullYear() < previousYear || 
         (txDate.getFullYear() === previousYear && txDate.getMonth() + 1 <= previousMonth))
      );
    })
    .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount / 100 : -tx.amount / 100), 0);
  // Garante que zero seja sempre positivo (evita -0)
  const saldoMesAnterior = saldoMesAnteriorCalc === 0 ? 0 : saldoMesAnteriorCalc;

  // Verifica se há dados históricos para comparação
  const hasHistoricalData = transactionsForCurrencyPreviousMonth.length > 0;

  // Calcula variações percentuais (apenas quando há dados históricos)
  const variacaoReceitas = hasHistoricalData && receitaMesAnterior > 0 ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;
  const variacaoDespesas = hasHistoricalData && despesaMesAnterior > 0 ? ((despesaMes - despesaMesAnterior) / despesaMesAnterior) * 100 : 0;
  const variacaoSaldo = hasHistoricalData && saldoMesAnterior !== 0 ? ((saldoAtual - saldoMesAnterior) / Math.abs(saldoMesAnterior)) * 100 : 0;

  // Calcula mudança percentual do resultado mensal (apenas quando há dados históricos)
  const percentChangeResultado = hasHistoricalData && resultadoMesAnterior !== 0 ? ((resultadoMes - resultadoMesAnterior) / Math.abs(resultadoMesAnterior)) * 100 : 0;

  // Função auxiliar para encontrar a categoria pai (ou a própria categoria se for pai)
  function getParentCategory(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    
    // Se a categoria tem parent_id, busca a categoria pai
    if (category.parent_id) {
      const parentCategory = categories.find(c => c.id === category.parent_id);
      return parentCategory || category; // Se não encontrar pai, usa a própria categoria
    }
    
    // Se não tem parent_id, é uma categoria pai
    return category;
  }

  // Agrupa receitas/despesas por categoria pai (excluindo transferências)
  function groupByCategory(type: 'income' | 'expense') {
    const txs = transactionsForCurrency.filter(tx => tx.type === type && tx.is_paid && !isTransferTransaction(tx));
    const map: { [catId: string]: { label: string; value: number; color: string } } = {};
    txs.forEach(tx => {
      const parentCategory = getParentCategory(tx.category_id);
      if (!parentCategory) return;
      
      // Agrupa por categoria pai
      if (!map[parentCategory.id]) {
        map[parentCategory.id] = { 
          label: parentCategory.name, 
          value: 0, 
          color: parentCategory.color 
        };
      }
      map[parentCategory.id].value += tx.amount / 100;
    });
    // Calcula percentuais e ordena por valor (do maior para o menor)
    const total = Object.values(map).reduce((sum, c) => sum + c.value, 0) || 1;
    return Object.values(map)
      .map(c => ({ ...c, percent: (c.value / total) * 100 }))
      .sort((a, b) => b.value - a.value); // Ordenação do maior para o menor valor
  }
  const receitasPorCategoria = groupByCategory('income');
  const despesasPorCategoria = groupByCategory('expense');

  // Função para calcular o saldo confirmado (pagos) de uma conta
  function getAccountConfirmedBalance(accountId: string) {
    const balance = transactions
      .filter(tx => tx.account_id === accountId && tx.is_paid)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount / 100 : -tx.amount / 100), 0);
    // Garante que zero seja sempre positivo (evita -0)
    return balance === 0 ? 0 : balance;
  }
  // Função para calcular o saldo projetado (pagos e não pagos) de uma conta
  function getAccountProjectedBalance(accountId: string) {
    const balance = transactions
      .filter(tx => tx.account_id === accountId)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount / 100 : -tx.amount / 100), 0);
    // Garante que zero seja sempre positivo (evita -0)
    return balance === 0 ? 0 : balance;
  }

  // Função helper para formatar valores monetários garantindo que zero seja sempre positivo
  function formatCurrency(value: number): string {
    // Garante que zero seja sempre positivo (evita -0)
    const normalizedValue = value === 0 ? 0 : value;
    return normalizedValue.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: selectedCurrency, 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }



  // Saldos das contas (se disponível)
  const accountsForCurrency = accounts.filter(acc => acc.currency === selectedCurrency);
  
  // Filtrar contas baseado no checkbox de esconder saldos zerados
  const filteredAccountsForCurrency = hideZeroBalanceAccounts 
    ? accountsForCurrency.filter(acc => {
        const confirmedBalance = getAccountConfirmedBalance(acc.id);
        const projectedBalance = getAccountProjectedBalance(acc.id);
        // Esconder apenas contas que tenham AMBOS os saldos zerados (com tolerância para flutuação)
        const isConfirmedZero = Math.abs(confirmedBalance) < 0.01;
        const isProjectedZero = Math.abs(projectedBalance) < 0.01;
        return !(isConfirmedZero && isProjectedZero);
      })
    : accountsForCurrency;
  
  // Recalcular totais baseado nas contas filtradas
  const totalConfirmed = filteredAccountsForCurrency.reduce((sum, acc) => sum + getAccountConfirmedBalance(acc.id), 0);
  const totalProjected = filteredAccountsForCurrency.reduce((sum, acc) => sum + getAccountProjectedBalance(acc.id), 0);
  // Garante que zeros sejam sempre positivos
  const totalConfirmedSafe = totalConfirmed === 0 ? 0 : totalConfirmed;
  const totalProjectedSafe = totalProjected === 0 ? 0 : totalProjected;
  
  const currencySymbols: Record<string, string> = { BRL: 'R$', EUR: '€', USD: 'US$', GBP: '£' };

  // Modal handlers
  const handleOpenExpenseModal = () => {
    setModalType('expense');
    setIsModalOpen(true);
  };

  const handleOpenIncomeModal = () => {
    setModalType('income');
    setIsModalOpen(true);
  };

  const handleOpenTransferModal = () => {
    setModalType('transfer');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Account modal handlers
  const handleOpenAccountModal = () => {
    setIsAccountModalOpen(true);
  };

  const handleCloseAccountModal = () => {
    setIsAccountModalOpen(false);
  };

  const handleAccountSubmit = async (data: any) => {
    setAccountModalLoading(true);
    try {
      const payload = toAccountBackendPayload(data);
      await accountService.createAccount(payload);
      showSuccess('Conta criada com sucesso!');
      setIsAccountModalOpen(false);
      // Reload data to reflect changes
      setReloadFlag(prev => prev + 1);
    } catch (error) {
      showError('Erro ao criar conta');
    } finally {
      setAccountModalLoading(false);
    }
  };

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

  // Função utilitária para converter objeto para snake_case e mapear campos para o backend (transações)
  function toBackendPayload(obj: any) {
    return {
      user_id: user?.id,
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

  // Função utilitária para converter dados de conta para o backend
  function toAccountBackendPayload(obj: any) {
    return {
      name: obj.name,
      currency: obj.currency,
      color: obj.color,
      type: obj.accountType,
      is_active: true,
      due_date: obj.initialDate ? formatDateToISO(obj.initialDate) : undefined,
      competence_date: obj.initialDate ? formatDateToISO(obj.initialDate) : undefined,
      initial_value: obj.initialValue || 0,
    };
  }

  const handleTransactionSubmit = async (data: CreateTransactionRequest) => {
    setModalLoading(true);
    try {
      const payload = toBackendPayload(data);
      await transactionService.createTransaction(payload);
      const transactionTypeName = data.type === 'income' ? 'Receita' : data.type === 'expense' ? 'Despesa' : 'Transferência';
      showSuccess(`${transactionTypeName} criada com sucesso!`);
      setIsModalOpen(false);
      // Reload data to reflect changes
      setReloadFlag(prev => prev + 1);
    } catch (error) {
      showError('Erro ao criar transação');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Topo: Saudação e subtítulo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              Olá, {nome || 'Ton Arruda'}! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-base md:text-lg text-gray-400">Bem-vindo de volta, veja como estão suas finanças.</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition" title="Notificações">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </button>
            <span className="relative w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center cursor-pointer">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            </span>
          </div>
        </div>

        {/* Cards de resumo modernos */}
        <div className="mb-10">
          <ModernMetrics 
            receitas={receitaMes}
            despesas={despesaMes}
            saldo={saldoAtual}
            currency={selectedCurrency}
            variacaoReceitas={variacaoReceitas}
            variacaoDespesas={variacaoDespesas}
            variacaoSaldo={variacaoSaldo}
            hasHistoricalData={hasHistoricalData}
            receitaMesAnterior={receitaMesAnterior}
            despesaMesAnterior={despesaMesAnterior}
            saldoMesAnterior={saldoMesAnterior}
          />
        </div>

        {/* Bloco de acesso rápido */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            <button onClick={handleOpenExpenseModal} className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-0 shadow-sm hover:bg-red-50 transition">
              <span className="text-3xl text-red-500 mb-2">&#8722;</span>
              <span className="text-gray-700 text-base font-medium">DESPESA</span>
            </button>
            <button onClick={handleOpenIncomeModal} className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-0 shadow-sm hover:bg-green-50 transition">
              <span className="text-3xl text-green-600 mb-2">&#43;</span>
              <span className="text-gray-700 text-base font-medium">RECEITA</span>
            </button>
            <button onClick={handleOpenTransferModal} className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-0 shadow-sm hover:bg-gray-100 transition">
              <span className="text-2xl text-gray-500 mb-2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M7 12h10M16 9l3 3-3 3" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span className="text-gray-700 text-base font-medium">TRANSFERÊNCIA</span>
            </button>
            <button className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-0 shadow-sm hover:bg-blue-50 transition">
              <span className="text-2xl text-blue-600 mb-2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <span className="text-gray-700 text-base font-medium">IMPORTAR</span>
            </button>
            <button onClick={handleOpenAccountModal} className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-0 shadow-sm hover:bg-orange-50 transition">
              <span className="text-2xl text-orange-600 mb-2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M21 8V7a3 3 0 00-3-3H6a3 3 0 00-3 3v1" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8v6a3 3 0 003 3h12a3 3 0 003-3V8" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12h12" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span className="text-gray-700 text-base font-medium">CONTA</span>
            </button>
          </div>
        </div>

        {/* Abas de currency */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex gap-2 mb-6">
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
        </div>
        {/* Cards principais filtrados pela currency selecionada */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
          {/* Card Gráfico Moderno */}
          <div className="flex-1 bg-white rounded-2xl shadow p-8 flex flex-col min-w-0">
            <div className="text-xl font-bold text-gray-900 mb-6">Visão Mensal</div>
            <div className="flex-1 flex flex-col justify-center">
              <ModernChart 
                data={{
                  receitas: receitaMes,
                  despesas: despesaMes,
                  currency: selectedCurrency
                }}
                width={400}
                height={300}
              />
            </div>
          </div>
          
          {/* Card Resultado Moderno */}
          <div className="lg:w-80">
            <ModernResultCard
              receitas={receitaMes}
              despesas={despesaMes}
              resultado={resultadoMes}
              currency={selectedCurrency}
              percentChange={percentChangeResultado}
              hasHistoricalData={hasHistoricalData}
              resultadoMesAnterior={resultadoMesAnterior}
            />
          </div>
        </div>

        {/* Card Saldos de Caixa */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xl font-bold text-gray-900">Saldos de caixa</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideZeroBalanceAccounts}
                  onChange={(e) => setHideZeroBalanceAccounts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Esconder contas zeradas</span>
              </label>
            </div>
            <div className="w-full overflow-x-auto">
              <div className="mb-2 ml-1 text-lg font-semibold text-gray-700">{selectedCurrency}</div>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="font-medium text-gray-700 pb-2"></th>
                    <th className="font-semibold text-gray-500 pb-2 text-right min-w-[100px]">Confirmado</th>
                    <th className="font-semibold text-gray-500 pb-2 text-right min-w-[100px]">Projetado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAccountsForCurrency.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        {hideZeroBalanceAccounts 
                          ? 'Nenhuma conta com saldo disponível' 
                          : 'Nenhuma conta encontrada'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredAccountsForCurrency.map((account, idx) => (
                      <tr key={account.id}>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: account.color || '#22c55e' }}>
                              {account.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-gray-800 text-base">{account.name}</span>
                          </span>
                        </td>
                        <td className="py-3 text-green-600 font-semibold text-base text-right min-w-[100px]">
                          {formatCurrency(getAccountConfirmedBalance(account.id))}
                        </td>
                        <td className="py-3 text-green-600 font-semibold text-base text-right min-w-[100px]">
                          {formatCurrency(getAccountProjectedBalance(account.id))}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="font-bold">
                    <td className="py-3 text-gray-900">Total</td>
                    <td className="py-3 text-green-600 font-bold text-right min-w-[100px]">{currencySymbols[selectedCurrency] || ''} {totalConfirmedSafe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-green-600 font-bold text-right min-w-[100px]">{currencySymbols[selectedCurrency] || ''} {totalProjectedSafe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Cards de pizza por categoria filtrados pela currency */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Despesas por categoria */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col min-w-0">
            <div className="text-xl font-bold text-gray-900 mb-6">Despesas por categoria</div>
            <div className="flex flex-row items-center gap-8 flex-1">
              <div className="flex-shrink-0 flex items-center justify-center">
                {/* Gráfico donut SVG */}
                <svg width="160" height="160" viewBox="0 0 36 36" className="block">
                  {(() => {
                    let acc = 0;
                    return despesasPorCategoria.map((cat: CategoriaData, i: number) => {
                      const val = (cat.percent / 100) * 100;
                      const dasharray = `${val} ${100 - val}`;
                      const dashoffset = 25 - acc;
                      acc += val;
                      return (
                        <circle
                          key={cat.label}
                          cx="18" cy="18" r="15.9155"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="3"
                          strokeDasharray={dasharray}
                          strokeDashoffset={dashoffset}
                          style={{ transition: 'stroke-dasharray 0.3s' }}
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {despesasPorCategoria.map((cat: CategoriaData) => (
                  <div key={cat.label} className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-gray-700 text-sm">{cat.label}</span>
                    <span className="bg-gray-100 font-semibold rounded px-2 py-0.5 ml-2 text-gray-600 text-[10px]">{cat.percent.toFixed(2)}%</span>
                    <span className="ml-auto text-red-600 font-bold text-sm text-right min-w-[100px]">- R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Footer total despesas */}
            <div className="w-full border-t border-gray-100 mt-6 pt-4 flex items-center justify-between">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-red-600 text-lg">- R$ {despesasPorCategoria.reduce((sum, cat) => sum + cat.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          {/* Receitas por categoria */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col min-w-0">
            <div className="text-xl font-bold text-gray-900 mb-6">Receitas por categoria</div>
            <div className="flex flex-row items-center gap-8 flex-1">
              <div className="flex-shrink-0 flex items-center justify-center">
                {/* Gráfico donut SVG */}
                <svg width="160" height="160" viewBox="0 0 36 36" className="block">
                  {(() => {
                    let acc = 0;
                    return receitasPorCategoria.map((cat: CategoriaData, i: number) => {
                      const val = (cat.percent / 100) * 100;
                      const dasharray = `${val} ${100 - val}`;
                      const dashoffset = 25 - acc;
                      acc += val;
                      return (
                        <circle
                          key={cat.label}
                          cx="18" cy="18" r="15.9155"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="3"
                          strokeDasharray={dasharray}
                          strokeDashoffset={dashoffset}
                          style={{ transition: 'stroke-dasharray 0.3s' }}
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {receitasPorCategoria.map((cat: CategoriaData) => (
                  <div key={cat.label} className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-gray-700 text-sm">{cat.label}</span>
                    <span className="bg-gray-100 font-semibold rounded px-2 py-0.5 ml-2 text-gray-600 text-[10px]">{cat.percent.toFixed(2)}%</span>
                    <span className="ml-auto text-green-600 font-bold text-sm text-right min-w-[100px]">R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Footer total receitas */}
            <div className="w-full border-t border-gray-100 mt-6 pt-4 flex items-center justify-between">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-green-600 text-lg">R$ {receitasPorCategoria.reduce((sum, cat) => sum + cat.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-3xl"
              title="Fechar"
            >
              &times;
            </button>
            <TransactionForm
              typeDefault={modalType}
              onSubmit={handleTransactionSubmit}
              onCancel={handleCloseModal}
              isLoading={modalLoading}
              currency={selectedCurrency}
            />
          </div>
        </div>
      )}

      {/* Account Modal Overlay */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseAccountModal}
              className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-3xl"
              title="Fechar"
            >
              &times;
            </button>
            <AccountForm
              onSubmit={handleAccountSubmit}
              onCancel={handleCloseAccountModal}
              isLoading={accountModalLoading}
            />
          </div>
        </div>
      )}
      

    </Layout>
  );
};

export default DashboardPage; 