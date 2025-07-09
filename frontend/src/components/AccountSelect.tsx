import React, { useState, useRef, useEffect } from 'react';

interface AccountOption {
  value: string;
  label: string;
}

interface AccountSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AccountOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

const AccountSelect: React.FC<AccountSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione uma conta',
  className = '',
  error = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

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
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        break;
    }
  };

  const handleOptionClick = (option: AccountOption) => {
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, option: AccountOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionClick(option);
    }
  };

  return (
    <div 
      ref={selectRef}
      className={`relative ${className}`}
    >
      <button
        type="button"
        className={`w-full px-4 py-3 rounded-xl border text-left focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all shadow-sm ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300 hover:bg-gray-100 hover:shadow-md'} ${
          isOpen ? 'ring-2 ring-blue-200 border-blue-300 bg-blue-50 shadow-md' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="select-label"
      >
        <div className="flex items-center justify-between">
          <span className={`${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'} flex items-center`}>
            {selectedOption ? selectedOption.label : placeholder}
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
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-auto backdrop-blur-sm">
          <ul 
            className="py-2"
            role="listbox"
            aria-labelledby="select-label"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                className={`cursor-pointer transition-all duration-200 px-4 py-3 font-medium border-b border-gray-100 last:border-b-0 ${
                  option.value === value 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-3 border-blue-500'
                    : highlightedIndex === index 
                    ? 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-900'
                    : 'text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-900'
                }`}
                onClick={() => handleOptionClick(option)}
                onKeyDown={(e) => handleOptionKeyDown(e, option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
                role="option"
                aria-selected={option.value === value}
                tabIndex={0}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccountSelect; 