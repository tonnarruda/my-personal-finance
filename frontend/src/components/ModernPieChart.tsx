import React, { useState } from 'react';
import { Transaction } from '../types/transaction';
import TransactionListModal from './TransactionListModal';
import { useSidebar } from '../contexts/SidebarContext';

interface CategoryData {
  label: string;
  value: number;
  percent: number;
  color: string;
  transactions: Transaction[];
}

interface ModernPieChartProps {
  data: CategoryData[];
  title: string;
  currency: string;
}

const ModernPieChart: React.FC<ModernPieChartProps> = ({ data, title, currency }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const { isCollapsed } = useSidebar();

  // Função para formatar valor em moeda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para calcular coordenadas do gráfico donut
  const calculateDonutSlice = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = {
      inner: {
        x: Math.cos(startAngle) * innerRadius + outerRadius,
        y: Math.sin(startAngle) * innerRadius + outerRadius,
      },
      outer: {
        x: Math.cos(startAngle) * outerRadius + outerRadius,
        y: Math.sin(startAngle) * outerRadius + outerRadius,
      },
    };
    
    const end = {
      inner: {
        x: Math.cos(endAngle) * innerRadius + outerRadius,
        y: Math.sin(endAngle) * innerRadius + outerRadius,
      },
      outer: {
        x: Math.cos(endAngle) * outerRadius + outerRadius,
        y: Math.sin(endAngle) * outerRadius + outerRadius,
      },
    };

    const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
    
    return `
      M ${start.outer.x} ${start.outer.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${end.outer.x} ${end.outer.y}
      L ${end.inner.x} ${end.inner.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${start.inner.x} ${start.inner.y}
      Z
    `;
  };

  // Calcula o total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Gera os caminhos SVG para cada fatia do gráfico
  let currentAngle = -Math.PI / 2; // Começa do topo
  const outerRadius = 90;
  const innerRadius = 60;
  const slices = data.map((item, index) => {
    const angle = (item.value / total) * (2 * Math.PI);
    const path = calculateDonutSlice(currentAngle, currentAngle + angle, innerRadius, outerRadius);
    const result = { path, startAngle: currentAngle, item, index };
    currentAngle += angle;
    return result;
  });

  return (
    <div className="bg-white rounded-2xl shadow p-8">
      <div className="text-xl font-bold text-gray-900 mb-6">{title}</div>
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Gráfico donut */}
        <div className="relative">
          <svg width={180} height={180} viewBox="0 0 180 180">
            {slices.map(({ path, item }, index) => (
              <path
                key={index}
                d={path}
                fill={item.color}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCategory(item)}
              />
            ))}
            {total === 0 && (
              <circle
                cx="90"
                cy="90"
                r={outerRadius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="30"
              />
            )}
          </svg>
          {total === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 text-sm">Sem dados</div>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => setSelectedCategory(item)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.label}</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</div>
                  </div>
                  <div className="text-xs text-gray-500">{item.percent.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de transações */}
      {selectedCategory && (
        <TransactionListModal
          isOpen={selectedCategory !== null}
          onClose={() => setSelectedCategory(null)}
          transactions={selectedCategory.transactions}
          categoryName={selectedCategory.label}
          currency={currency}
          isCollapsed={isCollapsed}
        />
      )}
    </div>
  );
};

export default ModernPieChart; 