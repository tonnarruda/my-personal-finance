import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import AccountsPage from './pages/AccountsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transacoes" element={<TransactionsPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/contas" element={<AccountsPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        {/* Rotas futuras: Transações, Relatórios */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 