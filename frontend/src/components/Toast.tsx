import React, { useState, useEffect } from 'react';
import { Toast as ToastType } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 10);
    
    // Animação de saída antes de fechar
    const closeTimeout = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(toast.id), 300);
    }, (toast.duration || 5000) - 300);

    return () => clearTimeout(closeTimeout);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "mb-4 p-4 rounded-lg shadow-lg border flex items-center justify-between max-w-md w-full";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        transition-all duration-300 transform
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-center flex-1">
        <span className="text-xl mr-3">{getIcon()}</span>
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="ml-4 text-gray-400 hover:text-gray-600 text-xl font-bold focus:outline-none"
        title="Fechar"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast; 