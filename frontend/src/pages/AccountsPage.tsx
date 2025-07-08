import React, { useState, useEffect } from 'react';
import AccountForm, { AccountFormData } from '../components/AccountForm';
import { accountService } from '../services/api';
import { CreateAccountRequest, UpdateAccountRequest, Account } from '../types/account';
import { getUser } from '../services/auth';

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

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const data = await accountService.getAllAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError('Erro ao carregar contas');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
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
      fetchAccounts();
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
          is_active: data.is_active,
          user_id: user?.id,
        };
        await accountService.updateAccount(editingAccount.id, req);
        setSuccess('Conta atualizada com sucesso!');
      } else {
        const req: CreateAccountRequest = {
          name: data.name,
          currency: data.currency,
          color: data.color,
          is_active: true,
        };
        await accountService.createAccount(req);
        setSuccess('Conta criada com sucesso!');
      }
      setShowForm(false);
      setEditingAccount(null);
      fetchAccounts();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
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
              + Adicionar Conta
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
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
                <div className="mb-2 ml-1 text-lg font-semibold text-gray-700">{currency}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accountsByCurrency[currency].map(account => (
                    <div key={account.id} className="bg-white rounded-2xl shadow flex items-center px-8 py-4 gap-6 border border-gray-100">
                      {/* Círculo colorido da conta */}
                      <span className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: account.color || '#22c55e' }} />
                      <span className="text-lg font-medium text-gray-900 flex-1">{account.name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 mr-2">{account.currency}</span>
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
                  ))}
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
                  className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  disabled={isLoading}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage; 