import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [stats, setStats] = useState({
    vagas: 0,
    empresas: 0,        // empresas com vagas ativas
    empresasTotal: 0,    // empresas registradas
    candidatos: 0,
    chamados: 0,
    loading: true
  })

  // Buscar estatísticas reais do backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats')
        setStats({
          vagas: response.data.vagas || 0,
          empresas: response.data.empresas || 0,
          empresasTotal: response.data.empresasTotal || 0,
          candidatos: response.data.candidatos || 0,
          chamados: response.data.chamados || 0,
          loading: false
        })
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    // Buscar inicialmente
    fetchStats()

    // Configurar polling a cada 30 segundos
    const intervalId = setInterval(fetchStats, 30000)

    // Cleanup
    return () => clearInterval(intervalId)
  }, [])

  // Mock de vagas em destaque
  const vagasDestaque = [
    {
      id: 1,
      titulo: 'Desenvolvedor Frontend',
      empresa: 'TechMoç',
      localizacao: 'Maputo',
      salario: '15.000 - 25.000 MT',
      tipo: 'CLT',
      categoria: 'tecnologia',
      prioridade: 'alta',
      candidatos: 12
    },
    {
      id: 2,
      titulo: 'Designer Gráfico',
      empresa: 'Criativa',
      localizacao: 'Beira',
      salario: '12.000 - 18.000 MT',
      tipo: 'Freelancer',
      categoria: 'design',
      prioridade: 'media',
      candidatos: 8
    },
    {
      id: 3,
      titulo: 'Analista de Marketing',
      empresa: 'DigitalMoç',
      localizacao: 'Nampula',
      salario: '18.000 - 25.000 MT',
      tipo: 'CLT',
      categoria: 'marketing',
      prioridade: 'alta',
      candidatos: 15
    }
  ]

  // Mock de chamados em destaque
  const chamadosDestaque = [
    {
      id: 1,
      titulo: 'Desenvolvimento de Website',
      categoria: 'tecnologia',
      localizacao: 'Maputo',
      orcamento: '25.000 - 35.000 MT',
      prazo: '30 dias',
      propostas: 5
    },
    {
      id: 2,
      titulo: 'Design de Logo e Identidade Visual',
      categoria: 'design',
      localizacao: 'Beira',
      orcamento: '8.000 - 15.000 MT',
      prazo: '15 dias',
      propostas: 3
    },
    {
      id: 3,
      titulo: 'Campanha de Marketing Digital',
      categoria: 'marketing',
      localizacao: 'Nampula',
      orcamento: '20.000 - 30.000 MT',
      prazo: '45 dias',
      propostas: 7
    }
  ]

  const categorias = [
    { id: 'tecnologia', nome: 'Tecnologia', icon: '💻', vagas: 45 },
    { id: 'design', nome: 'Design', icon: '🎨', vagas: 32 },
    { id: 'marketing', nome: 'Marketing', icon: '📈', vagas: 28 },
    { id: 'administrativo', nome: 'Administrativo', icon: '📊', vagas: 38 },
    { id: 'vendas', nome: 'Vendas', icon: '💰', vagas: 25 },
    { id: 'saude', nome: 'Saúde', icon: '🏥', vagas: 18 }
  ]

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
      case 'design': return '🎨'
      case 'marketing': return '📈'
      case 'administrativo': return '📊'
      case 'vendas': return '💰'
      case 'saude': return '🏥'
      default: return '💼'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-0">
      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="text-center">
            {/* Logo e Título */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/nevu.png" alt="Nevú" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nevú
              </h1>
            </div>

            {/* Subtítulo */}
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Encontre oportunidades de emprego e serviços em Moçambique
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              Conectamos talentos às melhores oportunidades. Busque vagas, candidate-se gratuitamente 
              ou encontre serviços profissionais para seu negócio.
            </p>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="pt-6 pb-16 sm:pt-12 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Categorias Populares</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore oportunidades por área de atuação e encontre o que melhor se adequa ao seu perfil
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categorias.map(categoria => (
              <Link
                key={categoria.id}
                to={`/vagas?area=${encodeURIComponent(categoria.nome)}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 p-6 text-center group hover:border-blue-200 cursor-pointer"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {categoria.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {categoria.nome}
                </h3>
                {/* Removido contador de vagas por categoria para simplificar a UI */}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Estatísticas Reais */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Oportunidades Disponíveis</h2>
            <p className="text-blue-100 text-lg">Números atualizados em tempo real</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {stats.loading ? '...' : stats.vagas}
              </div>
              <div className="text-xl font-semibold text-white mb-1">Vagas Ativas</div>
              <div className="text-blue-100 text-sm">Disponíveis agora</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {stats.loading ? '...' : stats.empresas}
              </div>
              <div className="text-xl font-semibold text-white mb-1">Empresas</div>
              <div className="text-blue-100 text-sm">Contratando</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {stats.loading ? '...' : stats.candidatos}
              </div>
              <div className="text-xl font-semibold text-white mb-1">Candidatos</div>
              <div className="text-blue-100 text-sm">Buscando emprego</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {stats.loading ? '...' : stats.chamados}
              </div>
              <div className="text-xl font-semibold text-white mb-1">Chamados</div>
              <div className="text-blue-100 text-sm">Ativos</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {stats.loading ? '...' : stats.empresasTotal}
              </div>
              <div className="text-xl font-semibold text-white mb-1">Empresas</div>
              <div className="text-blue-100 text-sm">Na plataforma</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
