import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import api from '../services/api'
import { uploadsUrl } from '../services/url'

export default function Candidaturas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null)
  const [modalVaga, setModalVaga] = useState(false)
  const [modalDetalhes, setModalDetalhes] = useState(false)
  const [vagaSelecionada, setVagaSelecionada] = useState(null)
  const [feedbackCancelamento, setFeedbackCancelamento] = useState(null)
  const [showToast, setShowToast] = useState(null)
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [modalEntrevista, setModalEntrevista] = useState(false)
  const [dadosEntrevista, setDadosEntrevista] = useState({ data: '', hora: '', local: '' })
  const [modalCancelar, setModalCancelar] = useState(false)
  const [candidaturaParaCancelar, setCandidaturaParaCancelar] = useState(null)
  
  // Estados para dados reais da API
  const [candidaturas, setCandidaturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isEmpresa = user && user.tipo === 'empresa'

  // Função para buscar candidaturas da API
  const buscarCandidaturas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let response
      if (isEmpresa) {
        // Para empresas: buscar todas as candidaturas das vagas da empresa
        response = await api.get('/candidaturas/empresa')
      } else {
        // Para candidatos: buscar suas próprias candidaturas
        response = await api.get('/candidaturas/usuario')
      }
      
      console.log('=== DEBUG: Candidaturas carregadas ===')
      console.log('Tipo de usuário:', isEmpresa ? 'Empresa' : 'Candidato')
      console.log('Candidaturas:', response.data)
      if (response.data.length > 0) {
        console.log('Primeira candidatura:', response.data[0])
        if (isEmpresa && response.data[0].usuario) {
          console.log('Dados do usuário:', response.data[0].usuario)
          console.log('Foto do usuário:', response.data[0].usuario.foto)
        }
      }
      
      setCandidaturas(response.data)
    } catch (err) {
      console.error('Erro ao buscar candidaturas:', err)
      setError('Erro ao carregar candidaturas. Tente novamente.')
      // Em caso de erro, usar dados vazios
      setCandidaturas([])
    } finally {
      setLoading(false)
    }
  }

  // Buscar candidaturas da API
  useEffect(() => {
    if (user) {
      buscarCandidaturas()
    }
  }, [user, isEmpresa])

  // Filtrar candidaturas
  const candidaturasFiltradas = candidaturas.filter(candidatura => {
    if (filtroStatus === 'todas') return true
    return (candidatura.fase || candidatura.status) === filtroStatus
  })

  const getStatusColor = (fase) => {
    // Se for candidato e fase for entrevista_realizada, usar cor de "aguardando"
    if (!isEmpresa && fase === 'entrevista_realizada') {
      return 'bg-yellow-100 text-yellow-800'
    }
    
    switch (fase) {
      case 'recebida': return 'bg-gray-100 text-gray-800'
      case 'em_analise': return 'bg-blue-100 text-blue-800'
      case 'entrevista_agendada': return 'bg-purple-100 text-purple-800'
      case 'entrevista_realizada': return 'bg-orange-100 text-orange-800'
      case 'aprovada': return 'bg-green-100 text-green-800'
      case 'contratada': return 'bg-emerald-100 text-emerald-800'
      case 'reprovada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (fase) => {
    // Se for candidato, mostrar texto diferente para entrevista_realizada
    if (!isEmpresa && fase === 'entrevista_realizada') {
      return '⏳ Aguardando Resposta'
    }
    
    switch (fase) {
      case 'recebida': return '📋 Recebida'
      case 'em_analise': return '👀 Em Análise'
      case 'entrevista_agendada': return '📞 Entrevista Agendada'
      case 'entrevista_realizada': return '🎯 Entrevista Realizada'
      case 'aprovada': return '✅ Aprovada'
      case 'contratada': return '🤝 Contratada'
      case 'reprovada': return '❌ Reprovada'
      default: return fase
    }
  }

  const alterarStatus = async (id, novoStatus, dadosAdicionais = {}) => {
    try {
      setAlterandoStatus(true)
      
      // Debug: log dos dados sendo enviados
      console.log('🔍 DEBUG - Dados sendo enviados:', {
        id,
        novoStatus,
        dadosAdicionais,
        payload: {
          fase: novoStatus,
          ...dadosAdicionais
        }
      })
      
      const response = await api.put(`/candidaturas/${id}/fase`, {
        fase: novoStatus,
        ...dadosAdicionais
      })
      
      // Mostrar toast de sucesso
      const statusLabels = {
        'em_analise': 'Em Análise',
        'entrevista_agendada': 'Entrevista Agendada',
        'entrevista_realizada': isEmpresa ? 'Entrevista Realizada' : 'Aguardando Resposta',
        'aprovada': 'Aprovada',
        'reprovada': 'Reprovada',
        'contratada': 'Contratada'
      }
      
      setShowToast({
        message: `Status alterado para: ${statusLabels[novoStatus] || novoStatus}`,
        color: 'bg-green-500'
      })
      
      // Esconder toast após 3 segundos
      setTimeout(() => setShowToast(null), 3000)
      
      // Recarregar a página para atualizar os dados
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      console.error('🔍 DEBUG - Resposta do servidor:', error.response?.data)
      setShowToast({
        message: `Erro ao alterar status: ${error.response?.data?.error || 'Tente novamente.'}`,
        color: 'bg-red-500'
      })
      setTimeout(() => setShowToast(null), 3000)
    } finally {
      setAlterandoStatus(false)
    }
  }

  // Corrigir função verVaga para não usar detalhesVagas
  const verVaga = (vaga) => {
    setVagaSelecionada(vaga);
    setModalVaga(true);
  };

  const verDetalhesCandidatura = (candidatura) => {
    setCandidatoSelecionado(candidatura)
    setModalDetalhes(true)
  }

  const handleCandidaturaClick = (candidatura) => {
    setCandidatoSelecionado(candidatura)
    // Abrir modal de detalhes para ambos (empresa e candidato)
    verDetalhesCandidatura(candidatura)
  }

  const cancelarCandidatura = async (id) => {
    const candidatura = candidaturas.find(c => c.id === id)
    setCandidaturaParaCancelar(candidatura)
    setModalCancelar(true)
  }

  const confirmarCancelamento = async () => {
    if (!candidaturaParaCancelar) return
    
      try {
        // Cancelar candidatura na API
      await api.delete(`/candidaturas/${candidaturaParaCancelar.id}`)
        
        // Remover da lista local
      setCandidaturas(prev => prev.filter(c => c.id !== candidaturaParaCancelar.id))
        
        setFeedbackCancelamento({
          tipo: 'sucesso',
        mensagem: `Candidatura cancelada com sucesso!\n\nVaga: ${candidaturaParaCancelar.vaga?.titulo || 'Vaga'}\nEmpresa: ${candidaturaParaCancelar.vaga?.empresa?.nome || 'Empresa'}\n\nVocê pode se candidatar novamente a esta vaga se desejar.`,
        vaga: candidaturaParaCancelar.vaga?.titulo || 'Vaga',
        empresa: candidaturaParaCancelar.vaga?.empresa?.nome || 'Empresa'
      })
        
        // Limpar feedback após 5 segundos
        setTimeout(() => {
          setFeedbackCancelamento(null)
        }, 5000)
        
      setModalCancelar(false)
      setCandidaturaParaCancelar(null)
        setModalDetalhes(false)
      } catch (err) {
        console.error('Erro ao cancelar candidatura:', err)
        alert('Erro ao cancelar candidatura. Tente novamente.')
    }
  }

  const podeCancelar = (fase) => {
    return fase === 'recebida' || fase === 'em_analise'
  }

  const verPerfilCandidato = (candidato) => {
    setModalDetalhes(false)
    // Navegar para a página de funcionalidade em produção
    navigate('/em-producao')
  }

  const irParaMensagens = () => {
    setModalDetalhes(false)
    // Navegar para mensagens com informações do candidato/empresa
    if (candidatoSelecionado) {
      const destinatario = isEmpresa ? candidatoSelecionado.usuario : candidatoSelecionado.vaga?.empresa
      navigate('/mensagens', { 
        state: { 
          destinatario,
          vaga: candidatoSelecionado.vaga,
          tipo: isEmpresa ? 'candidato' : 'empresa'
        }
      })
    } else {
      navigate('/mensagens')
    }
  }

  // Função para obter as ações disponíveis baseadas no status atual
  const getAcoesDisponiveis = (candidatura) => {
    const acoes = [];
    
    switch (candidatura.fase) {
      case 'recebida':
        acoes.push(
          { label: '📋 Analisar Candidato', action: () => alterarStatus(candidatura.id, 'em_analise'), color: 'bg-blue-500' },
          { label: '❌ Rejeitar', action: () => alterarStatus(candidatura.id, 'reprovada'), color: 'bg-red-500' }
        );
        break;
        
      case 'em_analise':
        acoes.push(
            { label: '📅 Agendar Entrevista', action: () => agendarEntrevista(candidatura), color: 'bg-green-500' },
            { label: '❌ Rejeitar', action: () => alterarStatus(candidatura.id, 'reprovada'), color: 'bg-red-500' }
        );
        break;
        
      case 'entrevista_agendada':
        acoes.push(
          { label: '✅ Marcar como Realizada', action: () => alterarStatus(candidatura.id, 'entrevista_realizada'), color: 'bg-green-500' },
          { label: '❌ Rejeitar', action: () => alterarStatus(candidatura.id, 'reprovada'), color: 'bg-red-500' }
        );
        break;
        
      case 'entrevista_realizada':
        acoes.push(
          { label: '✅ Aprovar', action: () => alterarStatus(candidatura.id, 'aprovada'), color: 'bg-green-500' },
          { label: '❌ Reprovar', action: () => alterarStatus(candidatura.id, 'reprovada'), color: 'bg-red-500' }
        );
        break;
        
      case 'aprovada':
        acoes.push(
          { label: '🤝 Contratar', action: () => alterarStatus(candidatura.id, 'contratada'), color: 'bg-green-600' }
        );
        break;
        
      case 'reprovada':
        acoes.push(
          { label: '📅 Reagendar Entrevista', action: () => agendarEntrevista(candidatura), color: 'bg-blue-500' }
        );
        break;
        
      case 'teste_tecnico':
        acoes.push(
          { label: '✅ Aprovar', action: () => alterarStatus(candidatura.id, 'aprovada'), color: 'bg-green-500' },
          { label: '❌ Reprovar', action: () => alterarStatus(candidatura.id, 'reprovada'), color: 'bg-red-500' }
        );
        break;
        
      // Para 'contratada' não há ações disponíveis - candidato foi contratado
      case 'contratada':
        // Nenhuma ação disponível - candidato foi contratado
        break;
        
      default:
        break;
    }
    
    return acoes;
  };

  // Função para agendar entrevista
  const agendarEntrevista = (candidatura) => {
    setCandidatoSelecionado(candidatura)
    setModalEntrevista(true)
  }

  const confirmarAgendamento = async () => {
    if (!dadosEntrevista.data || !dadosEntrevista.hora || !dadosEntrevista.local) {
      alert('Por favor, preencha todos os campos')
      return
    }

    const dataHora = `${dadosEntrevista.data}T${dadosEntrevista.hora}:00`
    
    try {
      await alterarStatus(candidatoSelecionado.id, 'entrevista_agendada', {
        dataEntrevista: new Date(dataHora).toISOString(),
        localEntrevista: dadosEntrevista.local
      })
      
      setModalEntrevista(false)
      setDadosEntrevista({ data: '', hora: '', local: '' })
    } catch (error) {
      console.error('Erro ao agendar entrevista:', error)
    }
  }

  // Estatísticas de candidaturas por status (apenas para candidatos)
  const stats = !isEmpresa ? [
    { label: 'Ativas', value: candidaturas.filter(c => ['recebida', 'em_analise', 'entrevista_agendada', 'entrevista_realizada', 'teste_tecnico'].includes(c.fase || c.status)).length, color: 'bg-blue-100 text-blue-700' },
    { label: 'Aprovadas', value: candidaturas.filter(c => (c.fase || c.status) === 'aprovada').length, color: 'bg-green-100 text-green-700' },
    { label: 'Contratadas', value: candidaturas.filter(c => (c.fase || c.status) === 'contratada').length, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Reprovadas', value: candidaturas.filter(c => (c.fase || c.status) === 'reprovada').length, color: 'bg-red-100 text-red-700' },
    { label: 'Total', value: candidaturas.length, color: 'bg-gray-100 text-gray-700' },
  ] : [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando candidaturas...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* Topo com ícone e título grande */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3 shadow">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" /></svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">{isEmpresa ? 'Candidaturas Recebidas' : 'Minhas Candidaturas'}</h1>
          </div>
          {/* Estatísticas para candidatos */}
          {!isEmpresa && (
            <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
              {stats.map(stat => (
                <div key={stat.label} className={`px-3 py-1 rounded-full text-xs font-semibold ${stat.color} shadow-sm`}>
                  {stat.label}: {stat.value}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por status:</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 sm:flex-none"
              >
                <option value="todas">Todas</option>
                <option value="recebida">📋 Recebidas</option>
                <option value="em_analise">👀 Em Análise</option>
                <option value="entrevista_agendada">📞 Entrevista Agendada</option>
                <option value="entrevista_realizada">
                  {isEmpresa ? '🎯 Entrevista Realizada' : '⏳ Aguardando Resposta'}
                </option>
                <option value="contratada">🤝 Contratadas</option>
                <option value="aprovada">✅ Aprovadas</option>
                <option value="reprovada">❌ Reprovadas</option>
              </select>
            </div>
            <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full w-full sm:w-auto text-center">
              {candidaturasFiltradas.length} candidatura(s) encontrada(s)
            </span>
          </div>
        </div>

        {/* Lista de candidaturas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800 text-lg">
              {isEmpresa ? 'Candidatos' : 'Vagas Candidatadas'}
            </h2>
          </div>
          <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-6xl mb-4 block">⚙️</span>
                <p className="text-lg font-medium">Carregando candidaturas...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <span className="text-6xl mb-4 block">❌</span>
                <p className="text-lg font-medium">{error}</p>
              </div>
            ) : candidaturasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-6xl mb-4 block">🗂️</span>
                <p className="text-lg font-medium">
                  {isEmpresa ? 'Nenhuma candidatura recebida ainda' : 'Você ainda não se candidatou a nenhuma vaga'}
                </p>
                <p className="text-sm">
                  {isEmpresa ? 'As candidaturas aparecerão aqui quando candidatos se candidatarem às suas vagas.' : 'Explore oportunidades e candidate-se às vagas do seu interesse!'}
                </p>
              </div>
            ) : (
              candidaturasFiltradas.map((candidatura) => (
                <div
                  key={candidatura.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0 group"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
                >
                  <div onClick={() => handleCandidaturaClick(candidatura)} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shadow overflow-hidden">
                        {isEmpresa ? (
                          candidatura.usuario?.foto ? (
                            <img 
                              src={candidatura.usuario.foto} 
                              alt={candidatura.usuario?.nome || 'Candidato'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('Erro ao carregar foto:', candidatura.usuario.foto)
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span>{candidatura.usuario?.nome?.charAt(0) || 'C'}</span>
                          )
                        ) : (
                          candidatura.vaga?.empresa?.logo ? (
                            <img 
                              src={candidatura.vaga.empresa.logo} 
                              alt={candidatura.vaga?.empresa?.nome || 'Empresa'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('Erro ao carregar logo:', candidatura.vaga.empresa.logo)
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span>{candidatura.vaga?.empresa?.nome?.charAt(0) || 'E'}</span>
                          )
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
                          {isEmpresa 
                            ? candidatura.usuario?.nome || 'Candidato'
                            : candidatura.vaga?.empresa?.nome || 'Empresa'
                          }
                          <span className="text-xs text-gray-400 font-normal">
                            {candidatura.vaga?.titulo || 'Vaga'}
                          </span>
                        </h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-4a3 3 0 00-3 3v2h5z" /></svg>
                            {candidatura.vaga?.localizacao || 'Localização não informada'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            💰 {candidatura.vaga?.salario || '-'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidatura.fase || candidatura.status)} border border-gray-200`}>
                            {getStatusText(candidatura.fase || candidatura.status)}
                          </span>
                        </div>
                      </div>
                  </div>
                  {/* Botão cancelar para o candidato logado */}
                  {!isEmpresa && user && user.tipo === 'usuario' && candidatura.usuarioId === user.id && podeCancelar(candidatura.fase || candidatura.status) && (
                    <button
                      onClick={() => cancelarCandidatura(candidatura.id)}
                      className="mt-2 sm:mt-0 sm:ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium flex items-center gap-2 group-hover:scale-105"
                    >
                      ❌ Cancelar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver vaga */}
      <Modal
        isOpen={modalVaga}
        onClose={() => setModalVaga(false)}
        title={`Vaga: ${vagaSelecionada?.vaga} - ${vagaSelecionada?.empresa}`}
        size="lg"
      >
        {vagaSelecionada && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Descrição da Vaga</h4>
              <p className="text-gray-600">{vagaSelecionada.descricao}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Requisitos</h4>
                <ul className="space-y-2">
                  {vagaSelecionada.requisitos.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Benefícios</h4>
                <ul className="space-y-2">
                  {vagaSelecionada.beneficios.map((ben, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">🎁</span>
                      <span className="text-gray-600">{ben}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">💰</div>
                <div className="text-sm text-gray-600">Salário</div>
                <div className="font-medium">{vagaSelecionada.salario}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">📍</div>
                <div className="text-sm text-gray-600">Localização</div>
                <div className="font-medium">{vagaSelecionada.localizacao}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">📋</div>
                <div className="text-sm text-gray-600">Tipo</div>
                <div className="font-medium">{vagaSelecionada.tipo}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">🏢</div>
                <div className="text-sm text-gray-600">Modalidade</div>
                <div className="font-medium">{vagaSelecionada.modalidade}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para detalhes da candidatura */}
      {candidatoSelecionado && (
      <Modal
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        title={isEmpresa ? `Detalhes de ${candidatoSelecionado?.usuario?.nome || 'Candidato'}` : "Detalhes da Candidatura"}
        size="lg"
      >
          {/* Alerta de status no topo do modal - apenas para candidatos */}
          {!isEmpresa && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 text-white font-semibold text-lg
                      ${(candidatoSelecionado.fase || candidatoSelecionado.status) === 'contratada' ? 'bg-emerald-600' :
        (candidatoSelecionado.fase || candidatoSelecionado.status) === 'aprovada' ? 'bg-green-600' :
        (candidatoSelecionado.fase || candidatoSelecionado.status) === 'reprovada' ? 'bg-red-600' :
                (candidatoSelecionado.fase || candidatoSelecionado.status) === 'entrevista_agendada' ? 'bg-blue-600' :
                'bg-yellow-500'}
            `}>
              {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'contratada' && <span>🤝</span>}
              {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'aprovada' && <span>✅</span>}
              {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'reprovada' && <span>❌</span>}
              {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'entrevista_agendada' && <span>📅</span>}
              {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'recebida' && <span>📝</span>}
              <span>
                {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'contratada' && 'Você foi CONTRATADO!'}
                {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'aprovada' && 'Sua candidatura foi APROVADA!'}
                {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'reprovada' && 'Sua candidatura foi REPROVADA.'}
                {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'entrevista_agendada' && 'Você foi selecionado para ENTREVISTA!'}
                {(candidatoSelecionado.fase || candidatoSelecionado.status) === 'recebida' && 'Sua candidatura foi RECEBIDA.'}
              </span>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:gap-8 space-y-6 md:space-y-0">
            {/* Coluna Esquerda */}
            <div className="md:w-1/2 space-y-6">
              {/* Header com avatar, nome, status */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {isEmpresa ? (
                    candidatoSelecionado.usuario?.foto ? (
                      <img 
                        src={candidatoSelecionado.usuario.foto} 
                        alt={candidatoSelecionado.usuario?.nome || 'Candidato'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      candidatoSelecionado.usuario?.nome?.charAt(0) || 'C'
                    )
                  ) : (
                    candidatoSelecionado.vaga?.empresa?.logo ? (
                      <img 
                        src={candidatoSelecionado.vaga.empresa.logo} 
                        alt={candidatoSelecionado.vaga?.empresa?.nome || 'Empresa'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      candidatoSelecionado.vaga?.empresa?.nome?.charAt(0) || 'E'
                    )
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-xl">
                    {isEmpresa 
                      ? candidatoSelecionado.usuario?.nome || 'Candidato'
                      : candidatoSelecionado.vaga?.empresa?.nome || 'Empresa'
                    }
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidatoSelecionado.fase || candidatoSelecionado.status)}`}>
                    {getStatusText(candidatoSelecionado.fase || candidatoSelecionado.status)}
                  </span>
                </div>
              </div>
              {/* Contatos (apenas para empresa) */}
              {isEmpresa && (
                <div className="bg-white border p-4 rounded-lg space-y-2">
                  <div><span className="text-gray-600">📧 Email:</span> <span className="font-medium">{candidatoSelecionado.usuario?.email}</span></div>
                  <div><span className="text-gray-600">📞 Telefone:</span> <span className="font-medium">{candidatoSelecionado.usuario?.telefone || 'Não informado'}</span></div>
                </div>
              )}
            {/* Informações da candidatura */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📋 Informações da Candidatura
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">🎯 Vaga:</span>
                  <p className="font-medium">{candidatoSelecionado.vaga?.titulo || 'Vaga'}</p>
                </div>
                <div>
                  <span className="text-gray-600">📅 Data:</span>
                  <p className="font-medium">{new Date(candidatoSelecionado.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                {isEmpresa && (
                  <>
                    <div>
                      <span className="text-gray-600">⏱️ Experiência:</span>
                      <p className="font-medium">{candidatoSelecionado.usuario?.experiencia || 'Não informada'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">🎓 Formação:</span>
                      <p className="font-medium">{candidatoSelecionado.usuario?.formacao || 'Não informada'}</p>
                    </div>
                  </>
                )}
                {!isEmpresa && (
                  <>
                    <div>
                      <span className="text-gray-600">💰 Salário:</span>
                      <p className="font-medium">{candidatoSelecionado.vaga?.salario || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">📍 Localização:</span>
                      <p className="font-medium">{candidatoSelecionado.vaga?.localizacao || 'Não informada'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">📋 Tipo:</span>
                      <p className="font-medium">{candidatoSelecionado.vaga?.tipoContrato || 'Não informado'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
            {/* Coluna Direita: Detalhes do candidato (empresa) ou detalhes da vaga (candidato) */}
            <div className="md:w-1/2 space-y-6 flex flex-col">
              {isEmpresa && candidatoSelecionado && (
                <div className="bg-white border border-gray-200 p-4 rounded-lg flex-1 space-y-4">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    👤 Dados do Candidato
                </h5>
                  <div className="mb-2"><span className="font-medium">Nome:</span> {candidatoSelecionado.usuario?.nome || '-'}</div>
                  <div className="mb-2"><span className="font-medium">Email:</span> {candidatoSelecionado.usuario?.email || '-'}</div>
                  <div className="mb-2"><span className="font-medium">Telefone:</span> {candidatoSelecionado.usuario?.telefone || '-'}</div>
                  <div className="mb-2"><span className="font-medium">Experiência:</span> {candidatoSelecionado.usuario?.experiencia || '-'}</div>
                  <div className="mb-2"><span className="font-medium">Formação:</span> {candidatoSelecionado.usuario?.formacao || '-'}</div>
                  
                  {/* Botão de baixar CV - sempre mostrar se houver currículo */}
                  <div className="mb-4">
                    {candidatoSelecionado.usuario?.curriculo ? (
                      <a
                        href={uploadsUrl(candidatoSelecionado.usuario.curriculo)}
                        download
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2 w-full"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 Baixar CV
                      </a>
                    ) : (
                      <div className="p-3 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium flex items-center justify-center gap-2 w-full">
                        📄 CV não disponível
                      </div>
                    )}
                  </div>
                  
                  {candidatoSelecionado.mensagem && (
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">💬 Carta de Apresentação</h5>
                      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
                  {candidatoSelecionado.mensagem}
                </div>
              </div>
            )}
                  
                  {/* Botões de ação para empresa - dinâmicos baseados no status */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {getAcoesDisponiveis(candidatoSelecionado).map((acao, index) => (
                      <button 
                        key={index}
                        onClick={acao.action}
                        disabled={alterandoStatus}
                      className={`p-2 rounded text-xs font-medium transition ${
                          alterandoStatus
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : `${acao.color} text-white hover:opacity-80`
                      }`}
                      >
                        {acao.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Indicador de carregamento */}
                  {alterandoStatus && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      Alterando status...
                    </div>
                  )}
                </div>
              )}
              
              {/* Detalhes completos da vaga para o candidato */}
              {!isEmpresa && (
                <div className="bg-white border border-gray-200 p-4 rounded-lg flex-1">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📋 Detalhes da Vaga
                  </h5>
                  
                  {/* Detalhes da entrevista se agendada */}
                  {candidatoSelecionado.status === 'entrevista_agendada' && candidatoSelecionado.dataEntrevista && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h6 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        📅 Detalhes da Entrevista
                      </h6>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Data:</span> {new Date(candidatoSelecionado.dataEntrevista).toLocaleDateString('pt-BR')}</div>
                        <div><span className="font-medium">Horário:</span> {new Date(candidatoSelecionado.dataEntrevista).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div><span className="font-medium">Local:</span> {candidatoSelecionado.localEntrevista || 'Não informado'}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    {candidatoSelecionado.vaga?.empresa?.logo && (
                      <img
                        src={candidatoSelecionado.vaga.empresa.logo}
                        alt="Logo da empresa"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span className="font-semibold">{candidatoSelecionado.vaga?.empresa?.nome || 'Empresa'}</span>
                    <span className="text-gray-500">| {candidatoSelecionado.vaga?.localizacao || 'Localização'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Título:</span> {candidatoSelecionado.vaga?.titulo || '-'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Descrição:</span> {candidatoSelecionado.vaga?.descricao || '-'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Requisitos:</span>
                    <ul className="list-disc ml-5">
                      {(Array.isArray(candidatoSelecionado.vaga?.requisitos)
                        ? candidatoSelecionado.vaga.requisitos
                        : (candidatoSelecionado.vaga?.requisitos || '').split('\n')
                      ).map((req, idx) => (
                        <li key={idx} className="text-gray-600">{req}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Benefícios:</span>
                    <ul className="list-disc ml-5">
                      {(Array.isArray(candidatoSelecionado.vaga?.beneficios)
                        ? candidatoSelecionado.vaga.beneficios
                        : (candidatoSelecionado.vaga?.beneficios || '').split('\n')
                      ).map((ben, idx) => (
                        <li key={idx} className="text-gray-600">{ben}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Salário:</span> {candidatoSelecionado.vaga?.salario || '-'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Localização:</span> {candidatoSelecionado.vaga?.localizacao || '-'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Tipo:</span> {candidatoSelecionado.vaga?.tipoContrato || '-'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Modalidade:</span> {candidatoSelecionado.vaga?.modalidade || '-'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
        )}
      
      {/* Feedback de cancelamento */}
      {feedbackCancelamento && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                ✅ Candidatura cancelada!
              </p>
              <p className="text-xs mt-1 opacity-90">
                {feedbackCancelamento.vaga} - {feedbackCancelamento.empresa}
              </p>
              <p className="text-xs mt-1 opacity-75">
                Você pode se candidatar novamente se desejar.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setFeedbackCancelamento(null)}
                className="text-green-100 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast visual para status */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg text-white ${showToast.color || 'bg-green-500'}`}>
          {showToast.message}
        </div>
      )}

      {/* Modal para agendar entrevista */}
      <Modal
        isOpen={modalEntrevista}
        onClose={() => setModalEntrevista(false)}
        title="Agendar Entrevista"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Candidato:</strong> {candidatoSelecionado?.usuario?.nome || 'Candidato'}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Vaga:</strong> {candidatoSelecionado?.vaga?.titulo || 'Vaga'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Entrevista *
              </label>
              <input
                type="date"
                value={dadosEntrevista.data}
                onChange={(e) => setDadosEntrevista(prev => ({ ...prev, data: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário *
              </label>
              <input
                type="time"
                value={dadosEntrevista.hora}
                onChange={(e) => setDadosEntrevista(prev => ({ ...prev, hora: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local da Entrevista *
            </label>
            <input
              type="text"
              value={dadosEntrevista.local}
              onChange={(e) => setDadosEntrevista(prev => ({ ...prev, local: e.target.value }))}
              placeholder="Ex: Escritório da empresa, Online (Zoom), etc."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={confirmarAgendamento}
              disabled={alterandoStatus}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {alterandoStatus ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
            <button
              onClick={() => setModalEntrevista(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de cancelamento */}
      <Modal
        isOpen={modalCancelar}
        onClose={() => setModalCancelar(false)}
        title="Confirmar Cancelamento"
        size="sm"
      >
        <div className="text-center py-6">
          <p className="text-gray-800 mb-4">
            Tem certeza que deseja cancelar sua candidatura?
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={confirmarCancelamento}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Sim, Cancelar
            </button>
            <button
              onClick={() => setModalCancelar(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Não, Manter
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 
