import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateInputContextType {
  activeCalendar: string | null;
  setActiveCalendar: (id: string | null) => void;
}

const DateInputContext = createContext<DateInputContextType | undefined>(undefined);

export const DateInputProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCalendar, setActiveCalendar] = useState<string | null>(null);

  return (
    <DateInputContext.Provider value={{ activeCalendar, setActiveCalendar }}>
      {children}
    </DateInputContext.Provider>
  );
};

export const useDateInputContext = () => {
  const context = useContext(DateInputContext);
  if (context === undefined) {
    throw new Error('useDateInputContext must be used within a DateInputProvider');
  }
  return context;
}; 