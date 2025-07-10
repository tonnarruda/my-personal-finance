import React, { useState, useEffect } from 'react';

interface ChartData {
  receitas: number;
  despesas: number;
  currency: string;
}

interface ModernChartProps {
  data: ChartData;
  height?: number;
  width?: number;
}

const ModernChart: React.FC<ModernChartProps> = ({ 
  data, 
  height = 300, 
  width = 400 
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<'receitas' | 'despesas' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [data]);

  const maxValue = Math.max(data.receitas, data.despesas, 1);
  const padding = 60;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  const barWidth = 80;
  const barSpacing = 120;
  const startX = padding + (chartWidth - (barWidth * 2 + barSpacing)) / 2;
  
  const receitasHeight = (data.receitas / maxValue) * chartHeight * animationProgress;
  const despesasHeight = (data.despesas / maxValue) * chartHeight * animationProgress;
  
  const receitasBarY = padding + chartHeight - receitasHeight;
  const despesasBarY = padding + chartHeight - despesasHeight;
  
  const resultado = data.receitas - data.despesas;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resultadoColor = resultado >= 0 ? '#22c55e' : '#ef4444';
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: data.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };
  
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => {
    const value = (maxValue / 4) * i;
    return {
      value,
      y: padding + chartHeight - (value / maxValue) * chartHeight,
      label: formatValue(value)
    };
  });

  return (
    <div className="relative">
      <svg 
        width={width} 
        height={height} 
        className="drop-shadow-sm"
        style={{ overflow: 'visible' }}
      >
        {/* Definições de gradientes */}
        <defs>
          <linearGradient id="receitasGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
          </linearGradient>
          
          <linearGradient id="despesasGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
          </linearGradient>
          
          <linearGradient id="receitasGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.1" />
          </linearGradient>
          
          <linearGradient id="despesasGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.1" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid horizontal */}
        {yAxisTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding}
              y1={tick.y}
              x2={width - padding}
              y2={tick.y}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <text
              x={padding - 10}
              y={tick.y + 4}
              fontSize="11"
              fill="#64748b"
              textAnchor="end"
              fontWeight="500"
            >
              {tick.label}
            </text>
          </g>
        ))}
        
        {/* Barra de receitas */}
        <g>
          {/* Sombra/Glow */}
          <rect
            x={startX - 2}
            y={receitasBarY - 2}
            width={barWidth + 4}
            height={receitasHeight + 4}
            fill="url(#receitasGlowGradient)"
            rx="6"
            filter="url(#glow)"
          />
          
          {/* Barra principal */}
          <rect
            x={startX}
            y={receitasBarY}
            width={barWidth}
            height={receitasHeight}
            fill="url(#receitasGradient)"
            rx="4"
            style={{
              transition: 'all 0.3s ease',
              transform: hoveredBar === 'receitas' ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'bottom center'
            }}
            onMouseEnter={() => setHoveredBar('receitas')}
            onMouseLeave={() => setHoveredBar(null)}
          />
          
          {/* Valor no topo da barra */}
          <text
            x={startX + barWidth / 2}
            y={receitasBarY - 10}
            fontSize="12"
            fill="#22c55e"
            textAnchor="middle"
            fontWeight="600"
          >
            {formatCurrency(data.receitas)}
          </text>
        </g>
        
        {/* Barra de despesas */}
        <g>
          {/* Sombra/Glow */}
          <rect
            x={startX + barWidth + barSpacing - 2}
            y={despesasBarY - 2}
            width={barWidth + 4}
            height={despesasHeight + 4}
            fill="url(#despesasGlowGradient)"
            rx="6"
            filter="url(#glow)"
          />
          
          {/* Barra principal */}
          <rect
            x={startX + barWidth + barSpacing}
            y={despesasBarY}
            width={barWidth}
            height={despesasHeight}
            fill="url(#despesasGradient)"
            rx="4"
            style={{
              transition: 'all 0.3s ease',
              transform: hoveredBar === 'despesas' ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'bottom center'
            }}
            onMouseEnter={() => setHoveredBar('despesas')}
            onMouseLeave={() => setHoveredBar(null)}
          />
          
          {/* Valor no topo da barra */}
          <text
            x={startX + barWidth + barSpacing + barWidth / 2}
            y={despesasBarY - 10}
            fontSize="12"
            fill="#ef4444"
            textAnchor="middle"
            fontWeight="600"
          >
            {formatCurrency(data.despesas)}
          </text>
        </g>
        
        {/* Labels das barras */}
        <text
          x={startX + barWidth / 2}
          y={height - 20}
          fontSize="14"
          fill="#1f2937"
          textAnchor="middle"
          fontWeight="600"
        >
          Receitas
        </text>
        
        <text
          x={startX + barWidth + barSpacing + barWidth / 2}
          y={height - 20}
          fontSize="14"
          fill="#1f2937"
          textAnchor="middle"
          fontWeight="600"
        >
          Despesas
        </text>
      </svg>
      
      {/* Resultado mensal */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
        <div className="text-xs text-gray-500 font-medium mb-1">Resultado Mensal</div>
        <div className={`text-lg font-bold ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(Math.abs(resultado))}
        </div>
        <div className="text-xs text-gray-400">
          {resultado >= 0 ? 'Superávit' : 'Déficit'}
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredBar && (
        <div className="absolute top-0 left-0 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium pointer-events-none z-10">
          {hoveredBar === 'receitas' ? (
            <div>
              <div className="font-semibold text-green-400">Receitas</div>
              <div>{formatCurrency(data.receitas)}</div>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-red-400">Despesas</div>
              <div>{formatCurrency(data.despesas)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModernChart; 