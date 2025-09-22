import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Vagas() {
  const { user } = useAuth()
  const [vagas, setVagas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para filtros
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroLocalizacao, setFiltroLocalizacao] = useState('')
  const [filtroTipoContrato, setFiltroTipoContrato] = useState('')
  const [filtroModalidade, setFiltroModalidade] = useState('')
  const [filtroNivelExperiencia, setFiltroNivelExperiencia] = useState('')
  const [filtroSalario, setFiltroSalario] = useState('')
  const [ordenacao, setOrdenacao] = useState('recentes')

  // Buscar vagas da API
  useEffect(() => {
    const buscarVagas = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Construir query parameters para filtros
        const params = new URLSearchParams()
        if (filtroArea) params.append('area', filtroArea)
        if (filtroLocalizacao) params.append('localizacao', filtroLocalizacao)
        if (filtroTipoContrato) params.append('tipoContrato', filtroTipoContrato)
        if (filtroModalidade) params.append('modalidade', filtroModalidade)
        if (filtroNivelExperiencia) params.append('nivelExperiencia', filtroNivelExperiencia)
        if (filtroSalario) params.append('salario', filtroSalario)
        
        const response = await api.get(`/vagas?${params.toString()}`)
        setVagas(response.data.vagas)
      } catch (err) {
        console.error('Erro ao buscar vagas:', err)
        setError('Erro ao carregar vagas. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    buscarVagas()
  }, [filtroArea, filtroLocalizacao, filtroTipoContrato, filtroModalidade, filtroNivelExperiencia, filtroSalario])

  // Aplicar ordenação
  const vagasOrdenadas = [...vagas].sort((a, b) => {
    switch (ordenacao) {
      case 'recentes':
        return new Date(b.dataPublicacao) - new Date(a.dataPublicacao)
      case 'antigas':
        return new Date(a.dataPublicacao) - new Date(b.dataPublicacao)
      case 'premium':
        return (b.premium === true) - (a.premium === true)
      case 'visualizacoes':
        return b.visualizacoes - a.visualizacoes
      default:
        return 0
    }
  })

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroArea('')
    setFiltroLocalizacao('')
    setFiltroTipoContrato('')
    setFiltroModalidade('')
    setFiltroNivelExperiencia('')
    setFiltroSalario('')
    setOrdenacao('recentes')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando vagas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vagas Disponíveis</h1>
          <p className="text-gray-600">Encontre a oportunidade perfeita para sua carreira</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Área */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as áreas</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Marketing">Marketing</option>
                <option value="Vendas">Vendas</option>
                <option value="Administração">Administração</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Finanças">Finanças</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
              </select>
            </div>

            {/* Localização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <input
                type="text"
                value={filtroLocalizacao}
                onChange={(e) => setFiltroLocalizacao(e.target.value)}
                placeholder="Ex: Maputo"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tipo de Contrato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
              <select
                value={filtroTipoContrato}
                onChange={(e) => setFiltroTipoContrato(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os tipos</option>
                <option value="Efetivo">Efetivo</option>
                <option value="Prestador">Prestador</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Estagio">Estágio</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as modalidades</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="REMOTO">Remoto</option>
                <option value="HIBRIDO">Híbrido</option>
              </select>
            </div>

            {/* Nível de Experiência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiência</label>
              <select
                value={filtroNivelExperiencia}
                onChange={(e) => setFiltroNivelExperiencia(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os níveis</option>
                <option value="JUNIOR">Júnior</option>
                <option value="PLENO">Pleno</option>
                <option value="SENIOR">Sênior</option>
                <option value="ESPECIALISTA">Especialista</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
                <option value="premium">Premium primeiro</option>
                <option value="visualizacoes">Mais visualizadas</option>
              </select>
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Vagas */}
        <div className="space-y-6">
          {vagasOrdenadas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-gray-600">Tente ajustar os filtros ou volte mais tarde.</p>
            </div>
          ) : (
            vagasOrdenadas.map((vaga) => (
              <div key={vaga.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          <Link to={`/vaga/${vaga.id}`} className="hover:text-blue-600 transition">
                            {vaga.titulo}
                          </Link>
                        </h3>
                        {vaga.premium && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {vaga.empresa?.nome || 'Empresa não informada'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {vaga.localizacao || 'Localização não informada'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {vaga.descricao?.substring(0, 200)}...
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {vaga.area}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {vaga.tipoContrato}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                          {vaga.modalidade}
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                          {vaga.nivelExperiencia}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {vaga.visualizacoes || 0} visualizações
                          </span>
                          {vaga.salario && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              {vaga.salario}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/vaga/${vaga.id}`}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          Ver Detalhes
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginação (se necessário) */}
        {vagasOrdenadas.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-2">
              <button className="px-3 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50">
                Anterior
              </button>
              <span className="px-3 py-2 text-gray-700">Página 1</span>
              <button className="px-3 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50">
                Próxima
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
} 