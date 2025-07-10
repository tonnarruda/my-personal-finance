import React, { useState } from 'react';

interface ModernResultCardProps {
  receitas: number;
  despesas: number;
  resultado: number;
  currency: string;
  percentChange?: number;
  hasHistoricalData?: boolean;
  // Dados para tooltip
  resultadoMesAnterior?: number;
}

const ModernResultCard: React.FC<ModernResultCardProps> = ({
  receitas,
  despesas,
  resultado,
  currency,
  percentChange = 0,
  hasHistoricalData = false,
  resultadoMesAnterior = 0,
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const isPositive = resultado >= 0;
    const isGrowing = percentChange > 0;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const getTooltipContent = () => {
      const changeText = isGrowing ? 'melhora' : 'piora';
      const arrow = isGrowing ? '↗' : '↘';
      
      return (
        <div className="text-xs">
          <div className="font-semibold mb-1">Resultado Mensal - Variação</div>
          <div className="mb-1">
            <span className="text-gray-300">Mês anterior:</span> {formatCurrency(resultadoMesAnterior)}
          </div>
          <div className="mb-1">
            <span className="text-gray-300">Mês atual:</span> {formatCurrency(resultado)}
          </div>
          <div className="mb-1">
            <span className="text-gray-300">Diferença:</span> {formatCurrency(Math.abs(resultado - resultadoMesAnterior))}
          </div>
          <div className="font-semibold">
            {arrow} {changeText} de {Math.abs(percentChange).toFixed(2)}%
          </div>
        </div>
      );
    };

  const resultadoPercent = receitas > 0 ? (resultado / receitas) * 100 : 0;
  const despesasPercent = receitas > 0 ? (despesas / receitas) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 shadow-lg border border-slate-200 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-30 translate-y-4 -translate-x-4" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="text-lg font-bold text-gray-900">Resultado Mensal</h3>
          </div>
          
          {hasHistoricalData && Math.abs(percentChange) >= 0.1 ? (
            <div className="relative">
              <div 
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                  isGrowing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg 
                  className={`w-3 h-3 ${isGrowing ? 'rotate-0' : 'rotate-180'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l7-7 7 7" />
                </svg>
                {Math.abs(percentChange).toFixed(2)}%
              </div>
              
              {showTooltip && (
                <div className="absolute z-20 right-0 top-full mt-2 w-64 bg-gray-900 text-white rounded-lg shadow-lg p-3 pointer-events-none">
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  {getTooltipContent()}
                </div>
              )}
            </div>
          ) : (
            !hasHistoricalData && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Novo
              </div>
            )
          )}
        </div>

        {/* Valor principal */}
        <div className="mb-6">
          <div className={`text-3xl font-bold mb-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(resultado))}
          </div>
          <div className="text-sm text-gray-500">
            {isPositive ? 'Superávit' : 'Déficit'} • {Math.abs(resultadoPercent).toFixed(2)}% das receitas
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Eficiência Financeira</span>
            <span>{Math.max(0, 100 - despesasPercent).toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-700 ${
                isPositive ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, 100 - despesasPercent))}%` }}
            />
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Receitas</div>
            <div className="text-sm font-semibold text-green-600">{formatCurrency(receitas)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Despesas</div>
            <div className="text-sm font-semibold text-red-600">{formatCurrency(despesas)}</div>
          </div>
        </div>

        {/* Indicador visual */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Entrada</span>
            </div>
            <div className="w-4 h-px bg-gray-300" />
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Saída</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernResultCard; 