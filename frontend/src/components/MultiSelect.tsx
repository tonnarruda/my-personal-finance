import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: string;
  label: React.ReactNode;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione as opções',
  className = '',
  error = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleOptionClick = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectedCount = value.length;
  const displayText = selectedCount > 0
    ? `${selectedCount} ${selectedCount === 1 ? 'conta selecionada' : 'contas selecionadas'}`
    : placeholder;

  return (
    <div 
      ref={selectRef}
      className={`relative ${className}`}
    >
      <button
        type="button"
        className={`w-full px-4 py-3 rounded-xl border text-left focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'} ${
          isOpen ? 'ring-2 ring-blue-200 border-blue-300' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="select-label"
      >
        <div className="flex items-center justify-between">
          <span className={`${selectedCount > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
            {displayText}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          <ul 
            className="py-1"
            role="listbox"
            aria-labelledby="select-label"
          >
            {options.map((option) => (
              <li
                key={option.value}
                className="px-4 py-2 cursor-pointer transition-colors hover:bg-gray-50"
                role="option"
                aria-selected={value.includes(option.value)}
                tabIndex={0}
                onClick={(e) => handleOptionClick(option.value, e)}
              >
                {option.label}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-4 py-2 text-gray-500 text-center">
                Nenhuma opção disponível
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelect; 