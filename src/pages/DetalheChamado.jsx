import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useMonetizacao } from '../context/MonetizacaoContext'
import api from '../services/api'

export default function DetalheChamado() {
  const { id } = useParams()
  const [modalProposta, setModalProposta] = useState(false)
  const [proposta, setProposta] = useState('')
  const { user } = useAuth()
  const { assinatura } = useMonetizacao()
  const [favorito, setFavorito] = useState(false)
  const [showToast, setShowToast] = useState(null)
  const [modalReportar, setModalReportar] = useState(false)
  const [motivoReport, setMotivoReport] = useState('')
  const [chamado, setChamado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [editando, setEditando] = useState(false)

  const navigate = useNavigate()

  // Carregar detalhes do chamado
  const carregarChamado = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/chamados/${id}`)
      setChamado(response.data)
      setFavorito(response.data.favoritado || false)
    } catch (err) {
      console.error('Erro ao carregar chamado:', err)
      setError('Erro ao carregar detalhes do chamado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      carregarChamado()
    }
  }, [id])

  // Verifica se o usuário logado é o dono do chamado
  const isDono = user && chamado && user.id === chamado.usuarioId

  // Função Favoritar
  const handleFavoritar = async () => {
    if (!user) {
      setShowToast({ type: 'error', message: 'Faça login para favoritar chamados.' })
      setTimeout(() => setShowToast(null), 2200)
      return
    }

    try {
      await api.put(`/chamados/${id}/favorito`)
      setFavorito(!favorito)
      setShowToast({ 
        type: favorito ? 'info' : 'success', 
        message: favorito ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!' 
      })
      setTimeout(() => setShowToast(null), 1800)
    } catch (err) {
      console.error('Erro ao favoritar:', err)
      setShowToast({ type: 'error', message: 'Erro ao favoritar chamado' })
      setTimeout(() => setShowToast(null), 2200)
    }
  }

  // Função para enviar proposta
  const enviarProposta = async () => {
    if (!proposta.trim()) {
      setShowToast({ type: 'error', message: 'Digite uma proposta' })
      return
    }

    if (!user) {
      setShowToast({ type: 'error', message: 'Faça login para enviar propostas' })
      return
    }

    try {
      setEnviandoProposta(true)
      await api.post(`/chamados/${id}/respostas`, {
        resposta: proposta,
        tipo: 'proposta'
      })
      
      setShowToast({ type: 'success', message: 'Proposta enviada com sucesso!' })
      setModalProposta(false)
      setProposta('')
      
      // Recarregar chamado para mostrar a nova resposta
      await carregarChamado()
    } catch (err) {
      console.error('Erro ao enviar proposta:', err)
      setShowToast({ type: 'error', message: err.response?.data?.error || 'Erro ao enviar proposta' })
    } finally {
      setEnviandoProposta(false)
    }
  }

  // Função para editar chamado
  const editarChamado = async (dadosEditados) => {
    try {
      setEditando(true)
      await api.put(`/chamados/${id}`, dadosEditados)
      
      setShowToast({ type: 'success', message: 'Chamado atualizado com sucesso!' })
      setModalEditar(false)
      
      // Recarregar chamado para mostrar as alterações
      await carregarChamado()
    } catch (err) {
      console.error('Erro ao editar chamado:', err)
      setShowToast({ type: 'error', message: err.response?.data?.error || 'Erro ao editar chamado' })
    } finally {
      setEditando(false)
    }
  }

  // Função Compartilhar robusta
  const handleCompartilhar = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: chamado?.titulo, url })
        setShowToast({ type: 'success', message: 'Chamado compartilhado!' })
        setTimeout(() => setShowToast(null), 2200)
      } catch (err) {
        if (err && err.name === 'AbortError') {
          setShowToast({ type: 'info', message: 'Compartilhamento cancelado.' })
        } else {
          setShowToast({ type: 'error', message: 'Não foi possível compartilhar.' })
        }
        setTimeout(() => setShowToast(null), 2200)
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setShowToast({ type: 'success', message: 'Link copiado para área de transferência!' })
      } catch (err) {
        setShowToast({ type: 'error', message: 'Erro ao copiar o link. Copie manualmente.' })
      }
      setTimeout(() => setShowToast(null), 2200)
    } else {
      setShowToast({ type: 'info', message: 'Não foi possível compartilhar.' })
      setTimeout(() => setShowToast(null), 2200)
    }
  }

  // Função Reportar
  const handleReportar = () => {
    setModalReportar(true)
  }

  const enviarReport = () => {
    setModalReportar(false)
    setShowToast({ type: 'success', message: 'Chamado reportado! Obrigado pelo feedback.' })
    setMotivoReport('')
    setTimeout(() => setShowToast(null), 2200)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'aberto': return 'bg-green-100 text-green-800'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
      case 'concluido': return 'bg-blue-100 text-blue-800'
      case 'fechado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'tecnologia': return '💻'
      case 'domestico': return '🏠'
      case 'design': return '🎨'
      case 'educacao': return '📚'
      case 'manutencao': return '🔧'
      case 'fotografia': return '📷'
      default: return '📋'
    }
  }

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do chamado...</p>
        </div>
      </div>
    )
  }

  if (error || !chamado) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar chamado</h3>
          <p className="text-gray-600 mb-4">{error || 'Chamado não encontrado'}</p>
          <Link to="/chamados" className="text-blue-600 hover:text-blue-800">
            Voltar aos chamados
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/chamados" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar aos Chamados
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{chamado.titulo}</h1>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(chamado.status)}`}>
            {chamado.status.toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(chamado.prioridade)}`}>
            {chamado.prioridade.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {getCategoriaIcon(chamado.categoria)} {chamado.categoria.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informações principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Descrição</h2>
            <p className="text-gray-600 leading-relaxed">{chamado.descricao}</p>
          </div>

          {/* Informações do serviço */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações do Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Localização</span>
                <p className="font-medium text-gray-800">{chamado.localizacao || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Orçamento</span>
                <p className="font-medium text-gray-800">{chamado.orcamento || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Prazo</span>
                <p className="font-medium text-gray-800">{chamado.prazo ? formatarData(chamado.prazo) : 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Abertura</span>
                <p className="font-medium text-gray-800">{formatarData(chamado.data)}</p>
              </div>
            </div>
          </div>

          {/* Requisitos */}
          {chamado.requisitos && chamado.requisitos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Requisitos do Profissional</h2>
              <ul className="space-y-2">
                {chamado.requisitos.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Respostas/Propostas */}
          {chamado.respostasList && chamado.respostasList.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Respostas ({chamado.respostasList.length})
              </h2>
              <div className="space-y-4">
                {chamado.respostasList.map((resposta) => (
                  <div key={resposta.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                        {resposta.usuario?.foto ? (
                          <img 
                            src={resposta.usuario.foto} 
                            alt={resposta.usuario.nome}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          resposta.usuario?.nome?.charAt(0) || 'U'
                        )}
                      </div>
                      <span className="font-medium text-gray-800">{resposta.usuario?.nome}</span>
                      <span className="text-sm text-gray-500">{formatarData(resposta.data)}</span>
                      {resposta.tipo === 'proposta' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Proposta</span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{resposta.resposta}</p>
                    {resposta.orcamento && (
                      <div className="text-sm text-gray-600">
                        <strong>Orçamento:</strong> {resposta.orcamento}
                      </div>
                    )}
                    {resposta.prazo && (
                      <div className="text-sm text-gray-600">
                        <strong>Prazo:</strong> {formatarData(resposta.prazo)}
                      </div>
                    )}
                    {isDono && !resposta.aceita && (
                      <button
                        onClick={() => {
                          // Implementar aceitar proposta
                          setShowToast({ type: 'info', message: 'Funcionalidade em desenvolvimento' })
                        }}
                        className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                      >
                        Aceitar Proposta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações de Contato</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Nome</span>
                <p className="font-medium text-gray-800">{chamado.usuario?.nome}</p>
              </div>
              {chamado.telefone && (
                <div>
                  <span className="text-sm text-gray-500">Telefone</span>
                  <p className="font-medium text-gray-800">{chamado.telefone}</p>
                </div>
              )}
              {chamado.email && (
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-medium text-gray-800">{chamado.email}</p>
                </div>
              )}
            </div>
          </div>

                    {/* Ações */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações</h3>
            <div className="space-y-3">
              {isDono && (
                <button
                  onClick={() => setModalEditar(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ✏️ Editar Chamado
                </button>
              )}

              <button
                onClick={handleFavoritar}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  favorito 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {favorito ? '⭐ Favoritado' : '☆ Favoritar'}
              </button>

              <button
                onClick={handleCompartilhar}
                className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
              >
                📤 Compartilhar
              </button>

              {!isDono ? (
                <button
                  onClick={() => setModalProposta(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  💬 Enviar Proposta
                </button>
              ) : (
                <span className="w-full px-4 py-2 text-center text-gray-500 text-sm">
                  Você não pode responder seu próprio chamado
                </span>
              )}

              <button
                onClick={handleReportar}
                className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                ⚠️ Reportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Proposta */}
      {modalProposta && (
        <Modal isOpen={modalProposta} onClose={() => setModalProposta(false)} title="Enviar Proposta">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sua proposta:</label>
              <textarea
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                placeholder="Descreva sua proposta, incluindo orçamento e prazo..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalProposta(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarProposta}
                disabled={enviandoProposta || !proposta.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {enviandoProposta ? 'Enviando...' : 'Enviar Proposta'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Editar Chamado */}
      {modalEditar && chamado && (
        <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} title="Editar Chamado">
          <EditarChamadoForm 
            chamado={chamado}
            onSave={editarChamado}
            onCancel={() => setModalEditar(false)}
            loading={editando}
          />
        </Modal>
      )}

      {/* Modal de Reportar */}
      {modalReportar && (
        <Modal isOpen={modalReportar} onClose={() => setModalReportar(false)} title="Reportar Chamado">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo do report:</label>
              <textarea
                value={motivoReport}
                onChange={(e) => setMotivoReport(e.target.value)}
                placeholder="Descreva o motivo do report..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalReportar(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarReport}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reportar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          showToast.type === 'success' ? 'bg-green-500 text-white' : 
          showToast.type === 'error' ? 'bg-red-500 text-white' :
          showToast.type === 'info' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
        }`}>
          {showToast.message}
        </div>
      )}
    </div>
  )
}

