import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const SignupPage: React.FC = () => {
  const [nome, setNome] = useState('');
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
    if (!nome || !email || !senha) {
      showError('Preencha todos os campos.');
      return;
    }
    if (senha.length < 8) {
      showError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await signup(nome, email, senha);
      navigate('/login');
    } catch (err: any) {
      showError(err?.response?.data?.erro || 'Erro ao cadastrar.');
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
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Criar conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Seu nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
              placeholder="Mínimo 8 caracteres"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-8 py-4 bg-[#f1f3fe] text-[#6366f1] text-xl font-bold rounded-xl shadow hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Já tem uma conta?</span>
          <Link to="/login" className="text-blue-600 hover:underline text-sm font-medium">Entrar</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 