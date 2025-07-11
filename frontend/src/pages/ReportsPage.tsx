import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import { useSidebar } from '../contexts/SidebarContext';

const ReportsPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Layout>
      {/* Bloco fixo no topo, alinhado ao conteúdo principal */}
      <div
        className={`fixed top-0 bg-white shadow z-50 px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col transition-all duration-300 ${
          isCollapsed 
            ? 'left-20 w-[calc(100vw-5rem)]' 
            : 'left-64 w-[calc(100vw-16rem)]'
        }`}
        style={{ minHeight: 110 }}
      >
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-lg text-gray-600">Aqui você pode visualizar relatórios detalhados das suas finanças.</p>
      </div>
      {/* Espaço para não sobrepor o conteúdo */}
      <div className="h-[110px]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* O restante do conteúdo permanece igual */}
      </div>
    </Layout>
  );
};

export default ReportsPage; 