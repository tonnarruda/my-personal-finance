import React, { useState, useEffect } from 'react';
import AccountForm, { AccountFormData } from '../components/AccountForm';
import { accountService } from '../services/api';
import { CreateAccountRequest, UpdateAccountRequest, Account } from '../types/account';
import { getUser } from '../services/auth';
import Layout from '../components/Layout';
import FeedbackToast from '../components/FeedbackToast';
import { transactionService, categoryService, getOrCreateCategoryByName } from '../services/api';
import { Transaction } from '../types/transaction';

const AccountsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchAccountsAndTransactions = async () => {
    setLoadingAccounts(true);
    try {
      const [accs, txs] = await Promise.all([
        accountService.getAllAccounts(),
        transactionService.getAllTransactions(),
      ]);
      setAccounts(accs);
      setTransactions(Array.isArray(txs) ? txs : []);
    } catch (err: any) {
      setError('Erro ao carregar contas ou transações');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndTransactions();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelForm();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showForm]);

  useEffect(() => {
    if (!deletingAccount) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDeleteAccount();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [deletingAccount]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDeleteAccount = (account: Account) => {
    setDeletingAccount(account);
  };

  const confirmDeleteAccount = async () => {
    if (!deletingAccount) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await accountService.deleteAccount(deletingAccount.id);
      setSuccess('Conta excluída com sucesso!');
      setDeletingAccount(null);
      fetchAccountsAndTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao excluir conta');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteAccount = () => {
    setDeletingAccount(null);
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

  const handleSubmitForm = async (data: AccountFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    const user = getUser();
    try {
      if (editingAccount) {
        const req: UpdateAccountRequest = {
          name: data.name,
          currency: data.currency,
          color: data.color,
          type: data.accountType,
          is_active: data.is_active,
          user_id: user?.id,
        };
        await accountService.updateAccount(editingAccount.id, req);
        setSuccess('Conta atualizada com sucesso!');
      } else {
        const message = await accountService.createAccount({
          name: data.name,
          currency: data.currency,
          color: data.color,
          type: data.accountType,
          is_active: true,
          due_date: formatDateToISO(data.initialDate),
          competence_date: formatDateToISO(data.initialDate),
          initial_value: data.initialValue,
        });

        if (message) {
          setSuccess('Conta criada com sucesso!');
          setShowForm(false);
          fetchAccountsAndTransactions();
        }
      }
      setEditingAccount(null);
      fetchAccountsAndTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao salvar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => showInactive || acc.is_active);

  // Agrupa contas por currency
  const accountsByCurrency: { [currency: string]: Account[] } = {};
  filteredAccounts.forEach(acc => {
    if (!accountsByCurrency[acc.currency]) accountsByCurrency[acc.currency] = [];
    accountsByCurrency[acc.currency].push(acc);
  });
  const currencies = Object.keys(accountsByCurrency);

  // Função para calcular saldo de uma conta
  function getAccountBalance(accountId: string) {
    return transactions
      .filter(tx => tx.account_id === accountId && tx.is_paid !== false)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
  }

  return (
    <Layout>
      {/* Bloco fixo no topo, alinhado ao conteúdo principal */}
      <div
        className="fixed top-0 left-64 w-[calc(100vw-16rem)] bg-white shadow z-50 px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col"
        style={{ minHeight: 110 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Contas</h1>
            <p className="mt-2 text-lg text-gray-600">Aqui você pode visualizar e gerenciar suas contas bancárias e saldos.</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => setShowInactive(v => !v)}
                className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-base text-gray-700">Exibir contas inativas</span>
            </label>
            <button
              onClick={handleAddAccount}
              className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              + Nova Conta
            </button>
          </div>
        </div>
      </div>
      {/* Espaço para não sobrepor o conteúdo */}
      <div className="h-[110px]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <FeedbackToast message={error} type="error" onClose={() => setError('')} />
        )}
        {success && (
          <FeedbackToast message={success} type="success" onClose={() => setSuccess('')} />
        )}
        {/* Lista de contas - layout padrão do anexo */}
        <div className="mb-12">
          {loadingAccounts ? (
            <div className="text-gray-500 text-center py-12">Carregando contas...</div>
          ) : currencies.length === 0 ? (
            <div className="text-gray-400 text-center py-12">Nenhuma conta cadastrada ainda.</div>
          ) : (
            currencies.map(currency => (
              <div key={currency} className="mb-10">
                {/* Cabeçalho de moeda com ícone */}
                <div className="flex items-center gap-2 mb-4 ml-1">
                  {currency === 'BRL' && <span className="text-2xl">💳</span>}
                  {currency === 'USD' && <span className="text-2xl">💲</span>}
                  {currency === 'EUR' && <span className="text-2xl">💶</span>}
                  {currency === 'GBP' && <span className="text-2xl">💷</span>}
                  <span className="text-2xl font-bold text-gray-900">Moeda: {currency}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accountsByCurrency[currency].map(account => {
                    const saldo = getAccountBalance(account.id);
                    // Iniciais da conta
                    const initials = account.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
                    // Tipo da conta (mock, pois não está no objeto Account)
                    const tipo = 'Conta';
                    return (
                      <div key={account.id} className="bg-white rounded-2xl shadow flex flex-col px-8 py-6 gap-4 border border-gray-100 min-h-[170px] justify-between">
                        <div className="flex items-center gap-4">
                          {/* Círculo colorido com iniciais */}
                          <span className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ background: account.color || '#22c55e' }}>{initials}</span>
                          <div className="flex flex-col flex-1">
                            <span className="text-lg font-bold text-gray-900">{account.name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            className="p-2 rounded hover:bg-blue-50 text-blue-600"
                            title="Editar conta"
                            onClick={() => handleEditAccount(account)}
                          >
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 0 0 .707-.293l9.414-9.414a2 2 0 0 0 0-2.828l-2.172-2.172a2 2 0 0 0-2.828 0L4.293 15.293A1 1 0 0 0 4 16v4z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                            title="Excluir conta"
                            onClick={() => handleDeleteAccount(account)}
                          >
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-7 0h10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Modal de formulário */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-2xl relative">
              <button
                onClick={handleCancelForm}
                className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-3xl"
                title="Fechar"
              >
                &times;
              </button>
              <AccountForm
                account={editingAccount || undefined}
                onSubmit={handleSubmitForm}
                onCancel={handleCancelForm}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
        {/* Modal de confirmação de exclusão */}
        {deletingAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Excluir conta</h2>
              <p className="mb-6">Tem certeza que deseja excluir a conta <span className="font-semibold">{deletingAccount.name}</span>?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelDeleteAccount}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  disabled={isLoading}
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

export default AccountsPage; 