import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMonetizacao } from '../context/MonetizacaoContext'
import api from '../services/api'

export default function NovoChamado() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { assinatura } = useMonetizacao()
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    localizacao: '',
    orcamento: '',
    prazo: '',
    prioridade: 'media',
    requisitos: [''],
    telefone: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showToast, setShowToast] = useState(null)

  const categorias = [
    { id: 'tecnologia', nome: 'Tecnologia', icon: '💻' },
    { id: 'domestico', nome: 'Doméstico', icon: '🏠' },
    { id: 'design', nome: 'Design', icon: '🎨' },
    { id: 'educacao', nome: 'Educação', icon: '📚' },
    { id: 'manutencao', nome: 'Manutenção', icon: '🔧' },
    { id: 'fotografia', nome: 'Fotografia', icon: '📷' },
    { id: 'transporte', nome: 'Transporte', icon: '🚗' },
    { id: 'saude', nome: 'Saúde', icon: '🏥' },
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setShowToast({ type: 'error', message: 'Faça login para criar um chamado' })
      setTimeout(() => setShowToast(null), 3000)
      return
    }

    // Validar campos obrigatórios
    if (!formData.titulo.trim() || !formData.descricao.trim() || !formData.categoria) {
      setShowToast({ type: 'error', message: 'Preencha todos os campos obrigatórios' })
      setTimeout(() => setShowToast(null), 3000)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar dados para envio
      const dadosChamado = {
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

      await api.post('/chamados', dadosChamado)
      
      setShowToast({ type: 'success', message: 'Chamado criado com sucesso!' })
      setTimeout(() => {
        navigate('/chamados')
      }, 1500)
    } catch (err) {
      console.error('Erro ao criar chamado:', err)
      setError(err.response?.data?.error || 'Erro ao criar chamado. Tente novamente.')
      setShowToast({ type: 'error', message: err.response?.data?.error || 'Erro ao criar chamado. Tente novamente.' })
      setTimeout(() => setShowToast(null), 3000)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Criar Novo Chamado</h1>
        <p className="text-gray-600">Descreva o serviço que você precisa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações básicas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Básicas</h2>
          
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
                Localização *
              </label>
              <input
                type="text"
                name="localizacao"
                value={formData.localizacao}
                onChange={handleChange}
                placeholder="Ex: Maputo, Bairro Central"
                required
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
        </div>

        {/* Descrição */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Descrição Detalhada</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Problema/Serviço *
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descreva detalhadamente o que você precisa..."
              rows={6}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Requisitos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Requisitos do Profissional</h2>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações de Contato</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="Ex: (11) 99999-9999"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ex: seu@email.com"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : 'Criar Chamado'}
          </button>
          <Link
            to="/chamados"
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Toast */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          showToast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {showToast.message}
        </div>
      )}
    </div>
  )
} 