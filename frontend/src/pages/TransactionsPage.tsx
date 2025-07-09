import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TransactionForm from '../components/TransactionForm';
import Select from '../components/Select';
import { accountService, transactionService, categoryService } from '../services/api';
import { Transaction } from '../types/transaction';
import { getUser } from '../services/auth';
import FeedbackToast from '../components/FeedbackToast';

const monthNames = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
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
  const [selectedMonth, setSelectedMonth] = useState('julho 2025');
  // Garanta que o valor inicial dos filtros seja ''
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const today = new Date();
  const [selectedMonthYear, setSelectedMonthYear] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchData();
  }, []);

  const normalizeTransaction = (t: any) => ({
    ...t,
    amount: typeof t.amount === 'number' ? t.amount / 100 : 0,
    account_id: t.account_id,
    category_id: t.category_id,
    initialIsPaid: t.is_paid,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accs, txs, cats] = await Promise.all([
        accountService.getAllAccounts(),
        transactionService.getAllTransactions(),
        categoryService.getAllCategories(),
      ]);
      setAccounts(Array.isArray(accs) ? accs : []);
      setTransactions(Array.isArray(txs) ? txs.map(normalizeTransaction) : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
    } finally {
      setLoading(false);
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

  // Aplique os filtros nas transações:
  const transactionsForCurrency = transactions.filter(t => {
    const acc = accounts.find(a => a.id === t.account_id);
    const { month, year } = extractMonthYear(t.competence_date);
    const bankMatch = selectedBank === '' || t.account_id === selectedBank;
    const categoryMatch = selectedCategory === '' || t.category_id === selectedCategory;
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

  // Encontre a menor data de lançamento do mês selecionado
  const datasDoMes = transactionsForCurrencySorted.map(t => parseDateString(t.due_date)).filter(Boolean);
  const primeiraDataDoMes = datasDoMes.length > 0 ? new Date(Math.min(...datasDoMes.map(d => d!.getTime()))) : null;

  // Map de id para nome da categoria
  const categoryIdToName = Object.fromEntries(categories.map(cat => [cat.id, cat.name]));

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
        setFeedback({ type: 'success', message: 'Transação atualizada com sucesso!' });
      } else {
        await transactionService.createTransaction(payload);
        setFeedback({ type: 'success', message: 'Transação criada com sucesso!' });
      }
      setShowForm(false);
      setEditingTransaction(null);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao salvar transação.' });
    }
  };
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await transactionService.deleteTransaction(id);
        setFeedback({ type: 'success', message: 'Transação excluída com sucesso!' });
        fetchData();
      } catch {
        setFeedback({ type: 'error', message: 'Erro ao excluir transação.' });
      }
    }
  };

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
      const [, year, month] = dateStr.match(/^(\d{4})-(\d{2})-/) || [];
      if (year && month) return `${month}/${year}`;
    }
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Função para avançar mês
  const handleNextMonth = () => {
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

  // Saldo anterior: acumulado até o dia anterior ao primeiro lançamento do mês selecionado
  // Usar apenas as transações que passaram pelos filtros (moeda, banco, categoria)
  const saldoAnterior = transactions
    .filter(t => {
      const acc = accounts.find(a => a.id === t.account_id);
      const { month, year } = extractMonthYear(t.competence_date);
      const bankMatch = selectedBank === '' || t.account_id === selectedBank;
      const categoryMatch = selectedCategory === '' || t.category_id === selectedCategory;
      const due = parseDateString(t.due_date);
      
      return (
        acc &&
        acc.currency === selectedCurrency &&
        month === selectedMonthYear.month &&
        year === selectedMonthYear.year &&
        bankMatch &&
        categoryMatch &&
        t.is_paid &&
        due &&
        primeiraDataDoMes &&
        due < primeiraDataDoMes
      );
    })
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

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
    saldoPorDia[dateKey] = saldoAcumulado;
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
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
        {feedback && (
          <FeedbackToast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />
        )}
        {/* Tabs de currency */}
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
        {/* Navegação de mês e botão nova transação */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex-1 flex flex-col items-center sm:items-start">
            <div className="flex items-center justify-center gap-6 w-full mb-2">
              <button className="text-2xl text-gray-400 hover:text-gray-600 transition" onClick={handlePrevMonth}>{'<'}</button>
              <span className="text-xl font-bold text-gray-900">{monthNames[selectedMonthYear.month - 1]} {selectedMonthYear.year}</span>
              <button className="text-2xl text-gray-400 hover:text-gray-600 transition" onClick={handleNextMonth}>{'>'}</button>
            </div>
          </div>
        </div>
        {/* Filtros */}
        <div className="flex flex-wrap gap-6 items-end mb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
            <Select
              value={selectedBank}
              onChange={val => setSelectedBank(val)}
              options={[
                { value: '', label: 'Todos' },
                ...(accountsByCurrency[selectedCurrency]?.map(acc => ({ value: acc.id, label: acc.name })) || [])
              ]}
              className="min-w-[120px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <Select
              value={selectedCategory}
              onChange={val => setSelectedCategory(val)}
              options={[
                { value: '', label: 'Todas' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
              className="min-w-[120px]"
            />
          </div>
          <div className="ml-auto text-base text-gray-700 font-medium">
            Saldo anterior: <span className="font-bold">
              {saldoAnterior.toLocaleString('pt-BR', { style: 'currency', currency: selectedCurrency })}
            </span>
          </div>
        </div>
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
                    const cat = categories.find(c => c.id === t.category_id);
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
                                  color: cat?.color || '#a7f3d0',
                                  background: hexToRgba(cat?.color || '#a7f3d0', 0.10),
                                  borderColor: hexToRgba(cat?.color || '#a7f3d0', 0.30),
                                }}
                              >
                                {cat?.name || '-'}
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
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <TransactionForm onSubmit={handleSubmitForm} onCancel={handleCloseForm} currency={selectedCurrency} {...(editingTransaction ? { ...editingTransaction } : {})} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsPage; 