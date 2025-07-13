import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../services/auth';
import { FiHome, FiRepeat, FiCreditCard, FiTag, FiBarChart2, FiSettings, FiLogOut, FiChevronLeft, FiChevronRight, FiMenu, FiX } from 'react-icons/fi';

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
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();

  // Bloquear rolagem do body quando o menu está aberto no mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Botão de menu para mobile */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[101] p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`h-screen bg-white shadow-lg flex flex-col justify-between py-6 px-4 fixed left-0 top-0 transition-all duration-300 z-[110]
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0 w-4/5 max-w-xs sm:max-w-sm' : '-translate-x-full lg:translate-x-0'}
          lg:w-${isCollapsed ? '20' : '64'} lg:max-w-none lg:translate-x-0
        `}
        style={{ maxWidth: isMobileOpen ? '320px' : undefined }}
      >
        <div>
          <div className={`flex items-center justify-between mb-6 ${isCollapsed ? 'lg:flex-col lg:items-center lg:gap-4' : ''}`}>
            <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
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
            <div className="flex items-center gap-2">
              {/* Botão de fechar para mobile */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Fechar menu"
              >
                <FiX className="w-5 h-5" />
              </button>
              {/* Botão de colapsar para desktop */}
              <button
                onClick={onToggle}
                className={`hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
                title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              >
                {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <nav className={`flex flex-col gap-1 ${isCollapsed && !isMobileOpen ? 'lg:items-center' : ''}`}>
            {menuItems.map(item => {
              const isActive = location.pathname.startsWith(item.to);
              // Mostrar label se NÃO estiver colapsado OU se for mobile aberto
              const showLabel = !isCollapsed || isMobileOpen;
              if (item.disabled) {
                return (
                  <span
                    key={item.to}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium mb-1 text-gray-300 cursor-not-allowed bg-gray-50 ${
                      isCollapsed && !isMobileOpen ? 'justify-center lg:justify-center' : ''
                    }`}
                    title={isCollapsed && !isMobileOpen ? item.label : ''}
                  >
                    <span className={showLabel ? 'mr-3' : ''}>{item.icon}</span>
                    {showLabel && item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-150 mb-1 ${
                    isActive
                      ? 'bg-gray-100 text-indigo-700 font-bold'
                      : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center lg:justify-center' : ''}`}
                  title={isCollapsed && !isMobileOpen ? item.label : ''}
                >
                  <span className={showLabel ? 'mr-3' : ''}>{item.icon}</span>
                  {showLabel && item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className={`${isCollapsed ? 'px-0' : 'px-2'} ${isCollapsed ? 'lg:flex lg:justify-center' : ''}`}>
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
    </>
  );
};

export default Sidebar; 