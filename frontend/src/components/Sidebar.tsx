import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../services/auth';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0H7m6 0v6m0 0h6m-6 0H7"/></svg>
  ) },
  { label: 'Transações', to: '/transacoes', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  ) },
  { label: 'Contas', to: '/contas', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
  ) },
  { label: 'Relatórios', to: '/relatorios', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 17v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/><path d="M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
  ) },
  { label: 'Configurações', to: '/configuracoes', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
  ), disabled: true },
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 