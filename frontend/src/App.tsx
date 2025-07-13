import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import { isAuthenticated } from './services/auth';
import ToastContainer from './components/ToastContainer';
import './App.css';

const App: React.FC = () => {
  useEffect(() => {
    // Verificar se o PWA está funcionando
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker suportado');
    } else {
      console.log('❌ Service Worker não suportado');
    }

    // Verificar se o manifesto está carregado
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log('✅ Manifesto encontrado:', manifestLink.getAttribute('href'));
    } else {
      console.log('❌ Manifesto não encontrado');
    }

    // Verificar se os ícones estão carregados
    const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
    console.log('✅ Ícones Apple Touch encontrados:', appleTouchIcons.length);
  }, []);

  return (
    <Router>
      <ToastProvider>
        <SidebarProvider>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                isAuthenticated() ? (
                  <Layout>
                    <DashboardPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated() ? (
                  <Layout>
                    <DashboardPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/accounts"
              element={
                isAuthenticated() ? (
                  <Layout>
                    <AccountsPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/categories"
              element={
                isAuthenticated() ? (
                  <Layout>
                    <CategoriesPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/transactions"
              element={
                isAuthenticated() ? (
                  <Layout>
                    <TransactionsPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/reports"
              element={
                isAuthenticated() ? (
                  <Layout>
                    <ReportsPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </SidebarProvider>
      </ToastProvider>
    </Router>
  );
};

export default App; 