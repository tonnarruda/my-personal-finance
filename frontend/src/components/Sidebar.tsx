import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../services/auth';
import { FiHome, FiRepeat, FiCreditCard, FiTag, FiBarChart2, FiSettings, FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: <FiHome className="w-5 h-5" /> },
  { label: 'Transações', to: '/transactions', icon: <FiRepeat className="w-5 h-5" /> },
  { label: 'Contas', to: '/accounts', icon: <FiCreditCard className="w-5 h-5" /> },
  { label: 'Categorias', to: '/categories', icon: <FiTag className="w-5 h-5" /> },
  { label: 'Relatórios', to: '/reports', icon: <FiBarChart2 className="w-5 h-5" /> },
  { label: 'Configurações', to: '/configuration', icon: <FiSettings className="w-5 h-5" />, disabled: true },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  
  return (
    <aside className={`h-screen bg-white shadow-lg flex flex-col justify-between py-6 px-4 fixed left-0 top-0 z-50 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="6" fill="#111"/>
                <path d="M8 12h8M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            {!isCollapsed && (
              <span className="text-2xl font-bold text-gray-900 select-none">Financer</span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex flex-col gap-1">
          {menuItems.map(item => {
            const isActive = location.pathname.startsWith(item.to);
            if (item.disabled) {
              return (
                <span
                  key={item.to}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium mb-1 text-gray-300 cursor-not-allowed bg-gray-50 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!isCollapsed && item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-150 mb-1 ${
                  isActive
                    ? 'bg-gray-100 text-indigo-700 font-bold'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                {!isCollapsed && item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className={`${isCollapsed ? 'px-0' : 'px-2'}`}>
        <button 
          onClick={logout} 
          className={`flex items-center text-gray-400 hover:text-indigo-600 text-base font-medium px-4 py-2 rounded-lg transition-colors w-full ${
            isCollapsed ? 'justify-center' : 'gap-2'
          }`}
          title={isCollapsed ? 'Sair' : ''}
        >
          <FiLogOut className="w-5 h-5" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 