import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function HomeEmpresa() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [alertas, setAlertas] = useState([])
  const [atividades, setAtividades] = useState([])

  // Buscar dados do dashboard
  useEffect(() => {
    if (user && user.tipo === 'empresa') {
      fetchDashboardData()
    }
  }, [user])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      // Buscar estatísticas da empresa
      const statsResponse = await api.get(`/empresas/${user.id}/stats`)
      setStats([
        { label: 'Vagas publicadas', value: statsResponse.data.vagasPublicadas || 0, icon: '📋', color: 'text-blue-600' },
        { label: 'Candidaturas recebidas', value: statsResponse.data.candidaturasRecebidas || 0, icon: '👥', color: 'text-green-600' },
        { label: 'Vagas ativas', value: statsResponse.data.vagasAtivas || 0, icon: '✅', color: 'text-orange-600' },
        { label: 'Mensagens', value: statsResponse.data.mensagens || 0, icon: '📬', color: 'text-purple-600' },
        { label: 'Vagas expiradas', value: statsResponse.data.vagasExpiradas || 0, icon: '⏰', color: 'text-red-600' },
      ])

      // Buscar alertas da empresa
      const alertasResponse = await api.get(`/empresas/${user.id}/alertas`)
      setAlertas(alertasResponse.data || [])

      // Buscar atividades recentes
      const atividadesResponse = await api.get(`/empresas/${user.id}/atividades`)
      setAtividades(atividadesResponse.data || [])

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      
      // Fallback para dados mockados se a API não estiver disponível
      setStats([
        { label: 'Vagas publicadas', value: 0, icon: '📋', color: 'text-blue-600' },
        { label: 'Candidaturas recebidas', value: 0, icon: '👥', color: 'text-green-600' },
        { label: 'Vagas ativas', value: 0, icon: '✅', color: 'text-orange-600' },
        { label: 'Mensagens', value: 0, icon: '📬', color: 'text-purple-600' },
        { label: 'Vagas expiradas', value: 0, icon: '⏰', color: 'text-red-600' },
      ])
      
      setAlertas([
        { tipo: 'info', texto: 'Bem-vindo! Comece publicando sua primeira vaga.', icon: '🎉' },
        { tipo: 'success', texto: 'Seu perfil foi configurado com sucesso.', icon: '✅' },
      ])
      
      setAtividades([
        { tipo: 'welcome', texto: 'Conta criada com sucesso', tempo: 'Agora', icon: '🎉' },
        { tipo: 'profile', texto: 'Perfil configurado', tempo: 'Agora', icon: '👤' },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Dados da empresa - usando estrutura correta do backend
  const logoEmpresa = user?.logo || user?.perfil?.logo || '/nevu.png'
  const nomeFantasia = user?.nome || 'Empresa Exemplo'
  const nuit = user?.nuit || user?.perfil?.nuit || 'N/D'
  const emailEmpresa = user?.email || 'empresa@email.com'
  const setor = user?.setor || user?.perfil?.setor || 'N/D'
  const endereco = user?.endereco || user?.perfil?.endereco || 'N/D'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Carregando dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-24 md:pb-6">
      {/* Header com logo e dados da empresa */}
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-6">
          <div className="flex-shrink-0 flex items-center justify-center">
            {logoEmpresa && logoEmpresa !== '/nevu.png' ? (
            <img src={logoEmpresa} alt="Logo da empresa" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-4xl text-blue-700 font-extrabold select-none">
                  {(nomeFantasia || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                </span>
              </div>
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 mb-2">{nomeFantasia}</h1>
            <div className="space-y-1 text-sm lg:text-base text-gray-600">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-gray-400">🏢</span>
                <span>Setor: {setor}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-gray-400">📍</span>
                <span>{endereco}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-gray-400">📧</span>
                <span>{emailEmpresa}</span>
              </div>
              {nuit !== 'N/D' && (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-gray-400">🆔</span>
                  <span>NUIT: {nuit}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas e notificações */}
      {alertas.length > 0 && (
      <div className="mb-6 space-y-3">
        {alertas.map((alerta, i) => (
          <div key={i} className={`rounded-xl px-4 py-3 text-sm font-medium shadow-sm border-l-4 ${
            alerta.tipo === 'info' ? 'bg-blue-50 text-blue-700 border-blue-400' :
            alerta.tipo === 'success' ? 'bg-green-50 text-green-700 border-green-400' :
              alerta.tipo === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-400' :
            'bg-gray-50 text-gray-700 border-gray-400'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{alerta.icon}</span>
              <span>{alerta.texto}</span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Estatísticas */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📊 Estatísticas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, i) => (
                          <div key={i} className="bg-white rounded-xl shadow-sm border p-3 sm:p-4 lg:p-6 flex flex-col items-center text-center">
                              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1">{stat.icon}</div>
                <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Dicas */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <span className="text-2xl lg:text-3xl">💡</span>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">Dicas para Empresas</h2>
        </div>
        <div className="space-y-3 lg:space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-lg lg:text-xl">✓</span>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700">Publique vagas detalhadas para atrair os melhores candidatos.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-lg lg:text-xl">✓</span>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700">Responda rapidamente às candidaturas para não perder talentos.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-lg lg:text-xl">✓</span>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700">Mantenha suas vagas atualizadas e remova as expiradas.</p>
          </div>
        </div>
      </div>

      {/* Seção de Atividade Recente (Mobile-friendly) */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <span className="text-2xl lg:text-3xl">🕒</span>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Atividade Recente</h2>
        </div>
        {atividades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">Nenhuma atividade recente.</p>
            <p className="text-gray-400 text-sm mt-2">Comece publicando sua primeira vaga!</p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {atividades.map((atividade, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 lg:p-4 rounded-lg ${
                atividade.tipo === 'candidatura' ? 'bg-blue-50' :
                atividade.tipo === 'vaga' ? 'bg-green-50' :
                atividade.tipo === 'warning' ? 'bg-yellow-50' :
                atividade.tipo === 'welcome' ? 'bg-purple-50' :
                atividade.tipo === 'profile' ? 'bg-indigo-50' :
                'bg-gray-50'
              }`}>
                <span className={`text-lg lg:text-xl ${
                  atividade.tipo === 'candidatura' ? 'text-blue-600' :
                  atividade.tipo === 'vaga' ? 'text-green-600' :
                  atividade.tipo === 'warning' ? 'text-yellow-600' :
                  atividade.tipo === 'welcome' ? 'text-purple-600' :
                  atividade.tipo === 'profile' ? 'text-indigo-600' :
                  'text-gray-600'
                }`}>{atividade.icon}</span>
            <div className="flex-1">
                  <p className="text-sm lg:text-base font-medium text-gray-800">{atividade.texto}</p>
                  <p className="text-xs lg:text-sm text-gray-600">{atividade.tempo}</p>
            </div>
          </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 