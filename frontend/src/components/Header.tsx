import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Transações', to: '/transacoes' },
  { label: 'Categorias', to: '/categorias' },
  { label: 'Contas', to: '/contas' },
  { label: 'Relatórios', to: '/relatorios' },
];

const Header: React.FC = () => {
  const location = useLocation();
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo e nome */}
          <div className="flex items-center gap-3">
            <span className="text-2xl"><svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="6" fill="#111"/><path d="M8 12h8M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></span>
            <span className="text-2xl font-bold text-gray-900 select-none">Financer</span>
          </div>
          {/* Menu */}
          <nav className="flex gap-10">
            {menuItems.map(item => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 rounded-xl text-lg font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#f1f3fe] text-[#6366f1]'
                      : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {/* Notificação e avatar */}
          <div className="flex items-center gap-6">
            <button className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition" title="Notificações">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </button>
            <span className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 