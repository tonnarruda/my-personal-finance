import React from 'react';

interface FeedbackToastProps {
  message: string;
  type: 'success' | 'error';
  className?: string;
  onClose?: () => void;
}

const colorMap = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
  },
};

const FeedbackToast: React.FC<FeedbackToastProps> = ({ message, type, className = '', onClose }) => {
  if (!message) return null;
  return (
    <div
      className={`mb-6 ${colorMap[type].bg} ${colorMap[type].border} border rounded-md p-4 flex items-center justify-between shadow ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <p className={`text-sm ${colorMap[type].text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 text-lg font-bold focus:outline-none"
          title="Fechar"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default FeedbackToast; 