import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonetizacao } from '../context/MonetizacaoContext'
import { useNavigate } from 'react-router-dom'
import ApiEmpresarial from './ApiEmpresarial';

// Componente mock de integração com ATS
function IntegracaoATS() {
  const [url, setUrl] = useState(() => localStorage.getItem('nevu_ats_url') || '');
  const [integrado, setIntegrado] = useState(!!localStorage.getItem('nevu_ats_url'));
  const [editando, setEditando] = useState(false);
  const [toast, setToast] = useState(null);

  // Vagas mock simulando importação do ATS
  const vagasMock = [
    { id: 1, titulo: 'Desenvolvedor(a) Frontend', status: 'Aberta', data: '2024-06-01' },
    { id: 2, titulo: 'Analista de RH', status: 'Em andamento', data: '2024-05-28' },
    { id: 3, titulo: 'Gerente de Projetos', status: 'Fechada', data: '2024-05-15' },
  ];

  function handleIntegrar() {
    if (url) {
      localStorage.setItem('nevu_ats_url', url);
      setIntegrado(true);
      setEditando(false);
      setToast('Integração com ATS realizada com sucesso!');
      setTimeout(() => setToast(null), 2500);
    }
  }
  function handleDesconectar() {
    localStorage.removeItem('nevu_ats_url');
    setUrl('');
    setIntegrado(false);
    setEditando(false);
    setToast('Integração com ATS removida.');
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8 border border-blue-200">
      <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
        Integração com ATS
        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Empresarial</span>
      </h3>
      <p className="text-gray-600 text-sm mb-2">
        Conecte seu sistema de recrutamento (ATS) para automatizar o fluxo de vagas e candidatos.<br/>
        <span className="text-blue-700 font-medium">Em breve:</span> importação automática de vagas, exportação de candidatos e sincronização de status!
      </p>
      {toast && (
        <div className="mb-3 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded">
          {toast}
        </div>
      )}
      {integrado ? (
        <div>
          <p className="text-green-700 mb-2">Integrado com: <b>{url}</b></p>
          <button onClick={handleDesconectar} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mb-4">Desconectar</button>
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Vagas importadas do ATS (simulação):</h4>
            <ul className="divide-y divide-gray-200">
              {vagasMock.map(vaga => (
                <li key={vaga.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-gray-800">{vaga.titulo}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 ${vaga.status === 'Aberta' ? 'bg-green-100 text-green-700' : vaga.status === 'Fechada' ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{vaga.status}</span>
                  <span className="ml-4 text-xs text-gray-500">{vaga.data}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2">* Esta lista é apenas ilustrativa. Na integração real, as vagas seriam importadas automaticamente do seu ATS.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL do seu ATS (ex: https://empresa.gupy.io)"
            className="p-2 border rounded w-full sm:w-80 mb-2"
            disabled={integrado}
          />
          <button onClick={handleIntegrar} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Simular Integração</button>
        </div>
      )}
    </div>
  );
}

export default function Assinaturas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { assinatura: assinaturaCtx, planosCandidato, loading: loadingMonetizacao } = useMonetizacao()
  const [historicoPagamentos, setHistoricoPagamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const isCandidato = user && user.tipo === 'usuario'

  // Mock de dados da assinatura atual (empresa)
  const mockAssinatura = {
    plano: 'basico',
    nome: 'Básico',
    preco: 2500,
    moeda: 'MT',
    periodo: 'Mensal',
    dataInicio: '2024-01-01',
    proximoPagamento: '2024-02-01',
    status: 'ativa',
    limiteVagas: 10,
    vagasUsadas: 3,
    limiteMensagens: -1,
    mensagensUsadas: 45
  }

  // Mock de histórico de pagamentos (empresa)
  const mockHistorico = [
    {
      id: 1,
      data: '2024-01-01',
      valor: 2500,
      moeda: 'MT',
      metodo: 'M-Pesa',
      status: 'pago',
      plano: 'Básico'
    },
    {
      id: 2,
      data: '2023-12-01',
      valor: 2500,
      moeda: 'MT',
      metodo: 'E-Mola',
      status: 'pago',
      plano: 'Básico'
    },
    {
      id: 3,
      data: '2023-11-01',
      valor: 2500,
      moeda: 'MT',
      metodo: 'M-Pesa',
      status: 'pago',
      plano: 'Básico'
    }
  ]

  useEffect(() => {
    if (!isCandidato) {
      setTimeout(() => {
        setHistoricoPagamentos(mockHistorico)
        setLoading(false)
      }, 1000)
    } else {
      setLoading(false)
    }
  }, [isCandidato])

  const calcularProgressoVagas = () => {
    if (assinaturaCtx.limiteVagas === -1) return 100
    return (assinaturaCtx.vagasUsadas / assinaturaCtx.limiteVagas) * 100
  }

  const calcularProgressoMensagens = () => {
    if (assinaturaCtx.limiteMensagens === -1) return 100
    return (assinaturaCtx.mensagensUsadas / assinaturaCtx.limiteMensagens) * 100
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor)
  }

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-MZ')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'expirada': return 'bg-red-100 text-red-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleUpgrade = () => {
    navigate('/monetizacao')
  }

  const handleCancelar = () => {
    setShowCancelModal(true)
  }
  const confirmCancelar = () => {
    setShowCancelModal(false)
    setCancelLoading(true)
    setTimeout(() => {
      setCancelLoading(false)
      setCancelSuccess(true)
      // setAssinatura(prev => ({ ...prev, status: 'cancelada' })) // This line was removed as per the edit hint
      setTimeout(() => setCancelSuccess(false), 1800)
    }, 2000)
  }

  // --- INTERFACE PARA CANDIDATO ---
  if ((loading && isCandidato) || loadingMonetizacao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assinatura...</p>
        </div>
      </div>
    )
  }

  if (isCandidato && assinaturaCtx && planosCandidato) {
    const planoAtual = planosCandidato[assinaturaCtx.plano]
    return (
      <div className="min-h-screen bg-gray-50 py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Minha Assinatura
            </h1>
            <p className="text-gray-600">
              Gerencie seu plano e acompanhe o uso dos recursos
            </p>
          </div>

          {/* Status da Assinatura */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mr-4">{planoAtual.nome}</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800`}>
                    Ativa
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor Mensal</p>
                    <p className="text-lg font-semibold text-gray-900">{planoAtual.preco === 0 ? 'Grátis' : `${planoAtual.preco.toLocaleString()} MT`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Candidaturas Simultâneas</p>
                    <p className="text-lg font-semibold text-gray-900">{planoAtual.limiteCandidaturas === -1 ? 'Ilimitadas' : planoAtual.limiteCandidaturas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mensagens por mês</p>
                    <p className="text-lg font-semibold text-gray-900">{planoAtual.limiteMensagens === -1 ? 'Ilimitadas' : planoAtual.limiteMensagens}</p>
                  </div>
                </div>
                {/* Exibir datas se existirem */}
                {(assinaturaCtx.dataInicio || assinaturaCtx.proximoPagamento) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {assinaturaCtx.dataInicio && (
                      <div>
                        <p className="text-sm text-gray-600">Início da Assinatura</p>
                        <p className="text-base font-semibold text-gray-900">{formatarData(assinaturaCtx.dataInicio)}</p>
                      </div>
                    )}
                    {assinaturaCtx.proximoPagamento && (
                      <div>
                        <p className="text-sm text-gray-600">Próximo Pagamento</p>
                        <p className="text-base font-semibold text-gray-900">{formatarData(assinaturaCtx.proximoPagamento)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  disabled={cancelLoading}
                >
                  Fazer Upgrade
                </button>
                <button
                  onClick={handleCancelar}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
                </button>
              </div>
            </div>
          </div>

          {/* Benefícios do Plano */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefícios do Plano {planoAtual.nome}</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {planoAtual.recursos.map((r, i) => (
                <li key={i} className="flex items-start"><span className="text-green-500 mr-2">✓</span>{r}</li>
              ))}
            </ul>
          </div>

          {/* Próximos Passos */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Passos</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Fazer Upgrade</h4>
                <p className="text-sm text-blue-700 mb-3">Aproveite mais benefícios e destaque seu perfil</p>
                {/* Botão 'Ver Planos' removido */}
              </div>
            </div>
          </div>

          {/* Modal de confirmação de cancelamento */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Cancelar Assinatura</h3>
                  <p className="text-gray-700 mb-6">Tem certeza que deseja cancelar sua assinatura?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                      disabled={cancelLoading}
                    >
                      Não
                    </button>
                    <button
                      onClick={confirmCancelar}
                      className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      disabled={cancelLoading}
                    >
                      Sim, Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Feedback de cancelamento */}
          {cancelSuccess && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    ✅ Assinatura cancelada!
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    Sua assinatura foi cancelada com sucesso.
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setCancelSuccess(false)}
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
        </div>
      </div>
    )
  }

  // --- INTERFACE PARA EMPRESA (mock) ---
  if (!isCandidato && user && user.assinatura) {
    const { planos } = useMonetizacao();
    const planoObj = planos[user.assinatura.plano] || planos['gratuito'];
    return (
      <div className="min-h-screen bg-gray-50 py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Minha Assinatura
            </h1>
            <p className="text-gray-600">
              Gerencie seu plano e acompanhe o uso dos recursos
            </p>
          </div>

          {/* Status da Assinatura */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mr-4">{planoObj.nome}</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(user.assinatura.status)}`}>
                    {user.assinatura.status === 'ativa' ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor Mensal</p>
                    <p className="text-lg font-semibold text-gray-900">{planoObj.preco === 0 ? 'Grátis' : `${planoObj.preco.toLocaleString()} MT`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Próximo Pagamento</p>
                    <p className="text-lg font-semibold text-gray-900">{formatarData(user.assinatura.proximoPagamento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Início da Assinatura</p>
                    <p className="text-lg font-semibold text-gray-900">{formatarData(user.assinatura.dataInicio)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  disabled={cancelLoading}
                >
                  Fazer Upgrade
                </button>
                <button
                  onClick={handleCancelar}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
                </button>
              </div>
            </div>
          </div>

          {/* Benefícios do Plano */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefícios do Plano {planoObj.nome}</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {planoObj.recursos && planoObj.recursos.map((r, i) => (
                <li key={i} className="flex items-start"><span className="text-green-500 mr-2">✓</span>{r}</li>
              ))}
            </ul>
          </div>

          {/* Uso dos Recursos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Vagas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Vagas</h3>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Vagas utilizadas</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {user.assinatura.vagasUsadas} / {user.assinatura.limiteVagas === -1 ? '∞' : user.assinatura.limiteVagas}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calcularProgressoVagas()}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {user.assinatura.limiteVagas === -1 
                  ? 'Vagas ilimitadas' 
                  : `${user.assinatura.limiteVagas - user.assinatura.vagasUsadas} vagas restantes`
                }
              </p>
            </div>

            {/* Mensagens */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Mensagens</h3>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Mensagens enviadas</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {user.assinatura.mensagensUsadas} / {user.assinatura.limiteMensagens === -1 ? '∞' : user.assinatura.limiteMensagens}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calcularProgressoMensagens()}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {user.assinatura.limiteMensagens === -1 
                  ? 'Mensagens ilimitadas' 
                  : `${user.assinatura.limiteMensagens - user.assinatura.mensagensUsadas} mensagens restantes`
                }
              </p>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Pagamentos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicoPagamentos.map((pagamento) => (
                    <tr key={pagamento.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarData(pagamento.data)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pagamento.plano}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatarMoeda(pagamento.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pagamento.metodo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          pagamento.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pagamento.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Benefícios do Plano {user.assinatura.nome}
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {user.assinatura.limiteVagas === -1 ? 'Vagas ilimitadas' : `Até ${user.assinatura.limiteVagas} vagas ativas`}
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Acesso completo a candidatos
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {user.assinatura.limiteMensagens === -1 ? 'Mensagens ilimitadas' : `${user.assinatura.limiteMensagens} mensagens por mês`}
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Suporte prioritário
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Relatórios avançados
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Próximos Passos
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Fazer Upgrade</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Aproveite mais recursos e pague menos comissões
                  </p>
                  <button
                    onClick={handleUpgrade}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ver Planos
                  </button>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Publicar Vagas</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Use suas vagas disponíveis para encontrar talentos
                  </p>
                  <button className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Publicar Vaga
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Adicionar API Empresarial e Integração ATS apenas para planos premium e empresarial */}
          {(user.assinatura.plano === 'empresarial' || user.assinatura.plano === 'premium') && (
            <>
              <ApiEmpresarial />
              <IntegracaoATS />
            </>
          )}
        </div>

        {/* Modal de confirmação de cancelamento */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cancelar Assinatura</h3>
                <p className="text-gray-700 mb-6">Tem certeza que deseja cancelar sua assinatura?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    disabled={cancelLoading}
                  >
                    Não
                  </button>
                  <button
                    onClick={confirmCancelar}
                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    disabled={cancelLoading}
                  >
                    Sim, Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Feedback de cancelamento */}
        {cancelSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  ✅ Assinatura cancelada!
                </p>
                <p className="text-xs mt-1 opacity-90">
                  Sua assinatura foi cancelada com sucesso.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setCancelSuccess(false)}
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Minha Assinatura
          </h1>
          <p className="text-gray-600">
            Gerencie seu plano e acompanhe o uso dos recursos
          </p>
        </div>

        {/* Status da Assinatura */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mr-4">{assinaturaCtx.nome}</h2>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(assinaturaCtx.status)}`}>
                  {assinaturaCtx.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Valor Mensal</p>
                  <p className="text-lg font-semibold text-gray-900">{formatarMoeda(assinaturaCtx.preco)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Próximo Pagamento</p>
                  <p className="text-lg font-semibold text-gray-900">{formatarData(assinaturaCtx.proximoPagamento)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Início da Assinatura</p>
                  <p className="text-lg font-semibold text-gray-900">{formatarData(assinaturaCtx.dataInicio)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpgrade}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                disabled={cancelLoading}
              >
                Fazer Upgrade
              </button>
              <button
                onClick={handleCancelar}
                className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
              </button>
            </div>
          </div>
        </div>

        {/* Uso dos Recursos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vagas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Vagas</h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Vagas utilizadas</span>
                <span className="text-sm font-semibold text-gray-900">
                  {assinaturaCtx.vagasUsadas} / {assinaturaCtx.limiteVagas === -1 ? '∞' : assinaturaCtx.limiteVagas}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calcularProgressoVagas()}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {assinaturaCtx.limiteVagas === -1 
                ? 'Vagas ilimitadas' 
                : `${assinaturaCtx.limiteVagas - assinaturaCtx.vagasUsadas} vagas restantes`
              }
            </p>
          </div>

          {/* Mensagens */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Mensagens</h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Mensagens enviadas</span>
                <span className="text-sm font-semibold text-gray-900">
                  {assinaturaCtx.mensagensUsadas} / {assinaturaCtx.limiteMensagens === -1 ? '∞' : assinaturaCtx.limiteMensagens}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calcularProgressoMensagens()}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {assinaturaCtx.limiteMensagens === -1 
                ? 'Mensagens ilimitadas' 
                : `${assinaturaCtx.limiteMensagens - assinaturaCtx.mensagensUsadas} mensagens restantes`
              }
            </p>
          </div>
        </div>

        {/* Histórico de Pagamentos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Histórico de Pagamentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historicoPagamentos.map((pagamento) => (
                  <tr key={pagamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(pagamento.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pagamento.plano}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatarMoeda(pagamento.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pagamento.metodo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pagamento.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pagamento.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Benefícios do Plano {assinaturaCtx.nome}
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {assinaturaCtx.limiteVagas === -1 ? 'Vagas ilimitadas' : `Até ${assinaturaCtx.limiteVagas} vagas ativas`}
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Acesso completo a candidatos
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {assinaturaCtx.limiteMensagens === -1 ? 'Mensagens ilimitadas' : `${assinaturaCtx.limiteMensagens} mensagens por mês`}
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Suporte prioritário
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Relatórios avançados
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Próximos Passos
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Fazer Upgrade</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Aproveite mais recursos e pague menos comissões
                </p>
                <button
                  onClick={handleUpgrade}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Planos
                </button>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Publicar Vagas</h4>
                <p className="text-sm text-green-700 mb-3">
                  Use suas vagas disponíveis para encontrar talentos
                </p>
                <button className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Publicar Vaga
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancelar Assinatura</h3>
              <p className="text-gray-700 mb-6">Tem certeza que deseja cancelar sua assinatura?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={cancelLoading}
                >
                  Não
                </button>
                <button
                  onClick={confirmCancelar}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  disabled={cancelLoading}
                >
                  Sim, Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Feedback de cancelamento */}
      {cancelSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                ✅ Assinatura cancelada!
              </p>
              <p className="text-xs mt-1 opacity-90">
                Sua assinatura foi cancelada com sucesso.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setCancelSuccess(false)}
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
    </div>
  )
} 