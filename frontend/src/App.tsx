import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import AccountsPage from './pages/AccountsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { isAuthenticated } from './services/auth';
import './App.css';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const [showMessage, setShowMessage] = React.useState(true);

  React.useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  if (!isAuthenticated()) {
    if (showMessage) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Acesso não autorizado</h2>
            <p className="text-gray-600 text-lg">Você precisa estar autenticado para acessar esta página.</p>
          </div>
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/transacoes" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
        <Route path="/relatorios" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/contas" element={<PrivateRoute><AccountsPage /></PrivateRoute>} />
        <Route path="/categorias" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
        {/* Redirecionar raiz para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 