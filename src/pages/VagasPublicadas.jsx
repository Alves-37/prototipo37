import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal';
import api from '../services/api';

export default function VagasPublicadas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [vagas, setVagas] = useState([])
  const [loading, setLoading] = useState(true)
  const [vagaParaExcluir, setVagaParaExcluir] = useState(null);
  const [toast, setToast] = useState(null);

  // Carregar vagas da API
  useEffect(() => {
    loadVagas();
  }, [])

  const loadVagas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vagas/empresa/minhas-vagas');
      setVagas(response.data);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      setToast({ type: 'error', message: 'Erro ao carregar vagas' });
    } finally {
      setLoading(false);
    }
  };

  const vagasFiltradas = vagas.filter(vaga => {
    if (filtroStatus === 'todas') return true
    return vaga.status === filtroStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'publicada': return 'bg-green-100 text-green-800'
      case 'expirada': return 'bg-red-100 text-red-800'
      case 'fechada': return 'bg-yellow-100 text-yellow-800'
      case 'rascunho': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCapacidadeColor = (statusCapacidade) => {
    switch (statusCapacidade) {
      case 'aberta': return 'bg-green-100 text-green-800'
      case 'parcial': return 'bg-yellow-100 text-yellow-800'
      case 'fechada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'publicada': return 'Publicada'
      case 'expirada': return 'Expirada'
      case 'fechada': return 'Fechada'
      case 'rascunho': return 'Rascunho'
      default: return status
    }
  }

  const editarVaga = (id) => {
    navigate(`/publicar-vaga/${id}`)
  }

  const alterarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/vagas/${id}`, { status: novoStatus });
      await loadVagas(); // Recarregar vagas
      setToast({ type: 'success', message: 'Status alterado com sucesso!' });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setToast({ type: 'error', message: 'Erro ao alterar status' });
    }
  }

  // Função para formatar datas
  const formatarData = (data) => {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('pt-BR');
  }

  const excluirVaga = async (id) => {
    try {
      await api.delete(`/vagas/${id}`);
      await loadVagas(); // Recarregar vagas
    setVagaParaExcluir(null);
    setToast({ type: 'success', message: 'Vaga excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
      setToast({ type: 'error', message: 'Erro ao excluir vaga' });
    }
  }

  const verCandidaturas = (id) => {
    navigate('/candidaturas')
  }

  const calcularDiasRestantes = (dataExpiracao) => {
    if (!dataExpiracao) return '-';
    const hoje = new Date()
    const expiracao = new Date(dataExpiracao)
    const diffTime = expiracao - hoje
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Carregando vagas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📋 Vagas Publicadas</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Gerencie suas vagas publicadas na plataforma</p>
            </div>
            <div className="flex-shrink-0">
        <button
                      onClick={() => navigate('/publicar-vaga')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Publicar Nova Vaga</span>
                <span className="sm:hidden">Nova Vaga</span>
        </button>
            </div>
          </div>
      </div>

      {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
                <option value="todas">Todas as vagas</option>
                <option value="publicada">Publicadas</option>
                <option value="fechada">Fechadas</option>
              <option value="expirada">Expiradas</option>
                <option value="rascunho">Rascunhos</option>
            </select>
            </div>
            <div className="flex items-end">
              <span className="text-sm text-gray-500">
                {vagasFiltradas.length} vaga{vagasFiltradas.length !== 1 ? 's' : ''} encontrada{vagasFiltradas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Vagas */}
        <div className="space-y-4 sm:space-y-6">
          {vagasFiltradas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-gray-500 mb-6">
                {filtroStatus === 'todas' 
                  ? 'Você ainda não publicou nenhuma vaga.' 
                  : `Nenhuma vaga com status "${getStatusText(filtroStatus)}" encontrada.`
                }
              </p>
              {filtroStatus === 'todas' && (
                  <button
                    onClick={() => navigate('/publicar-vaga')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Publicar Primeira Vaga
                  </button>
              )}
            </div>
          ) : (
            vagasFiltradas.map((vaga) => (
              <div key={vaga.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header da Vaga */}
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                            {vaga.titulo}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {vaga.descricao?.substring(0, 120)}...
                          </p>
                  </div>
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vaga.status)}`}>
                            {getStatusText(vaga.status)}
                          </span>
                          {vaga.statusCapacidade && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCapacidadeColor(vaga.statusCapacidade)}`}>
                              {vaga.statusCapacidade === 'aberta' ? '🟢 Aberta' :
                               vaga.statusCapacidade === 'parcial' ? '🟡 Quase Cheia' :
                               '🔴 Fechada'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                  
                {/* Informações da Vaga */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{vaga.localizacao || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">Publicada em {formatarData(vaga.dataPublicacao)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm text-gray-600">{vaga.visualizacoes || 0} visualizações</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{vaga.candidaturas || 0} candidatos</span>
                </div>
              </div>

                  {/* Ações */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => editarVaga(vaga.id)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                        Editar
                  </button>
                    
                    <button
                      onClick={() => verCandidaturas(vaga.id)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Candidatos
                    </button>

                    <select
                      value={vaga.status}
                      onChange={(e) => alterarStatus(vaga.id, e.target.value)}
                      className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="publicada">Publicada</option>
                      <option value="fechada">Fechada</option>
                      <option value="expirada">Expirada</option>
                      <option value="rascunho">Rascunho</option>
                    </select>

                <button
                  onClick={() => setVagaParaExcluir(vaga)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                        Excluir
                </button>
              </div>
            </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!vagaParaExcluir}
          onClose={() => setVagaParaExcluir(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-700">
            Tem certeza que deseja excluir a vaga <strong>"{vagaParaExcluir?.titulo}"</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta ação não pode ser desfeita e todas as candidaturas serão perdidas.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setVagaParaExcluir(null)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
                onClick={() => excluirVaga(vagaParaExcluir.id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
} 