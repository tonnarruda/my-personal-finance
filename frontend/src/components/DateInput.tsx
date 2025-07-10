import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DateInput.css';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  submitButtonRef?: React.RefObject<HTMLButtonElement>;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  className = "",
  disabled = false,
  error = false,
  id,
  submitButtonRef
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useRef(`date-input-${Math.random().toString(36).substr(2, 9)}`);

  // Converter string para Date
  const stringToDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    // Criar data no fuso horário local para evitar problemas de UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  };

  // Converter Date para string YYYY-MM-DD
  const dateToString = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Formatar data para exibição (DD/MM/YYYY)
  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parsear data digitada pelo usuário
  const parseInputDate = (inputStr: string): Date | null => {
    if (!inputStr) return null;
    
    // Remove caracteres especiais e espaços
    const cleanInput = inputStr.replace(/[^\d]/g, '');
    
    // Tenta diferentes formatos
    if (cleanInput.length === 8) {
      // DDMMYYYY
      const day = parseInt(cleanInput.slice(0, 2), 10);
      const month = parseInt(cleanInput.slice(2, 4), 10);
      const year = parseInt(cleanInput.slice(4, 8), 10);
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }
    
    // Tenta formato com barras DD/MM/YYYY
    const parts = inputStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }
    
    return null;
  };

  // Atualizar selectedDate quando value mudar (externamente)
  useEffect(() => {
    const date = stringToDate(value);
    setSelectedDate(date);
    setInputValue(formatDisplayDate(date));
  }, [value]);

  // Preencher com data atual se não houver valor
  useEffect(() => {
    if (!value && !selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      setInputValue(formatDisplayDate(today));
      onChange(dateToString(today));
    }
  }, []);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setInputValue(formatDisplayDate(date));
    if (date) {
      onChange(dateToString(date));
    } else {
      onChange("");
    }
    // Fecha o calendário após seleção
    setIsOpen(false);
    // Remove o foco do input e foca no botão de confirmar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
      // Foca no botão de confirmar se disponível
      if (submitButtonRef?.current) {
        submitButtonRef.current.focus();
      } else {
        // Fallback: foca no body
        document.body.focus();
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Tenta parsear a data enquanto o usuário digita
    const parsedDate = parseInputDate(newValue);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      onChange(dateToString(parsedDate));
    }
  };

  const handleInputBlur = (e?: React.FocusEvent) => {
    // Quando o usuário sai do campo, tenta formatar a data
    const parsedDate = parseInputDate(inputValue);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setInputValue(formatDisplayDate(parsedDate));
      onChange(dateToString(parsedDate));
    } else if (inputValue && inputValue !== formatDisplayDate(selectedDate)) {
      // Se não conseguiu parsear e há valor, reverte para o último valor válido
      setInputValue(formatDisplayDate(selectedDate));
    }
    
    // Fecha o calendário se estiver aberto
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (!disabled) {
      // Seleciona todo o texto quando o campo recebe foco
      if (inputRef.current) {
        inputRef.current.select();
      }
      // Não abre automaticamente o calendário no foco para permitir digitação
      // setIsOpen(true);
    }
  };

  const handleCalendarClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
      if (submitButtonRef?.current) {
        submitButtonRef.current.focus();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else if (e.key === 'Tab') {
      // Fechar calendário e permitir TAB funcionar normalmente
      setIsOpen(false);
      handleInputBlur();
      // Não prevenir o comportamento padrão do TAB para permitir navegação
    }
  };

  return (
    <div className="relative">
      <div className="relative w-full">
        <input
          ref={inputRef}
          id={id || uniqueId.current}
          className={`w-full pr-12 pl-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-center transition-all duration-150 shadow-sm ${error ? 'border-red-400' : 'border-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={handleFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          autoComplete="off"
          title="Digite a data no formato DD/MM/AAAA ou clique no calendário"
        />
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-gray-600 transition-colors"
          onClick={handleCalendarClick}
          disabled={disabled}
          tabIndex={-1}
          title="Abrir calendário"
        >
          <Calendar size={22} className="text-gray-400" />
        </button>
      </div>
      
      {isOpen && (
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          open={isOpen}
          inline
          dateFormat="dd/MM/yyyy"
          calendarClassName="shadow-lg border border-gray-200 rounded-xl overflow-hidden absolute top-full left-0 z-10 bg-white"
        />
      )}
    </div>
  );
};

export default DateInput; 