import React, { useEffect, useState } from 'react';
import { getUser } from '../services/auth';
import api, { accountService } from '../services/api';
import { Account } from '../types/account';

const DashboardPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const user = getUser();
  const receitaMes = 23000;
  const despesaMes = 19500;
  const resultadoMes = receitaMes - despesaMes;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);
  const yTicks = [0, 6000, 12000, 18000, 24000];
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');

  // MOCK: dados para despesas e receitas por categoria
  const despesasPorCategoria = [
    { label: 'Casa/Energia', value: 10000, percent: 49.37, color: '#facc15' },
    { label: 'Transporte/Gasolina', value: 7076.28, percent: 34.94, color: '#f87171' },
    { label: 'Cartão de Crédito', value: 3040.41, percent: 15.01, color: '#64748b' },
    { label: 'Alimentação', value: 138, percent: 0.68, color: '#a78bfa' },
  ];
  const receitasPorCategoria = [
    { label: 'Salário', value: 18000, percent: 78.26, color: '#4ade80' },
    { label: 'Freelance', value: 3000, percent: 13.04, color: '#60a5fa' },
    { label: 'Investimentos', value: 2000, percent: 8.70, color: '#facc15' },
  ];

  // Atualizar dados mockados para serem por currency
  interface CategoriaData { label: string; value: number; percent: number; color: string; }
  interface CurrencyData {
    receitaMes: number;
    despesaMes: number;
    resultadoMes: number;
    despesasPorCategoria: CategoriaData[];
    receitasPorCategoria: CategoriaData[];
  }
  const mockCurrencyData: Record<string, CurrencyData> = {
    BRL: {
      receitaMes: 23000,
      despesaMes: 19500,
      resultadoMes: 23000 - 19500,
      despesasPorCategoria: [
        { label: 'Casa/Energia', value: 10000, percent: 49.37, color: '#facc15' },
        { label: 'Transporte/Gasolina', value: 7076.28, percent: 34.94, color: '#f87171' },
        { label: 'Cartão de Crédito', value: 3040.41, percent: 15.01, color: '#64748b' },
        { label: 'Alimentação', value: 138, percent: 0.68, color: '#a78bfa' },
      ],
      receitasPorCategoria: [
        { label: 'Salário', value: 18000, percent: 78.26, color: '#4ade80' },
        { label: 'Freelance', value: 3000, percent: 13.04, color: '#60a5fa' },
        { label: 'Investimentos', value: 2000, percent: 8.70, color: '#facc15' },
      ],
    },
    USD: {
      receitaMes: 5000,
      despesaMes: 3200,
      resultadoMes: 5000 - 3200,
      despesasPorCategoria: [
        { label: 'Rent', value: 2000, percent: 62.5, color: '#facc15' },
        { label: 'Transport', value: 800, percent: 25, color: '#f87171' },
        { label: 'Food', value: 400, percent: 12.5, color: '#a78bfa' },
      ],
      receitasPorCategoria: [
        { label: 'Salary', value: 4000, percent: 80, color: '#4ade80' },
        { label: 'Freelance', value: 1000, percent: 20, color: '#60a5fa' },
      ],
    },
  };
  const data = mockCurrencyData[selectedCurrency] || mockCurrencyData.BRL;

  useEffect(() => {
    async function fetchNome() {
      if (!user?.id) return;
      try {
        const response = await api.get(`/me?user_id=${user.id}`);
        setNome(response.data.nome);
      } catch (err) {
        setNome(user?.nome || ''); // fallback
      }
    }
    fetchNome();
  }, [user?.id]);

  useEffect(() => {
    async function fetchAccounts() {
      setLoadingAccounts(true);
      try {
        const data = await accountService.getAllAccounts();
        setAccounts(data.filter(acc => acc.is_active));
      } catch (err) {
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    }
    fetchAccounts();
  }, []);

  // Agrupa contas por currency
  const accountsByCurrency: { [currency: string]: Account[] } = {};
  accounts.forEach(acc => {
    if (!accountsByCurrency[acc.currency]) accountsByCurrency[acc.currency] = [];
    accountsByCurrency[acc.currency].push(acc);
  });
  const currencies = Object.keys(accountsByCurrency);

  // MOCK: valores de saldo para cada conta e total
  const mockBalances: Record<string, string> = accounts.reduce((acc, account, idx) => {
    // Exemplo: valores diferentes para cada conta
    acc[account.id] = idx === 0 ? 'R$ 3.193,84' : idx === 1 ? 'R$ 1.023,47' : 'R$ 0,00';
    return acc;
  }, {} as Record<string, string>);
  const mockTotal = 'R$ 4.217,31';

  const accountsForCurrency = accounts.filter(acc => acc.currency === selectedCurrency);
  const totalForCurrency = accountsForCurrency.reduce((sum, acc) => {
    const val = mockBalances[acc.id]?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0';
    return sum + parseFloat(val);
  }, 0);
  const currencySymbols: Record<string, string> = { BRL: 'R$', EUR: '€', USD: 'US$', GBP: '£' };
  const formattedTotal = `${currencySymbols[selectedCurrency] || ''} ${totalForCurrency.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow flex flex-col md:flex-row justify-between items-stretch p-6 md:p-8 gap-8">
          {/* Esquerda: Saudação e Resumo */}
          <div className="flex-1 flex flex-col justify-between gap-6 md:gap-0 md:flex-row md:items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">Olá {nome}</div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <div className="text-center">
                <div className="text-gray-500 text-base">Receitas no mês atual</div>
                <div className="text-green-600 text-2xl font-bold">R$ {receitaMes.toFixed(2).replace('.', ',')}</div>
              </div>
              <div className="hidden md:block border-l border-gray-200 h-10 mx-2" />
              <div className="text-center">
                <div className="text-gray-500 text-base">Despesas no mês atual</div>
                <div className="text-red-600 text-2xl font-bold">R$ {despesaMes.toFixed(2).replace('.', ',')}</div>
              </div>
              <div className="hidden md:block border-l border-gray-200 h-10 mx-2" />
              <div className="flex justify-center items-center">
                <div className="bg-gray-100 rounded-xl p-3">
                  {/* Ícone de gráfico simples */}
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                    <rect width="24" height="24" rx="8" fill="#f3f4f6" />
                    <path d="M7 17V13M12 17V9M17 17V11" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Direita: Acesso rápido */}
          <div className="flex flex-col items-center justify-center min-w-[260px]">
            <div className="text-xl font-semibold text-gray-900 mb-4">Acesso rápido</div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm hover:bg-red-50 transition">
                <span className="text-3xl text-red-500 mb-1">&#8722;</span>
                <span className="text-gray-700 text-sm font-medium mt-1">DESPESA</span>
              </button>
              <button className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm hover:bg-green-50 transition">
                <span className="text-3xl text-green-600 mb-1">&#43;</span>
                <span className="text-gray-700 text-sm font-medium mt-1">RECEITA</span>
              </button>
              <button className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm hover:bg-gray-100 transition">
                <span className="text-2xl text-gray-500 mb-1">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M7 12h10M16 9l3 3-3 3" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                <span className="text-gray-700 text-sm font-medium mt-1">TRANSF.</span>
              </button>
              <button className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm hover:bg-blue-50 transition">
                <span className="text-2xl text-blue-600 mb-1">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                <span className="text-gray-700 text-sm font-medium mt-1">IMPORTAR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Abas de currency */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-2 mb-6">
          {currencies.map(cur => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-6 py-2 rounded-xl font-semibold text-base transition-colors border ${selectedCurrency === cur ? 'bg-indigo-50 text-indigo-700 border-indigo-400' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>
      {/* Cards principais filtrados pela currency selecionada */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
        {/* Card Gráfico */}
        <div className="flex-1 bg-white rounded-2xl shadow p-8 flex flex-col min-w-0">
          <div className="text-xl font-bold text-gray-900 mb-6">Visão Mensal</div>
          <div className="flex-1 flex flex-col justify-center">
            <svg viewBox="0 0 380 240" width="100%" height="240" className="mb-2">
              {/* Grid horizontal */}
              {yTicks.map((y, i) => (
                <g key={y}>
                  <line x1="50" x2="340" y1={200 - (y/24000)*160} y2={200 - (y/24000)*160} stroke="#e5e7eb" strokeWidth="1" />
                  <text x="40" y={205 - (y/24000)*160} fontSize="13" fill="#888" textAnchor="end">{y}</text>
                </g>
              ))}
              {/* Barras */}
              <rect x="90" y={200 - (data.receitaMes/24000)*160} width="60" height={(data.receitaMes/24000)*160} fill="#a5b4fc" rx="4" />
              <rect x="210" y={200 - (data.despesaMes/24000)*160} width="60" height={(data.despesaMes/24000)*160} fill="#a5b4fc" rx="4" />
              {/* Labels X */}
              <text x="120" y="225" fontSize="15" fill="#666" textAnchor="middle">Receitas</text>
              <text x="240" y="225" fontSize="15" fill="#666" textAnchor="middle">Despesas</text>
            </svg>
          </div>
        </div>
        {/* Card Saldos de Caixa */}
        <div className="flex-1 bg-white rounded-2xl shadow p-8 flex flex-col min-w-0">
          <div className="text-xl font-bold text-gray-900 mb-6">Saldos de caixa</div>
          <div className="w-full overflow-x-auto">
            <div className="mb-2 ml-1 text-lg font-semibold text-gray-700">{selectedCurrency}</div>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="font-medium text-gray-700 pb-2"></th>
                  <th className="font-semibold text-gray-500 pb-2">Confirmado</th>
                  <th className="font-semibold text-gray-500 pb-2">Projetado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accountsForCurrency.map((account, idx) => (
                  <tr key={account.id}>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: account.color || '#22c55e' }}>
                          {account.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-gray-800 text-base">{account.name}</span>
                      </span>
                    </td>
                    <td className="py-3 text-green-600 font-semibold text-base">{mockBalances[account.id] || 'R$ 0,00'}</td>
                    <td className="py-3 text-green-600 font-semibold text-base">{mockBalances[account.id] || 'R$ 0,00'}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-3 text-gray-900">Total</td>
                  <td className="py-3 text-green-600">{formattedTotal}</td>
                  <td className="py-3 text-green-600">{formattedTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Cards de pizza por categoria filtrados pela currency */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Despesas por categoria */}
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col md:flex-row items-center min-w-0">
          <div className="flex-1 flex items-center justify-center">
            {/* Gráfico donut SVG */}
            <svg width="180" height="180" viewBox="0 0 36 36" className="block">
              {(() => {
                let acc = 0;
                return data.despesasPorCategoria.map((cat: CategoriaData, i: number) => {
                  const val = (cat.percent / 100) * 100;
                  const dasharray = `${val} ${100 - val}`;
                  const dashoffset = 25 - acc;
                  acc += val;
                  return (
                    <circle
                      key={cat.label}
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="3"
                      strokeDasharray={dasharray}
                      strokeDashoffset={dashoffset}
                      style={{ transition: 'stroke-dasharray 0.3s' }}
                    />
                  );
                });
              })()}
            </svg>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2 ml-6">
            {data.despesasPorCategoria.map((cat: CategoriaData) => (
              <div key={cat.label} className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                <span className="text-gray-700 text-base">{cat.label}</span>
                <span className="bg-gray-100 text-xs font-semibold rounded px-2 py-0.5 ml-2 text-gray-600">{cat.percent.toFixed(2)}%</span>
                <span className="ml-auto text-red-600 font-bold text-base">- R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Receitas por categoria */}
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col md:flex-row items-center min-w-0">
          <div className="flex-1 flex items-center justify-center">
            {/* Gráfico donut SVG */}
            <svg width="180" height="180" viewBox="0 0 36 36" className="block">
              {(() => {
                let acc = 0;
                return data.receitasPorCategoria.map((cat: CategoriaData, i: number) => {
                  const val = (cat.percent / 100) * 100;
                  const dasharray = `${val} ${100 - val}`;
                  const dashoffset = 25 - acc;
                  acc += val;
                  return (
                    <circle
                      key={cat.label}
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="3"
                      strokeDasharray={dasharray}
                      strokeDashoffset={dashoffset}
                      style={{ transition: 'stroke-dasharray 0.3s' }}
                    />
                  );
                });
              })()}
            </svg>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2 ml-6">
            {data.receitasPorCategoria.map((cat: CategoriaData) => (
              <div key={cat.label} className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                <span className="text-gray-700 text-base">{cat.label}</span>
                <span className="bg-gray-100 text-xs font-semibold rounded px-2 py-0.5 ml-2 text-gray-600">{cat.percent.toFixed(2)}%</span>
                <span className="ml-auto text-green-600 font-bold text-base">R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 