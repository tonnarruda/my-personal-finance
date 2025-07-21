import React, { useState, useEffect } from 'react';
import { accountService, exchangeRateService } from '../services/api';
import CurrencyInput from './CurrencyInput';
import AccountSelect from './AccountSelect';
import DateInput from './DateInput';
import { useToast } from '../contexts/ToastContext';
import { RefreshCw } from 'lucide-react';

interface CurrencyTransferFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CurrencyTransferForm: React.FC<CurrencyTransferFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [form, setForm] = useState({
    sourceAccountId: '',
    targetAccountId: '',
    amount: 0,
    fees: 0,
    iof: 0,
    exchangeRate: 0,
    dueDate: new Date().toISOString().split('T')[0],
    competenceDate: new Date().toISOString().split('T')[0],
  });
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sourceCurrency, setSourceCurrency] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    accountService.getAllAccounts().then(accs => {
      setAccounts(Array.isArray(accs) ? accs : []);
    });
  }, []);

  // Atualizar moedas quando as contas forem selecionadas
  useEffect(() => {
    if (form.sourceAccountId) {
      const sourceAcc = accounts.find(acc => acc.id === form.sourceAccountId);
      if (sourceAcc) {
        setSourceCurrency(sourceAcc.currency);
        
        // Limpar conta de destino se ela tiver a mesma moeda da origem
        if (form.targetAccountId) {
          const targetAcc = accounts.find(acc => acc.id === form.targetAccountId);
          if (targetAcc && targetAcc.currency === sourceAcc.currency) {
            handleChange('targetAccountId', '');
            setTargetCurrency('');
          }
        }
      }
    }
    if (form.targetAccountId) {
      const targetAcc = accounts.find(acc => acc.id === form.targetAccountId);
      if (targetAcc) {
        setTargetCurrency(targetAcc.currency);
      }
    }
  }, [form.sourceAccountId, form.targetAccountId, accounts]);

  // Buscar taxa de câmbio automaticamente quando as moedas forem selecionadas
  useEffect(() => {
    if (sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency) {
      fetchExchangeRate();
    }
  }, [sourceCurrency, targetCurrency]);

  const fetchExchangeRate = async () => {
    if (!sourceCurrency || !targetCurrency || sourceCurrency === targetCurrency) {
      return;
    }

    setIsLoadingRate(true);
    try {
      const rate = await exchangeRateService.getExchangeRate(sourceCurrency, targetCurrency);
      handleChange('exchangeRate', rate);
      showSuccess('Taxa de câmbio atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao buscar taxa de câmbio:', error);
      showError('Não foi possível obter a taxa de câmbio atual. Por favor, insira manualmente.');
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.sourceAccountId) newErrors.sourceAccountId = 'Conta de origem obrigatória';
    if (!form.targetAccountId) newErrors.targetAccountId = 'Conta de destino obrigatória';
    if (form.amount <= 0) newErrors.amount = 'Valor deve ser maior que zero';
    if (form.exchangeRate <= 0) newErrors.exchangeRate = 'Taxa de câmbio deve ser maior que zero';
    if (form.fees < 0) newErrors.fees = 'Tarifas não podem ser negativas';
    if (form.iof < 0) newErrors.iof = 'IOF não pode ser negativo';
    if (!form.dueDate) newErrors.dueDate = 'Data obrigatória';
    if (!form.competenceDate) newErrors.competenceDate = 'Competência obrigatória';
    if (form.sourceAccountId === form.targetAccountId) {
      newErrors.targetAccountId = 'Conta de destino deve ser diferente da conta de origem';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calcular valores efetivos
  const effectiveAmount = form.amount - form.fees - form.iof;
  const convertedAmount = effectiveAmount * form.exchangeRate;

  // Função para formatar valor com moeda
  const formatCurrency = (value: number, currency: string) => {
    if (!currency) return value.toFixed(2);
    try {
      return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency 
      });
    } catch (e) {
      return value.toFixed(2);
    }
  };

  // Função para formatar taxa de câmbio
  const formatExchangeRate = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    onSubmit({
      sourceAccountId: form.sourceAccountId,
      targetAccountId: form.targetAccountId,
      amount: form.amount,
      fees: form.fees,
      iof: form.iof,
      exchangeRate: form.exchangeRate,
      effectiveAmount,
      convertedAmount,
      dueDate: form.dueDate,
      competenceDate: form.competenceDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Nova Transferência entre Moedas
        </h2>
      </div>

      {/* Contas - 2 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conta de Origem
          </label>
          <AccountSelect
            value={form.sourceAccountId}
            onChange={(value) => handleChange('sourceAccountId', value)}
            options={[
              { value: '', label: 'Selecione a conta de origem' },
              ...accounts
                .filter(acc => acc.is_active)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(acc => ({ 
                  value: acc.id, 
                  label: `${acc.name} (${acc.currency})` 
                }))
            ]}
            error={!!errors.sourceAccountId}
          />
          {errors.sourceAccountId && (
            <span className="text-xs text-red-500">{errors.sourceAccountId}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conta de Destino
          </label>
          <AccountSelect
            value={form.targetAccountId}
            onChange={(value) => handleChange('targetAccountId', value)}
            options={[
              { value: '', label: 'Selecione a conta de destino' },
              ...accounts
                .filter(acc => {
                  // Filtrar contas ativas, diferentes da origem e com moeda diferente
                  const isActive = acc.is_active;
                  const isDifferentAccount = acc.id !== form.sourceAccountId;
                  const hasDifferentCurrency = sourceCurrency && acc.currency !== sourceCurrency;
                  
                  return isActive && isDifferentAccount && hasDifferentCurrency;
                })
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(acc => ({ 
                  value: acc.id, 
                  label: `${acc.name} (${acc.currency})` 
                }))
            ]}
            error={!!errors.targetAccountId}
          />
          {errors.targetAccountId && (
            <span className="text-xs text-red-500">{errors.targetAccountId}</span>
          )}
        </div>
      </div>

      {/* Valores e Taxas - 3 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor de Envio ({sourceCurrency})
          </label>
          <CurrencyInput
            value={form.amount}
            onChange={(value) => handleChange('amount', value)}
            currency={sourceCurrency}
            error={!!errors.amount}
          />
          {errors.amount && (
            <span className="text-xs text-red-500">{errors.amount}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taxa de Câmbio
            {sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency && (
              <button
                type="button"
                onClick={fetchExchangeRate}
                className="ml-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                disabled={isLoadingRate}
                title="Atualizar taxa de câmbio"
              >
                <RefreshCw className={`w-4 h-4 inline ${isLoadingRate ? 'animate-spin' : ''}`} />
              </button>
            )}
          </label>
          <CurrencyInput
            value={form.exchangeRate}
            onChange={(value) => handleChange('exchangeRate', value)}
            error={!!errors.exchangeRate}
            decimalPlaces={6}
          />
          {errors.exchangeRate && (
            <span className="text-xs text-red-500">{errors.exchangeRate}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Convertido ({targetCurrency})
          </label>
          <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-right text-sm">
            {targetCurrency ? formatCurrency(convertedAmount, targetCurrency) : convertedAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Taxas e Datas - 4 colunas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tarifas ({sourceCurrency})
          </label>
          <CurrencyInput
            value={form.fees}
            onChange={(value) => handleChange('fees', value)}
            currency={sourceCurrency}
            error={!!errors.fees}
          />
          {errors.fees && (
            <span className="text-xs text-red-500">{errors.fees}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IOF ({sourceCurrency})
          </label>
          <CurrencyInput
            value={form.iof}
            onChange={(value) => handleChange('iof', value)}
            currency={sourceCurrency}
            error={!!errors.iof}
          />
          {errors.iof && (
            <span className="text-xs text-red-500">{errors.iof}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <DateInput
            value={form.dueDate}
            onChange={(value) => handleChange('dueDate', value)}
            error={!!errors.dueDate}
            id="transfer-date"
          />
          {errors.dueDate && (
            <span className="text-xs text-red-500">{errors.dueDate}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Competência
          </label>
          <DateInput
            value={form.competenceDate}
            onChange={(value) => handleChange('competenceDate', value)}
            error={!!errors.competenceDate}
            id="transfer-competence"
          />
          {errors.competenceDate && (
            <span className="text-xs text-red-500">{errors.competenceDate}</span>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>Valor Enviado:</div>
          <div className="text-right">
            {sourceCurrency ? formatCurrency(form.amount, sourceCurrency) : form.amount.toFixed(2)}
          </div>
          
          <div>Tarifas:</div>
          <div className="text-right text-red-600">
            {sourceCurrency ? formatCurrency(form.fees, sourceCurrency) : form.fees.toFixed(2)}
          </div>
          
          <div>IOF:</div>
          <div className="text-right text-red-600">
            {sourceCurrency ? formatCurrency(form.iof, sourceCurrency) : form.iof.toFixed(2)}
          </div>
          
          <div>Valor enviado efetivo:</div>
          <div className="text-right font-medium">
            {sourceCurrency ? formatCurrency(effectiveAmount, sourceCurrency) : effectiveAmount.toFixed(2)}
          </div>
          
          <div>Taxa de câmbio:</div>
          <div className="text-right">
            {sourceCurrency && targetCurrency ? (
              `1 ${sourceCurrency} = ${formatExchangeRate(form.exchangeRate)} ${targetCurrency}`
            ) : (
              formatExchangeRate(form.exchangeRate)
            )}
          </div>
          
          <div className="font-medium">Valor Convertido:</div>
          <div className="text-right font-medium text-green-600">
            {targetCurrency ? formatCurrency(convertedAmount, targetCurrency) : convertedAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="mt-3 space-y-2">
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-base font-bold bg-[#f1f3fe] text-[#6366f1] shadow hover:bg-indigo-100 transition disabled:opacity-50"
          disabled={isLoading}
        >
          Realizar Transferência
        </button>
        <button
          type="button"
          className="w-full py-3 rounded-xl text-base font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default CurrencyTransferForm; 