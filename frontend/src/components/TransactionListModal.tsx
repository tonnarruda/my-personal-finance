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
    // Buscar todas as categorias quando o modal abrir
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
    // Procura em todas as categorias principais
    for (const mainCategory of categories) {
      // Se é a categoria principal, retorna null
      if (mainCategory.id === categoryId) return null;
      
      // Procura nas subcategorias
      if (mainCategory.subcategories) {
        const subcategory = mainCategory.subcategories.find(sub => sub.id === categoryId);
        if (subcategory) return subcategory.name;
      }
    }
    return null;
  };

  // Agrupa transações por data
  const groupedTransactions = transactions.reduce((groups: { [date: string]: Transaction[] }, transaction) => {
    const date = formatDate(transaction.competence_date || transaction.due_date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  // Ordena as datas (mais recentes primeiro)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'));
    const dateB = new Date(b.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Transações da categoria: {categoryName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Lista de transações */}
        <div className="overflow-y-auto flex-1 -mx-8 px-8">
          {sortedDates.map(date => (
            <div key={date} className="mb-6">
              {/* Data */}
              <div className="sticky top-0 bg-white z-10 py-2 border-b border-gray-200 mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{date}</h3>
              </div>

              {/* Transações do dia */}
              <div className="space-y-3">
                {groupedTransactions[date].map(transaction => {
                  const subcategoryName = getSubcategoryName(transaction.category_id);
                  
                  return (
                    <div
                      key={transaction.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="text-base font-medium text-gray-900 truncate">
                                {transaction.description}
                              </div>
                              {transaction.observation && (
                                <div className="text-sm text-gray-500 truncate">
                                  {transaction.observation}
                                </div>
                              )}
                              {subcategoryName && (
                                <div className="mt-1">
                                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    {subcategoryName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-base font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.is_paid ? 'Pago' : 'Pendente'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {sortedDates.length === 0 && (
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