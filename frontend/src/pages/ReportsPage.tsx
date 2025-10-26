import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useSidebar } from '../contexts/SidebarContext';
import { transactionService, categoryService, accountService } from '../services/api';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { Account } from '../types/account';
import ModernPieChart from '../components/ModernPieChart';
import TransactionListModal from '../components/TransactionListModal';

interface CategoryReportData {
  label: string;
  value: number;
  percent: number;
  color: string;
  transactions: Transaction[];
}

const ReportsPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('categorias');
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryReportData | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData, accountsData] = await Promise.all([
        transactionService.getAllTransactions(),
        categoryService.getAllCategories(),
        accountService.getAllAccounts(),
      ]);
      
      setTransactions(transactionsData || []);
      setCategories(categoriesData || []);
      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, c => c.toUpperCase());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getTransactionsForMonth = (type: 'income' | 'expense') => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.due_date);
      
      // Buscar a conta da transação para obter a moeda
      const account = accounts.find(a => a.id === transaction.account_id);
      const transactionCurrency = account?.currency || 'BRL';
      
      return transaction.type === type && 
             transactionDate >= startOfMonth && 
             transactionDate <= endOfMonth &&
             transactionCurrency === selectedCurrency;
    });
  };

  const generateCategoryReport = (type: 'income' | 'expense'): CategoryReportData[] => {
    const monthTransactions = getTransactionsForMonth(type);
    
    const categoryMap = new Map<string, { value: number; transactions: Transaction[]; color: string }>();
    
    monthTransactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      const category = categories.find(c => c.id === categoryId);
      
      // Buscar categoria pai se existir
      let parentCategory = category;
      if (category?.parent_id) {
        parentCategory = categories.find(c => c.id === category.parent_id);
      }
      
      const categoryName = parentCategory?.name || 'Sem categoria';
      const categoryColor = parentCategory?.color || '#6b7280';
      
      // Converter de centavos para reais
      const amountInReais = transaction.amount / 100;
      
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        existing.value += amountInReais;
        existing.transactions.push(transaction);
      } else {
        categoryMap.set(categoryName, {
          value: amountInReais,
          transactions: [transaction],
          color: categoryColor
        });
      }
    });

    const total = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.value, 0);
    
    return Array.from(categoryMap.entries()).map(([label, data]) => ({
      label,
      value: data.value,
      percent: total > 0 ? (data.value / total) * 100 : 0,
      color: data.color,
      transactions: data.transactions
    })).sort((a, b) => b.value - a.value);
  };

  const incomeData = generateCategoryReport('income');
  const expenseData = generateCategoryReport('expense');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTotalValue = (data: CategoryReportData[]) => {
    return data.reduce((sum, item) => sum + item.value, 0);
  };

  const handleCategoryClick = (categoryData: CategoryReportData) => {
    setSelectedCategoryForModal(categoryData);
  };

  const handleCloseModal = () => {
    setSelectedCategoryForModal(null);
  };

  const tabs = [
    { id: 'categorias', label: 'Categorias' },
    { id: 'entradas-saidas', label: 'Entradas x Saídas' },
    { id: 'contas', label: 'Contas' },
    { id: 'tags', label: 'Tags' }
  ];

  return (
    <Layout>
      {/* Header fixo */}
      <div
        className={`fixed top-0 bg-white shadow z-50 px-4 sm:px-6 lg:px-8 pt-8 pb-4 transition-all duration-300 ${
          isCollapsed 
            ? 'left-20 w-[calc(100vw-5rem)]' 
            : 'left-64 w-[calc(100vw-16rem)]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-extrabold text-gray-900">Relatórios</h1>
          
          {/* Navegação de mês */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {formatMonthYear(currentDate)}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex space-x-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Espaço para o header fixo */}
      <div className="h-[140px]"></div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'categorias' && (
              <div className="space-y-8">
                {/* Controles */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
                  <div className="flex items-center gap-4">
                    {/* Seletor de Moeda */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Moeda:</label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="BRL">BRL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                      Filtros
                    </button>
                  </div>
                </div>

                {/* Relatório de Despesas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-500 mb-6">Despesas</h4>
                  
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Lista de categorias */}
                    <div className="flex-1">
                      <div className="space-y-3">
                        {expenseData.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            onClick={() => handleCategoryClick(item)}
                          >
                            {/* Ícone da categoria */}
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: item.color }}
                            >
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            
                            {/* Informações */}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{item.label}</div>
                            </div>
                            
                            {/* Valores */}
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-500">{item.percent.toFixed(2)}%</div>
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(getTotalValue(expenseData))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico de rosca */}
                    <div className="lg:w-80">
                      <ModernPieChart
                        data={expenseData}
                        title=""
                        currency={selectedCurrency}
                        showLegend={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Relatório de Receitas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-500 mb-6">Receitas</h4>
                  
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Lista de categorias */}
                    <div className="flex-1">
                      <div className="space-y-3">
                        {incomeData.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            onClick={() => handleCategoryClick(item)}
                          >
                            {/* Ícone da categoria */}
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: item.color }}
                            >
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            
                            {/* Informações */}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{item.label}</div>
                            </div>
                            
                            {/* Valores */}
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-500">{item.percent.toFixed(2)}%</div>
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(getTotalValue(incomeData))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico de rosca */}
                    <div className="lg:w-80">
                      <ModernPieChart
                        data={incomeData}
                        title=""
                        currency={selectedCurrency}
                        showLegend={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'categorias' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-500 text-lg">Em desenvolvimento</div>
                  <div className="text-gray-400 text-sm mt-2">Esta funcionalidade será implementada em breve</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de transações da categoria */}
      {selectedCategoryForModal && (
        <TransactionListModal
          isOpen={selectedCategoryForModal !== null}
          onClose={handleCloseModal}
          transactions={selectedCategoryForModal.transactions}
          categoryName={selectedCategoryForModal.label}
          currency={selectedCurrency}
          isCollapsed={isCollapsed}
        />
      )}
    </Layout>
  );
};

export default ReportsPage; 