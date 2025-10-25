import React, { useState } from 'react';
import { Account } from '../types/account';
import { Category } from '../types/category';
import { ofxService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import OFXClassificationModal from './OFXClassificationModal';

interface OFXImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onImportSuccess: () => void;
}

const OFXImportModal: React.FC<OFXImportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showClassification, setShowClassification] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<any[]>([]);
  const { showSuccess, showError } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é um arquivo OFX
      if (!file.name.toLowerCase().endsWith('.ofx')) {
        showError('Por favor, selecione um arquivo OFX válido.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showError('Por favor, selecione um arquivo OFX.');
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro, fazer preview das transações
      const response = await ofxService.previewOFX(selectedFile);
      
      if (response.success && response.transactions.length > 0) {
        // Armazenar as transações e mostrar modal de classificação
        setPreviewTransactions(response.transactions);
        setShowClassification(true);
      } else {
        showError('Nenhuma transação encontrada no arquivo OFX.');
      }
    } catch (error: any) {
      console.error('Erro ao processar arquivo OFX:', error);
      showError('Erro ao processar arquivo OFX: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      onClose();
    }
  };

  const handleClassificationClose = () => {
    setShowClassification(false);
    setPreviewTransactions([]);
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Importar Arquivo OFX</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Upload de arquivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo OFX *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".ofx"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hidden"
                  id="ofx-file-input"
                />
                <label
                  htmlFor="ofx-file-input"
                  className="cursor-pointer block"
                >
                  {selectedFile ? (
                    <div className="text-green-600">
                      <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Clique para selecionar
                        </span>{' '}
                        ou arraste o arquivo OFX aqui
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas arquivos .ofx são aceitos
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Informações sobre OFX */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Sobre arquivos OFX</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• OFX é um formato padrão para dados financeiros</li>
                <li>• Exporte seu extrato bancário no formato OFX</li>
                <li>• As transações serão importadas automaticamente</li>
                <li>• Transações duplicadas serão ignoradas</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  'Próximo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Classificação */}
      <OFXClassificationModal
        isOpen={showClassification}
        onClose={handleClassificationClose}
        accounts={accounts}
        categories={categories}
        transactions={previewTransactions}
        onImportSuccess={onImportSuccess}
      />
    </div>
  );
};

export default OFXImportModal;
