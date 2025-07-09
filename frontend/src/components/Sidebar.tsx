import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../services/auth';
import { FiHome, FiRepeat, FiCreditCard, FiTag, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: <FiHome className="w-5 h-5 mr-3" /> },
  { label: 'Transações', to: '/transactions', icon: <FiRepeat className="w-5 h-5 mr-3" /> },
  { label: 'Contas', to: '/accounts', icon: <FiCreditCard className="w-5 h-5 mr-3" /> },
  { label: 'Categorias', to: '/categories', icon: <FiTag className="w-5 h-5 mr-3" /> },
  { label: 'Relatórios', to: '/reports', icon: <FiBarChart2 className="w-5 h-5 mr-3" /> },
  { label: 'Configurações', to: '/configuration', icon: <FiSettings className="w-5 h-5 mr-3" />, disabled: true },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  return (
    <aside className="h-screen w-64 bg-white shadow-lg flex flex-col justify-between py-6 px-4 fixed left-0 top-0 z-50">
      <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl"><svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="6" fill="#111"/><path d="M8 12h8M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></span>
            <span className="text-2xl font-bold text-gray-900 select-none">Financer</span>
          </div>
        <nav className="flex flex-col gap-1">
          {menuItems.map(item => {
            const isActive = location.pathname.startsWith(item.to);
            if (item.disabled) {
              return (
                <span
                  key={item.to}
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium mb-1 text-gray-300 cursor-not-allowed bg-gray-50"
                >
                  {item.icon}
                  {item.label}
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
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-2">
        <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 text-base font-medium px-4 py-2 rounded-lg transition-colors w-full">
          <FiLogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 