// Componente de formulário para editar chamado
function EditarChamadoForm({ chamado, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    titulo: chamado.titulo || '',
    descricao: chamado.descricao || '',
    categoria: chamado.categoria || '',
    localizacao: chamado.localizacao || '',
    orcamento: chamado.orcamento || '',
    prazo: chamado.prazo ? new Date(chamado.prazo).toISOString().split('T')[0] : '',
    prioridade: chamado.prioridade || 'media',
    requisitos: chamado.requisitos || [''],
    telefone: chamado.telefone || '',
    email: chamado.email || ''
  })

  const categorias = [
    { id: 'tecnologia', nome: 'Tecnologia', icon: '💻' },
    { id: 'domestico', nome: 'Doméstico', icon: '🏠' },
    { id: 'design', nome: 'Design', icon: '🎨' },
    { id: 'educacao', nome: 'Educação', icon: '📚' },
    { id: 'manutencao', nome: 'Manutenção', icon: '🔧' },
    { id: 'fotografia', nome: 'Fotografia', icon: '📷' },
    { id: 'outros', nome: 'Outros', icon: '📋' }
  ]

  const prioridades = [
    { id: 'baixa', nome: 'Baixa', color: 'text-green-600' },
    { id: 'media', nome: 'Média', color: 'text-yellow-600' },
    { id: 'alta', nome: 'Alta', color: 'text-red-600' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addRequisito = () => {
    setFormData(prev => ({
      ...prev,
      requisitos: [...prev.requisitos, '']
    }))
  }

  const removeRequisito = (index) => {
    setFormData(prev => ({
      ...prev,
      requisitos: prev.requisitos.filter((_, i) => i !== index)
    }))
  }

  const updateRequisito = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requisitos: prev.requisitos.map((req, i) => i === index ? value : req)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar campos obrigatórios
    if (!formData.titulo.trim() || !formData.descricao.trim() || !formData.categoria) {
      return
    }

    // Preparar dados para envio
    const dadosEditados = {
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim(),
      categoria: formData.categoria,
      localizacao: formData.localizacao.trim(),
      orcamento: formData.orcamento.trim(),
      prazo: formData.prazo,
      prioridade: formData.prioridade,
      requisitos: formData.requisitos.filter(req => req.trim()),
      telefone: formData.telefone.trim(),
      email: formData.email.trim()
    }

    onSave(dadosEditados)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título do Chamado *
          </label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ex: Manutenção de Computador"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização
          </label>
          <input
            type="text"
            name="localizacao"
            value={formData.localizacao}
            onChange={handleChange}
            placeholder="Ex: Maputo, Bairro Central"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orçamento
          </label>
          <input
            type="text"
            name="orcamento"
            value={formData.orcamento}
            onChange={handleChange}
            placeholder="Ex: 500-1000 MT"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prazo
          </label>
          <input
            type="date"
            name="prazo"
            value={formData.prazo}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridade
          </label>
          <select
            name="prioridade"
            value={formData.prioridade}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {prioridades.map(pri => (
              <option key={pri.id} value={pri.id} className={pri.color}>
                {pri.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição do Problema/Serviço *
        </label>
        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          placeholder="Descreva detalhadamente o que você precisa..."
          rows={4}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Requisitos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Requisitos do Profissional</label>
          <button
            type="button"
            onClick={addRequisito}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            + Adicionar
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.requisitos.map((requisito, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={requisito}
                onChange={(e) => updateRequisito(index, e.target.value)}
                placeholder="Ex: Experiência com manutenção de computadores"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.requisitos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequisito(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            placeholder="Ex: (11) 99999-9999"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ex: seu@email.com"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  )
} 