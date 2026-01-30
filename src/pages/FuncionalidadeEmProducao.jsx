import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FuncionalidadeEmProducao({ mensagem }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Funcionalidade em Produção</h1>
        <p className="text-gray-600 mb-6">
          {mensagem || 'Esta funcionalidade ainda está sendo desenvolvida. Em breve estará disponível para você!'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
} 