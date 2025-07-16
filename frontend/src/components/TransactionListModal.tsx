import React, { useEffect, useState } from 'react';
import { Transaction } from '../types/transaction';
import { Category } from '../types/category';
import { categoryService } from '../services/api';

interface TransactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categoryName: string;
  currency: string;
  isCollapsed: boolean;
}

const TransactionListModal: React.FC<TransactionListModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categoryName,
  currency,
  isCollapsed
}) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const incomeCategories = await categoryService.getCategoriesWithSubcategories('income');
          const expenseCategories = await categoryService.getCategoriesWithSubcategories('expense');
          setCategories([...incomeCategories, ...expenseCategories]);
        } catch (err) {
          console.error('Erro ao buscar categorias:', err);
          setCategories([]);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  // Adiciona listener para tecla ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Função para formatar data
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar valor
  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para obter o nome da subcategoria
  const getSubcategoryName = (categoryId: string): string | null => {
    for (const mainCategory of categories) {
      if (mainCategory.id === categoryId) return null;
      if (mainCategory.subcategories) {
        const subcategory = mainCategory.subcategories.find(sub => sub.id === categoryId);
        if (subcategory) return subcategory.name;
      }
    }
    return null;
  };

  // Calcula o total das transações
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Ordena as transações por data (mais antigas primeiro)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date((a.competence_date || a.due_date) ?? '');
    const dateB = new Date((b.competence_date || b.due_date) ?? '');
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header com total */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {categoryName}
            </h2>
            <div className="text-lg font-semibold text-gray-700">
              Total: {formatCurrency(total)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Lista de transações */}
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <div className="space-y-1">
            {sortedTransactions.map(transaction => {
              const subcategoryName = getSubcategoryName(transaction.category_id);
              const date = formatDate(transaction.competence_date || transaction.due_date);
              
              return (
                <div
                  key={transaction.id}
                  className="hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {date}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {transaction.description}
                          {subcategoryName && (
                            <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {subcategoryName}
                            </span>
                          )}
                        </div>
                        {transaction.observation && (
                          <div className="text-xs text-gray-500 truncate">
                            {transaction.observation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        transaction.is_paid 
                          ? transaction.type === 'income' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma transação encontrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionListModal; 