import React, { useState, useEffect } from 'react';
import { Account } from '../types/account';
import { Category } from '../types/category';
import { ofxService, transactionService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface OFXTransaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  memo: string;
  type: 'income' | 'expense';
}

interface OFXClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  transactions: OFXTransaction[];
  onImportSuccess: () => void;
}

const OFXClassificationModal: React.FC<OFXClassificationModalProps> = ({ 
  isOpen, 
  onClose, 
  accounts, 
  categories, 
  transactions,
  onImportSuccess 
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [classifications, setClassifications] = useState<Record<string, {
    accountId: string;
    categoryId: string;
    type: 'income' | 'expense';
  }>>({});
  const { showSuccess, showError } = useToast();

  if (!isOpen) return null;

  const handleTransactionSelect = (transactionId: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(transactionId);
      // Inicializar classificação com valores padrão
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction && !classifications[transactionId]) {
        setClassifications(prev => ({
          ...prev,
          [transactionId]: {
            accountId: '',
            categoryId: '',
            type: transaction.type, // Usar o tipo da transação OFX como padrão
          }
        }));
      }
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleClassificationChange = (transactionId: string, field: string, value: string) => {
    setClassifications(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        [field]: value,
      }
    }));
  };

  const handleImport = async () => {
    if (selectedTransactions.size === 0) {
      showError('Selecione pelo menos uma transação para importar.');
      return;
    }

    // Verificar se todas as transações selecionadas têm classificação
    for (const transactionId of Array.from(selectedTransactions)) {
      const classification = classifications[transactionId];
      if (!classification?.accountId || !classification?.categoryId) {
        showError('Todas as transações selecionadas devem ter conta e categoria definidas.');
        return;
      }
    }

    setImporting(true);
    try {
      let importedCount = 0;
      let errorCount = 0;

      // Importar cada transação selecionada
      for (const transactionId of Array.from(selectedTransactions)) {
        const transaction = transactions.find(t => t.id === transactionId);
        const classification = classifications[transactionId];
        
        if (!transaction || !classification) {
          errorCount++;
          continue;
        }

        try {
          // Validar se o tipo está correto
          const transactionType = classification.type || transaction.type;
          if (!transactionType || !['income', 'expense', 'transfer'].includes(transactionType)) {
            console.error(`Tipo de transação inválido: ${transactionType} para transação ${transactionId}`);
            errorCount++;
            continue;
          }

          // Formatar data para evitar problemas de timezone
          const formatDateForBackend = (dateStr: string) => {
            if (!dateStr) return new Date().toISOString();
            
            // Se já está no formato ISO, retorna como está
            if (dateStr.includes('T') && dateStr.includes('Z')) {
              return dateStr;
            }
            
            // Se está no formato YYYY-MM-DD, adiciona T03:00:00Z (horário de Brasília)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return `${dateStr}T03:00:00Z`;
            }
            
            // Para outros formatos, converte para Date e depois para ISO com timezone de Brasília
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
              return new Date().toISOString();
            }
            
            // Adiciona 3 horas para compensar o timezone de Brasília (UTC-3)
            const brasiliaDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
            return brasiliaDate.toISOString();
          };

          // Criar a transação no formato esperado pelo backend
          const transactionData = {
            description: transaction.description || transaction.memo || 'Transação importada',
            amount: Math.abs(transaction.amount) * 100, // Converter para centavos (backend espera centavos)
            type: transactionType,
            category_id: classification.categoryId,
            account_id: classification.accountId,
            due_date: formatDateForBackend(transaction.date),
            competence_date: formatDateForBackend(transaction.date),
            is_paid: true, // Transações importadas são consideradas pagas
            observation: `Importado via OFX - ${transaction.id}`,
            is_recurring: false,
          };

          console.log('Enviando transação:', transactionData);
          await transactionService.createTransaction(transactionData);
          importedCount++;
        } catch (error) {
          console.error(`Erro ao importar transação ${transactionId}:`, error);
          errorCount++;
        }
      }

      if (importedCount > 0) {
        showSuccess(`${importedCount} transações importadas com sucesso!`);
        onImportSuccess();
        onClose();
      } else {
        showError('Nenhuma transação foi importada. Verifique os dados e tente novamente.');
      }

      if (errorCount > 0) {
        showError(`${errorCount} transações falharam na importação.`);
      }
    } catch (error: any) {
      console.error('Erro ao importar transações:', error);
      showError('Erro ao importar transações.');
    } finally {
      setImporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Classificar Transações OFX
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl"
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de Transações */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    Exibir apenas transações pendentes de classificação ({selectedTransactions.size})
                  </span>
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    selectedTransactions.has(transaction.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleTransactionSelect(transaction.id, !selectedTransactions.has(transaction.id))}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.has(transaction.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTransactionSelect(transaction.id, e.target.checked);
                      }}
                      className="mr-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </span>
                        <span className={`text-sm font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(transaction.date)} • {transaction.memo}
                      </div>
                    </div>
                    {!classifications[transaction.id]?.accountId && (
                      <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">!</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de Classificação */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button className="text-blue-600 border-b-2 border-blue-600 pb-1 text-sm font-medium">
                  Classificar para importação
                </button>
                <button className="text-gray-500 pb-1 text-sm font-medium">
                  Escolher lançamentos para conciliar
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {selectedTransactions.size > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    {selectedTransactions.size} transação(ões) selecionada(s)
                  </div>
                  
                  {Array.from(selectedTransactions).map((transactionId) => {
                    const transaction = transactions.find(t => t.id === transactionId);
                    if (!transaction) return null;

                    return (
                      <div key={transactionId} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-900 mb-3">
                          {transaction.description}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tipo
                            </label>
                            <select
                              value={classifications[transactionId]?.type || transaction.type}
                              onChange={(e) => handleClassificationChange(transactionId, 'type', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-sm"
                            >
                              <option value="expense">Despesa</option>
                              <option value="income">Receita</option>
                              <option value="transfer">Transferência</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Valor
                            </label>
                            <input
                              type="text"
                              value={formatCurrency(transaction.amount)}
                              readOnly
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Data
                            </label>
                            <input
                              type="text"
                              value={formatDate(transaction.date)}
                              readOnly
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Conta *
                            </label>
                            <select
                              value={classifications[transactionId]?.accountId || ''}
                              onChange={(e) => handleClassificationChange(transactionId, 'accountId', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-sm"
                            >
                              <option value="">Selecione uma conta</option>
                              {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.name} ({account.currency})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Categoria *
                            </label>
                            <select
                              value={classifications[transactionId]?.categoryId || ''}
                              onChange={(e) => handleClassificationChange(transactionId, 'categoryId', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-sm"
                            >
                              <option value="">Selecione uma categoria</option>
                              {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <p>Selecione uma transação para classificar</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || selectedTransactions.size === 0}
                  className={`px-6 py-2 rounded-lg text-white font-semibold transition ${
                    importing || selectedTransactions.size === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {importing ? 'Importando...' : `Importar ${selectedTransactions.size} transação(ões)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OFXClassificationModal;
