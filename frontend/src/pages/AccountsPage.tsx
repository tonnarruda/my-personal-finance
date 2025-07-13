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
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData.map(normalizeTransaction) : []);
    } catch (err) {
      setAccounts([]);
      setTransactions([]);
      showError('Erro ao buscar dados.');
    }
  };

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

  // Função para calcular o saldo confirmado (pagos) de uma conta
  const getAccountConfirmedBalance = (accountId: string) => {
    const balance = transactions
      .filter(tx => tx.account_id === accountId && tx.is_paid)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return balance === 0 ? 0 : balance;
  };

  // Função para calcular o saldo projetado (pagos e não pagos) de uma conta
  const getAccountProjectedBalance = (accountId: string) => {
    const balance = transactions
      .filter(tx => tx.account_id === accountId)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return balance === 0 ? 0 : balance;
  };

  const handleOpenForm = (account: Account | null = null) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditingAccount(null);
    setShowForm(false);
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
      showError('Erro ao salvar conta.');
    }
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete(account);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await accountService.deleteAccount(accountToDelete.id);
      showSuccess('Conta excluída com sucesso!');
      setAccountToDelete(null);
      fetchData();
    } catch (err) {
      showError('Erro ao excluir conta.');
    }
  };

  return (
    <Layout>
      <div className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Contas</h1>
            <p className="mt-2 text-lg text-gray-600">Aqui você pode visualizar e gerenciar suas contas bancárias e saldos.</p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            + Adicionar Conta
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accounts.map(account => (
            <div key={account.id} className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between" style={{ borderColor: account.color, borderTop: `4px solid ${account.color}`}}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-800">{account.name}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${account.color}20`, color: account.color }}>
                    {account.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: account.currency }).format(getAccountConfirmedBalance(account.id))}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Saldo confirmado</p>
                  <p className="text-xl font-bold text-gray-700 mt-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: account.currency }).format(getAccountProjectedBalance(account.id))}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Saldo projetado</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={() => handleOpenForm(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(account)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m-7-7h10" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className={`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
              <button onClick={handleCloseForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <AccountForm account={editingAccount || undefined} onSubmit={handleSubmit} onCancel={handleCloseForm} />
            </div>
          </div>
        )}

        {accountToDelete && (
          <div className={`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmar exclusão</h3>
              <p className="text-gray-600 mb-6">Tem certeza que deseja excluir a conta "{accountToDelete.name}"?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setAccountToDelete(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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