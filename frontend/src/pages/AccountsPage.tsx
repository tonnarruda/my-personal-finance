import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AccountForm from '../components/AccountForm';
import { accountService, transactionService } from '../services/api';
import { Account } from '../types/account';
import { Transaction } from '../types/transaction';
import { useToast } from '../contexts/ToastContext';
import { useSidebar } from '../contexts/SidebarContext';

const AccountsPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsData, transactionsData] = await Promise.all([
        accountService.getAllAccounts(),
        transactionService.getAllTransactions(),
      ]);
      setAccounts(accountsData || []);
      setTransactions(transactionsData.map(t => ({
        ...t,
        amount: typeof t.amount === 'number' ? t.amount / 100 : 0,
      })));
    } catch (err) {
      showError('Erro ao carregar dados');
      setAccounts([]);
      setTransactions([]);
    }
  };

  // Agrupar contas por currency
  const accountsByCurrency: { [currency: string]: Account[] } = {};
  accounts.forEach(acc => {
    if (!accountsByCurrency[acc.currency]) accountsByCurrency[acc.currency] = [];
    accountsByCurrency[acc.currency].push(acc);
  });
  const currencies = Object.keys(accountsByCurrency);

  // Função para calcular o saldo confirmado (pagos) de uma conta
  function getAccountConfirmedBalance(accountId: string) {
    const balance = transactions
      .filter(tx => tx.account_id === accountId && tx.is_paid)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return balance === 0 ? 0 : balance;
  }

  // Função para calcular o saldo projetado (pagos e não pagos) de uma conta
  function getAccountProjectedBalance(accountId: string) {
    const balance = transactions
      .filter(tx => tx.account_id === accountId)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return balance === 0 ? 0 : balance;
  }

  const handleOpenForm = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingAccount) {
        await accountService.updateAccount(editingAccount.id, data);
        showSuccess('Conta atualizada com sucesso!');
      } else {
        await accountService.createAccount(data);
        showSuccess('Conta criada com sucesso!');
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      showError('Erro ao salvar conta');
    }
  };

  const handleDelete = async (account: Account) => {
    try {
      await accountService.deleteAccount(account.id);
      showSuccess('Conta excluída com sucesso!');
      setAccountToDelete(null);
      fetchData();
    } catch (err) {
      showError('Erro ao excluir conta');
    }
  };

  return (
    <Layout>
      <div className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contas</h1>
          <button
            onClick={handleOpenForm}
            className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nova Conta
          </button>
        </div>

        <p className="text-gray-600 mb-8">
          Aqui você pode visualizar e gerenciar suas contas bancárias e saldos.
        </p>

        {/* Seletor de moeda */}
        <div className="bg-white shadow rounded-2xl p-6 mb-8">
          <div className="flex gap-1 sm:gap-2 mb-4 overflow-x-auto">
            {currencies.map(cur => (
              <button
                key={cur}
                onClick={() => setSelectedCurrency(cur)}
                className={`px-3 sm:px-6 py-2 rounded-xl font-semibold text-sm sm:text-base transition-colors border flex-shrink-0 ${
                  selectedCurrency === cur 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-400' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de contas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accountsByCurrency[selectedCurrency]?.sort((a, b) => a.name.localeCompare(b.name)).map(account => (
            <div key={account.id} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: account.color || '#22c55e' }}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${account.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {account.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setAccountToDelete(account)}
                    className="text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-auto">
                <div className="mb-2">
                  <div className="text-sm text-gray-600">Saldo confirmado</div>
                  <div className="text-lg font-bold text-gray-900">
                    {getAccountConfirmedBalance(account.id).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: account.currency 
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Saldo projetado</div>
                  <div className="text-lg font-bold text-gray-900">
                    {getAccountProjectedBalance(account.id).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: account.currency 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de formulário */}
        {showForm && (
          <div className={`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
              <button onClick={handleCloseForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <AccountForm account={editingAccount || undefined} onSubmit={handleSubmit} onCancel={handleCloseForm} />
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {accountToDelete && (
          <div className={`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmar exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir a conta "{accountToDelete.name}"? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setAccountToDelete(null)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(accountToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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