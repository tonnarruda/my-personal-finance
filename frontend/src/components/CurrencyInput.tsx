import React, { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

const currencySymbols: Record<string, string> = { 
  BRL: 'R$', 
  USD: 'US$', 
  EUR: '€', 
  GBP: '£' 
};

const currencyPlaceholders: Record<string, string> = {
  BRL: '0,00',
  USD: '0.00',
  EUR: '0,00',
  GBP: '0.00',
};

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'BRL',
  placeholder,
  className = '',
  error = false,
  disabled = false,
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const symbol = currencySymbols[currency] || '';
  const defaultPlaceholder = currencyPlaceholders[currency] || '0,00';

  // Foco automático
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Formata número para exibição
  const formatForDisplay = (num: number): string => {
    if (isNaN(num)) return '';
    if (currency === 'BRL' || currency === 'EUR') {
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Atualiza displayValue quando value muda externamente (apenas quando não está focado)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatForDisplay(value));
    }
  }, [value, currency, isFocused]);

  // Digitação tipo calculadora de banco
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, ''); // só números
    if (raw.length > 15) raw = raw.slice(0, 15); // Limite de dígitos
    let cents = parseInt(raw || '0', 10);
    let floatValue = cents / 100;
    setDisplayValue(formatForDisplay(floatValue));
    onChange(floatValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatForDisplay(value));
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Seleciona tudo ao focar
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 font-semibold">{symbol}</span>
      <input
        type="text"
        ref={inputRef}
        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-right ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${className}`}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder || defaultPlaceholder}
        disabled={disabled}
        inputMode="numeric"
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default CurrencyInput; 