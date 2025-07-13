import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { setUser } from '../services/auth';
import { useToast } from '../contexts/ToastContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showError } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      showError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, senha);
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      showError(err?.response?.data?.erro || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 lg:p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <span className="text-3xl sm:text-4xl mb-2"><svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="6" fill="#111"/><path d="M8 12h8M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></span>
          <span className="text-2xl sm:text-3xl font-bold text-gray-900 select-none">Financer</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Bem-vindo de volta</h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-[#f1f3fe] text-[#6366f1] text-lg sm:text-xl font-bold rounded-xl shadow hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <span className="text-sm text-gray-500 text-center sm:text-left">Não tem uma conta?</span>
          <Link to="/signup" className="text-blue-600 hover:underline text-sm font-medium text-center sm:text-right">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 