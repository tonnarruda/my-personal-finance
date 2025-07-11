import React, { useState } from 'react';

interface MetricItem {
  label: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ReactNode;
}

interface ModernMetricsProps {
  receitas: number;
  despesas: number;
  saldo: number;
  currency: string;
  variacaoReceitas?: number;
  variacaoDespesas?: number;
  variacaoSaldo?: number;
  hasHistoricalData?: boolean;
  // Dados para tooltips
  receitaMesAnterior?: number;
  despesaMesAnterior?: number;
  saldoMesAnterior?: number;
}

const ModernMetrics: React.FC<ModernMetricsProps> = ({
  receitas,
  despesas,
  saldo,
  currency,
  variacaoReceitas = 0,
  variacaoDespesas = 0,
  variacaoSaldo = 0,
  hasHistoricalData = false,
  receitaMesAnterior = 0,
  despesaMesAnterior = 0,
  saldoMesAnterior = 0,
  }) => {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const formatCurrency = (value: number) => {
      // Garante que zero seja sempre positivo (evita -0)
      const normalizedValue = value === 0 ? 0 : value;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(normalizedValue);
    };

    const getTooltipContent = (label: string, currentValue: number, previousValue: number, change: number) => {
      const isPositive = change > 0;
      const changeText = isPositive ? 'aumento' : 'redução';
      const arrow = isPositive ? '↗' : '↘';
      
      return (
        <div className="text-xs">
          <div className="font-semibold mb-1">{label} - Variação Mensal</div>
          <div className="mb-1">
            <span className="text-gray-300">Mês anterior:</span> {formatCurrency(previousValue)}
          </div>
          <div className="mb-1">
            <span className="text-gray-300">Mês atual:</span> {formatCurrency(currentValue)}
          </div>
          <div className="mb-1">
            <span className="text-gray-300">Diferença:</span> {formatCurrency(Math.abs(currentValue - previousValue))}
          </div>
          <div className="font-semibold">
            {arrow} {changeText} de {Math.abs(change).toFixed(2)}%
          </div>
        </div>
      );
    };

  const metrics: MetricItem[] = [
    {
      label: 'Receitas',
      value: receitas,
      change: variacaoReceitas,
      trend: variacaoReceitas > 0 ? 'up' : variacaoReceitas < 0 ? 'down' : 'stable',
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'Despesas',
      value: despesas,
      change: variacaoDespesas,
      trend: variacaoDespesas > 0 ? 'up' : variacaoDespesas < 0 ? 'down' : 'stable',
      color: 'red',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
    {
      label: 'Saldo Atual',
      value: saldo,
      change: variacaoSaldo,
      trend: variacaoSaldo > 0 ? 'up' : variacaoSaldo < 0 ? 'down' : 'stable',
      color: saldo >= 0 ? 'blue' : 'red',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        icon: 'text-green-600',
        value: 'text-green-700',
        change: 'bg-green-100 text-green-700',
        border: 'border-green-200',
      },
      red: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        icon: 'text-red-600',
        value: 'text-red-700',
        change: 'bg-red-100 text-red-700',
        border: 'border-red-200',
      },
      blue: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        icon: 'text-blue-600',
        value: 'text-blue-700',
        change: 'bg-blue-100 text-blue-700',
        border: 'border-blue-200',
      },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const colors = getColorClasses(metric.color);
        const isPositiveChange = (metric.change || 0) > 0;
        
        return (
          <div
            key={metric.label}
            className={`${colors.bg} ${colors.border} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}
          >
            {/* Background decorativo */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colors.icon} bg-white/50 flex items-center justify-center shadow-sm`}>
                  {metric.icon}
                </div>
                
                {hasHistoricalData && metric.change !== undefined && Math.abs(metric.change) >= 0.1 ? (
                  <div className="relative">
                    <div 
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                        isPositiveChange ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                      onMouseEnter={() => setActiveTooltip(metric.label)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <svg 
                        className={`w-3 h-3 ${isPositiveChange ? 'rotate-0' : 'rotate-180'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l7-7 7 7" />
                      </svg>
                      {Math.abs(metric.change).toFixed(2)}%
                    </div>
                    
                    {activeTooltip === metric.label && (
                      <div className="absolute z-20 right-0 top-full mt-2 w-64 bg-gray-900 text-white rounded-lg shadow-lg p-3 pointer-events-none">
                        <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        {getTooltipContent(
                          metric.label,
                          metric.value,
                          metric.label === 'Receitas' ? receitaMesAnterior :
                          metric.label === 'Despesas' ? despesaMesAnterior : saldoMesAnterior,
                          metric.change
                        )}
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

              {/* Valor */}
              <div className="mb-2">
                <div className={`text-2xl font-bold ${colors.value} mb-1`}>
                  {formatCurrency(metric.value)}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {metric.label}
                </div>
              </div>

              {/* Barra de progresso animada */}
              <div className="mt-4">
                <div className="w-full bg-white/50 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-1000 delay-${index * 200} ${
                      metric.color === 'green' ? 'bg-green-500' : 
                      metric.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.max(10, (Math.abs(metric.value) / 30000) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Tendência */}
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-600">
                {metric.trend === 'up' && (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l7-7 7 7" />
                    </svg>
                    <span>Crescimento</span>
                  </>
                )}
                {metric.trend === 'down' && (
                  <>
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-7 7-7-7" />
                    </svg>
                    <span>Redução</span>
                  </>
                )}
                {metric.trend === 'stable' && (
                  <>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    <span>Estável</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModernMetrics; 