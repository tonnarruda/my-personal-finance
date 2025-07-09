import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { setUser } from '../services/auth';
import FeedbackToast from '../components/FeedbackToast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, senha);
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setErro(err?.response?.data?.erro || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <span className="text-4xl mb-2"><svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="6" fill="#111"/><path d="M8 12h8M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></span>
          <span className="text-3xl font-bold text-gray-900 select-none">Financer</span>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Bem-vindo de volta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {erro && <FeedbackToast message={erro} type="error" onClose={() => setErro('')} />}
          <button
            type="submit"
            className="w-full px-8 py-4 bg-[#f1f3fe] text-[#6366f1] text-xl font-bold rounded-xl shadow hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Não tem uma conta?</span>
          <Link to="/signup" className="text-blue-600 hover:underline text-sm font-medium">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 