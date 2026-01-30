import { useEffect, useState } from 'react';
import { useMonetizacao } from '../context/MonetizacaoContext';

const API_KEY_STORAGE = 'nevu_api_key_empresarial';

function gerarChaveAleatoria() {
  return 'emp_' + Math.random().toString(36).substr(2, 24);
}

export default function ApiEmpresarial() {
  const { assinatura } = useMonetizacao();
  const isEmpresarial = assinatura?.plano === 'empresarial';
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isEmpresarial) {
      let key = localStorage.getItem(API_KEY_STORAGE);
      if (!key) {
        key = gerarChaveAleatoria();
        localStorage.setItem(API_KEY_STORAGE, key);
      }
      setApiKey(key);
    }
  }, [isEmpresarial]);

  const handleGerarNova = () => {
    const nova = gerarChaveAleatoria();
    localStorage.setItem(API_KEY_STORAGE, nova);
    setApiKey(nova);
  };

  // if (!isEmpresarial) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8 border border-blue-200">
      <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
        API Empresarial
      </h3>
      <p className="text-gray-700 mb-4 text-sm">Integre seu sistema com a plataforma Nevú usando a chave abaixo. Use esta chave para autenticar suas requisições à API (mock).</p>
      <div className="flex items-center gap-2 mb-4">
        <input type="text" value={apiKey} readOnly className="w-full p-2 border rounded font-mono bg-gray-50 text-blue-800" />
        <button onClick={handleGerarNova} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs">Gerar nova chave</button>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-900">
        <b>Exemplo de uso:</b><br />
        <span className="font-mono">GET https://api.nevu.com/v1/vagas</span><br />
        <span className="font-mono">Headers: Authorization: Bearer <b>sua_chave_api</b></span>
      </div>
      <div className="mt-3 text-xs text-gray-500">* Esta API é apenas ilustrativa (mock/localStorage). Para integração real, entre em contato com o suporte Nevú.</div>
    </div>
  );
} 