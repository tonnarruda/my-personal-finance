import React, { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  error?: boolean;
  decimalPlaces?: number;
  className?: string;
  autoFocus?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency,
  error = false,
  decimalPlaces = 2,
  className = '',
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const multiplier = Math.pow(10, decimalPlaces);

  // Efeito para autofocus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Função para formatar número para exibição
  const formatForDisplay = (num: number): string => {
    const roundedNum = Math.round(num * multiplier) / multiplier;
    return roundedNum.toLocaleString('pt-BR', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  // Atualizar displayValue quando value mudar externamente (apenas quando não está focado)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatForDisplay(value));
    }
  }, [value, decimalPlaces, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, ''); // Remove tudo exceto números
    
    // Limita o número total de dígitos para evitar overflow
    const maxDigits = 15;
    if (raw.length > maxDigits) {
      raw = raw.slice(0, maxDigits);
    }

    // Calcula o valor com base no número de casas decimais
    const numericValue = parseInt(raw || '0', 10) / multiplier;
    
    // Atualiza o valor formatado para exibição
    const formattedValue = formatForDisplay(numericValue);
    setDisplayValue(formattedValue);
    
    // Notifica a mudança
    onChange(numericValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatForDisplay(value));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  return (
    <div className={`relative ${className}`}>
      {currency && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">{currency}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className={`
          w-full px-3 py-2 rounded-lg border text-right
          ${error ? 'border-red-400' : 'border-gray-200'}
          ${currency ? 'pl-12' : 'pl-3'}
          focus:outline-none focus:ring-2 focus:ring-blue-200
          bg-gray-50 text-sm
        `}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default CurrencyInput; 