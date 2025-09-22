import { useState, useEffect } from 'react';
import api from '../services/api';

// Configuração das fases
const FASES = {
  recebida: {
    nome: 'Recebida',
    cor: 'bg-gray-500',
    icone: '📥',
    descricao: 'Candidatura recebida e aguardando análise'
  },
  em_analise: {
    nome: 'Em Análise',
    cor: 'bg-blue-500',
    icone: '🔍',
    descricao: 'Candidatura sendo analisada pela empresa'
  },
  entrevista_agendada: {
    nome: 'Entrevista Agendada',
    cor: 'bg-yellow-500',
    icone: '📅',
    descricao: 'Entrevista marcada com o candidato'
  },
  entrevista_realizada: {
    nome: 'Entrevista Realizada',
    cor: 'bg-purple-500',
    icone: '✅',
    descricao: 'Entrevista concluída'
  },
  teste_tecnico: {
    nome: 'Teste Técnico',
    cor: 'bg-indigo-500',
    icone: '💻',
    descricao: 'Teste técnico em andamento'
  },
  aprovada: {
    nome: 'Aprovada',
    cor: 'bg-green-500',
    icone: '🎉',
    descricao: 'Candidatura aprovada'
  },
  reprovada: {
    nome: 'Reprovada',
    cor: 'bg-red-500',
    icone: '❌',
    descricao: 'Candidatura reprovada'
  },
  contratada: {
    nome: 'Contratada',
    cor: 'bg-emerald-500',
    icone: '🎯',
    descricao: 'Candidato contratado'
  }
};

// Transições permitidas
const TRANSICOES = {
  recebida: ['em_analise', 'reprovada'],
  em_analise: ['entrevista_agendada', 'reprovada'],
  entrevista_agendada: ['entrevista_realizada', 'reprovada'],
  entrevista_realizada: ['teste_tecnico', 'aprovada', 'reprovada'],
  teste_tecnico: ['aprovada', 'reprovada'],
  aprovada: ['contratada', 'reprovada'],
  reprovada: [],
  contratada: []
};

export default function FasesCandidatura({ candidatura, onUpdate, isEmpresa = false }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [novaFase, setNovaFase] = useState('');
  const [formData, setFormData] = useState({});
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    if (candidatura?.historicoFases) {
      try {
        setHistorico(JSON.parse(candidatura.historicoFases));
      } catch (error) {
        setHistorico([]);
      }
    }
  }, [candidatura]);

  const handleMudarFase = async () => {
    if (!novaFase) return;

    setLoading(true);
    try {
      const response = await api.put(`/candidaturas/${candidatura.id}/fase`, {
        fase: novaFase,
        ...formData
      });

      onUpdate(response.data);
      setShowModal(false);
      setNovaFase('');
      setFormData({});
    } catch (error) {
      console.error('Erro ao mudar fase:', error);
      alert('Erro ao atualizar fase da candidatura');
    } finally {
      setLoading(false);
    }
  };

  const renderFaseAtual = () => {
    const fase = FASES[candidatura.fase];
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white ${fase.cor}`}>
        <span>{fase.icone}</span>
        <span className="font-medium">{fase.nome}</span>
      </div>
    );
  };

  const renderTimeline = () => {
    const fasesArray = Object.keys(FASES);
    const faseAtualIndex = fasesArray.indexOf(candidatura.fase);

    return (
      <div className="flex items-center justify-between mb-6">
        {fasesArray.map((fase, index) => {
          const faseInfo = FASES[fase];
          const isAtual = candidatura.fase === fase;
          const isConcluida = index <= faseAtualIndex;
          const isFutura = index > faseAtualIndex;

          return (
            <div key={fase} className="flex items-center">
              <div className={`flex flex-col items-center ${isFutura ? 'opacity-40' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                  isAtual ? faseInfo.cor : 
                  isConcluida ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {isConcluida ? '✓' : faseInfo.icone}
                </div>
                <span className="text-xs mt-1 text-center max-w-20">{faseInfo.nome}</span>
              </div>
              {index < fasesArray.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${isConcluida ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const proximasFases = TRANSICOES[candidatura.fase] || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold mb-4">Mudar Fase da Candidatura</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nova Fase:</label>
            <select 
              value={novaFase} 
              onChange={(e) => setNovaFase(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione uma fase</option>
              {proximasFases.map(fase => (
                <option key={fase} value={fase}>
                  {FASES[fase].nome}
                </option>
              ))}
            </select>
          </div>

          {/* Campos específicos por fase */}
          {novaFase === 'entrevista_agendada' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Data da Entrevista:</label>
                <input 
                  type="datetime-local" 
                  value={formData.dataEntrevista || ''}
                  onChange={(e) => setFormData({...formData, dataEntrevista: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Local:</label>
                <input 
                  type="text" 
                  value={formData.localEntrevista || ''}
                  onChange={(e) => setFormData({...formData, localEntrevista: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Local da entrevista"
                />
              </div>
            </>
          )}

          {novaFase === 'entrevista_realizada' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Feedback:</label>
                <textarea 
                  value={formData.feedbackEntrevista || ''}
                  onChange={(e) => setFormData({...formData, feedbackEntrevista: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Feedback da entrevista"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Avaliação (1-5):</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5"
                  value={formData.avaliacaoEmpresa || ''}
                  onChange={(e) => setFormData({...formData, avaliacaoEmpresa: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}

          {novaFase === 'teste_tecnico' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Data do Teste:</label>
                <input 
                  type="datetime-local" 
                  value={formData.dataTesteTecnico || ''}
                  onChange={(e) => setFormData({...formData, dataTesteTecnico: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nota (0-100):</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={formData.notaTesteTecnico || ''}
                  onChange={(e) => setFormData({...formData, notaTesteTecnico: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}

          {novaFase === 'contratada' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Salário Proposto:</label>
                <input 
                  type="number" 
                  value={formData.salarioProposto || ''}
                  onChange={(e) => setFormData({...formData, salarioProposto: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Salário em MT"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Data de Início:</label>
                <input 
                  type="date" 
                  value={formData.dataInicio || ''}
                  onChange={(e) => setFormData({...formData, dataInicio: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Observações:</label>
            <textarea 
              value={formData.observacoesEmpresa || ''}
              onChange={(e) => setFormData({...formData, observacoesEmpresa: e.target.value})}
              className="w-full p-2 border rounded"
              rows="2"
              placeholder="Observações sobre a mudança de fase"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              onClick={handleMudarFase}
              disabled={loading || !novaFase}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistorico = () => {
    if (historico.length === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="font-semibold mb-3">Histórico de Fases</h4>
        <div className="space-y-2">
          {historico.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${FASES[item.fase]?.cor || 'bg-gray-500'}`}>
                {FASES[item.fase]?.icone || '📋'}
              </div>
              <div className="flex-1">
                <div className="font-medium">{FASES[item.fase]?.nome || item.fase}</div>
                <div className="text-sm text-gray-600">
                  {new Date(item.data).toLocaleString('pt-BR')}
                </div>
                {item.observacao && (
                  <div className="text-sm text-gray-500 mt-1">{item.observacao}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Fases da Candidatura</h3>
        {isEmpresa && TRANSICOES[candidatura.fase]?.length > 0 && (
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Mudar Fase
          </button>
        )}
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-600">Fase Atual:</span>
        <div className="mt-1">{renderFaseAtual()}</div>
      </div>

      {renderTimeline()}
      {renderHistorico()}
      {renderModal()}
    </div>
  );
} 