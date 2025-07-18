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
    // Ajusta para o timezone local
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('pt-BR');
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
    const dateA = new Date(a.due_date || a.competence_date || '');
    const dateB = new Date(b.due_date || b.competence_date || '');
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
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center px-3 py-2 text-xs text-gray-500 border-b">
              <div className="flex" style={{ minWidth: '220px' }}>
                <span className="w-24">Lanç.</span>
                <span className="pl-6">Competência</span>
              </div>
              <div className="flex-1">
                <span>Descrição</span>
              </div>
              <div className="w-32 text-center">
                <span>%</span>
              </div>
              <div className="w-32 text-right">
                <span>Valor</span>
              </div>
            </div>

            {/* Transaction List */}
            {sortedTransactions.map(transaction => {
              const subcategoryName = getSubcategoryName(transaction.category_id);
              const dueDate = formatDate(transaction.due_date);
              const competenceDate = transaction.competence_date ? 
                new Date(transaction.competence_date).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : 
                '';
              const percentage = ((transaction.amount / total) * 100).toFixed(1);
              
              return (
                <div
                  key={transaction.id}
                  className="hover:bg-gray-50"
                >
                  <div className="flex items-center px-3 py-1.5">
                    <div className="flex" style={{ minWidth: '220px' }}>
                      <span className="text-sm text-gray-600 w-24">{dueDate}</span>
                      <span className="text-sm text-gray-600 pl-6">{competenceDate}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-900">{transaction.description}</span>
                    </div>
                    <div className="w-32 text-center">
                      <span className="text-sm text-gray-500">{percentage}%</span>
                    </div>
                    <div className="w-32 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </span>
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