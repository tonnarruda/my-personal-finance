import React, { useEffect } from 'react';
import Layout from '../components/Layout';

const ReportsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Relatórios</h1>
        <p className="text-lg text-gray-600">Aqui você pode visualizar relatórios detalhados das suas finanças.</p>
      </div>
    </Layout>
  );
};

export default ReportsPage; 