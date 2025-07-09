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

  // Atualizar selectedDate quando value mudar (externamente)
  useEffect(() => {
    const date = stringToDate(value);
    setSelectedDate(date);
  }, [value]);

  // Preencher com data atual se não houver valor
  useEffect(() => {
    if (!value && !selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      onChange(dateToString(today));
    }
  }, []);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
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

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Pequeno delay para permitir clicar no calendário
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Formatar data para exibição
  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        open={isOpen}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholderText={placeholder}
        disabled={disabled}
        dateFormat="dd/MM/yyyy"
        showPopperArrow={false}
        customInput={
          <div className="relative w-full">
            <input
              ref={inputRef}
              id={id || uniqueId.current}
              className={`w-full pr-12 pl-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-center cursor-pointer transition-all duration-150 shadow-sm ${error ? 'border-red-400' : 'border-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
              readOnly
              value={formatDisplayDate(selectedDate)}
              placeholder={placeholder}
              disabled={disabled}
              onClick={handleClick}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar size={22} className="text-gray-400" />
            </span>
          </div>
        }
        calendarClassName="shadow-lg border border-gray-200 rounded-xl overflow-hidden"
      />
    </div>
  );
};

export default DateInput; 