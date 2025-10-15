import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonetizacao } from '../context/MonetizacaoContext'
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Monetizacao() {
  const { user, login, setUser } = useAuth()
  const { planosCandidato, planos, loading, fazerUpgradeCandidato } = useMonetizacao()
  const { upgradePlano } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('');
  // Novo estado para modal de sucesso detalhado
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: checkout, 2: processando, 3: sucesso
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  // Determinar se é candidato ou empresa
  const isEmpresa = user && user.tipo === 'empresa'
  const planosParaMostrar = isEmpresa 
    ? (planos ? Object.values(planos) : [])
    : (planosCandidato ? Object.values(planosCandidato) : [])

  // Métodos de pagamento disponíveis em Moçambique
  const metodosPagamento = [
    {
      id: 'mpesa',
      nome: 'M-Pesa',
      descricao: 'Pagamento móvel',
      icone: '📱',
      popular: true
    },
    {
      id: 'emola',
      nome: 'E-Mola',
      descricao: 'Pagamento móvel',
      icone: '💳',
      popular: true
    },
    {
      id: 'transferencia',
      nome: 'Transferência Bancária',
      descricao: 'Transferência direta',
      icone: '🏦',
      popular: false
    },
    {
      id: 'cartao',
      nome: 'Cartão de Crédito/Débito',
      descricao: 'Visa, Mastercard',
      icone: '💳',
      popular: false
    }
  ]

  // Mapeamento de cores por plano
  const borderColors = {
    gratuito: 'border-green-500',
    basico: 'border-blue-500',
    premium: 'border-purple-500',
    empresarial: 'border-orange-500',
  }

  function handleEscolherPlano(plano) {
    setSelectedPlan(plano);
    setCheckoutStep(1);
    setShowPaymentModal(true);
  }

  async function handleConfirmarPagamento() {
    setCheckoutStep(2); // processando
    setPaymentLoading(true);
    setTimeout(async () => {
      if (user?.tipo === 'empresa') {
        upgradePlano(selectedPlan);
      } else {
        await fazerUpgradeCandidato(selectedPlan.id);
        // Atualizar user no AuthContext/localStorage
        const hoje = new Date();
        const proximo = new Date();
        proximo.setMonth(proximo.getMonth() + 1);
        const updatedAssinatura = {
          plano: selectedPlan.id,
          nome: selectedPlan.nome,
          preco: selectedPlan.preco,
          destaque: selectedPlan.destaque,
          status: 'ativa',
          dataInicio: hoje.toISOString(),
          proximoPagamento: proximo.toISOString()
        };
        const updatedUser = { ...user, assinatura: updatedAssinatura };
        // Atualiza também no objeto global de usuários
        const users = JSON.parse(localStorage.getItem('nevu_users') || '{}');
        if (users[user.email]) {
          users[user.email].assinatura = updatedAssinatura;
          localStorage.setItem('nevu_users', JSON.stringify(users));
        }
        localStorage.setItem('nevu_current_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      setPaymentLoading(false);
      setPaymentSuccess(true);
      setShowPaymentModal(false);
      setShowSuccessModal(true); // Exibe modal de sucesso detalhado
      setSuccessMessage('Plano alterado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 2500);
      setCheckoutStep(1);
    }, 2200);
  }

  // Remove subsídio de alimentação dos recursos exibidos
  function recursosFiltrados(plano) {
    if (!plano.recursos) return [];
    return plano.recursos.filter(r => !r.toLowerCase().includes('subsídio de alimentação'));
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando planos...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (showSuccessModal) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [showSuccessModal]);


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isEmpresa ? 'Planos e Preços para Empresas' : 'Planos e Benefícios para Candidatos'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isEmpresa
              ? 'Escolha o plano ideal para sua empresa e comece a contratar os melhores talentos de Moçambique'
              : 'Escolha um plano para se destacar, candidatar-se a mais oportunidades e acessar benefícios exclusivos.'}
          </p>
        </div>
        {successMessage && (
          <div className="mb-6 text-center">
            <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded font-semibold shadow">
              {successMessage}
            </span>
          </div>
        )}

        {/* Botão de Filtros Avançados para empresas */}
        {isEmpresa && (
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <Link to="/filtros-avancados" className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition text-sm">Filtros Avançados</Link>
          </div>
        )}

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-12">
          {planosParaMostrar && planosParaMostrar.length > 0 ? (
            planosParaMostrar.map((plano) => (
              <div key={plano.id} className="relative flex flex-col items-center mb-8">
                {/* Badge, se houver */}
              {plano.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow z-10">
                    Mais Popular
                  </span>
                )}
                {/* Card do Plano */}
                <div
                  className={`w-full bg-white border-2 rounded-xl shadow p-6 pt-10 flex flex-col items-center transition-all duration-300 hover:shadow-xl ${borderColors[plano.id] || 'border-gray-200'} min-h-[380px] sm:min-h-[420px]`}
                  style={{ height: '100%' }}
                >
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">{plano.nome}</h3>
                  <div className="text-3xl font-extrabold text-gray-900 mb-1 text-center">
                    {plano.preco === 0 ? 'Grátis' : `${plano.preco.toLocaleString()} MT`}
                  </div>
                  <div className="text-sm text-gray-500 mb-4 text-center">{isEmpresa ? plano.periodo : 'Mensal'}</div>
                  <ul className="text-sm text-gray-700 space-y-2 mb-6 w-full">
                    {isEmpresa
                      ? recursosFiltrados(plano).slice(0, 8).map((recurso, index) => (
                          <li key={index} className="flex items-start text-gray-700">
                            <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                            <span>{recurso}</span>
                      </li>
                    ))
                      : plano.recursos && plano.recursos.slice(0, 8).map((recurso, index) => (
                          <li key={index} className="flex items-start text-gray-700">
                            <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                            <span>{recurso}</span>
                      </li>
                        ))}
                </ul>
                  {user?.assinatura?.plano === plano.id ? (
                    <button
                      className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg cursor-not-allowed"
                      disabled
                    >
                      Plano Ativo
                    </button>
                  ) : (
                <button
                      onClick={() => handleEscolherPlano(plano)}
                      className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition"
                    >
                      Escolher Plano
                </button>
                  )}
                  {plano.id === 'gratuito' && (
                    <p className="text-xs text-gray-500 text-center mt-1">
                      Sem cartão de crédito necessário
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p className="text-lg font-medium">Nenhum plano disponível</p>
                <p className="text-sm">Tente novamente mais tarde.</p>
              </div>
            </div>
          )}
        </div>

        {/* Comparação de Planos - Mobile (cards) */}
        <div className="block md:hidden space-y-4 mb-8">
          {planosParaMostrar.map((plano) => (
            <div key={plano.id} className="bg-white rounded-xl shadow p-4">
              <h4 className="font-bold text-lg mb-2">{plano.nome}</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {isEmpresa ? (
                  <>
                    <li>Vagas por mês: {plano.limiteVagas === -1 ? 'Ilimitadas' : plano.limiteVagas}</li>
                    <li>Mensagens por mês: {plano.limiteMensagens === -1 ? 'Ilimitadas' : plano.limiteMensagens}</li>
                    <li>Destaque nas buscas: {plano.destaque ? 'Sim' : 'Não'}</li>
                    <li>Suporte prioritário: {plano.id !== 'gratuito' ? 'Sim' : 'Não'}</li>
                  </>
                ) : (
                  <>
                    <li>Candidaturas simultâneas: {plano.limiteCandidaturas === -1 ? 'Ilimitadas' : plano.limiteCandidaturas}</li>
                    <li>Mensagens por mês: {plano.limiteMensagens === -1 ? 'Ilimitadas' : plano.limiteMensagens}</li>
                    <li>Perfil em destaque: {plano.destaque ? 'Sim' : 'Não'}</li>
                    <li>Notificações prioritárias: {plano.id !== 'gratuito' ? 'Sim' : 'Não'}</li>
                    <li>Suporte 24/7: {plano.id !== 'gratuito' ? 'Sim' : 'Não'}</li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>
        {/* Comparação de Planos - Desktop (tabela) */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg p-8 mb-12 overflow-x-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Comparação Detalhada
            </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Recursos</th>
                  {planosParaMostrar && planosParaMostrar.map((plano) => (
                    <th key={plano.id} className="text-center py-4 px-6 font-semibold text-gray-900">
                      {plano.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isEmpresa ? (
                  <>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Vagas por mês</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.limiteVagas === -1 ? 'Ilimitadas' : plano.limiteVagas}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Mensagens por mês</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.limiteMensagens === -1 ? 'Ilimitadas' : plano.limiteMensagens}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Destaque nas buscas</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.destaque ? '✅' : '❌'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Suporte prioritário</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.id !== 'gratuito' ? '✅' : '❌'}
                        </td>
                      ))}
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Candidaturas simultâneas</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.limiteCandidaturas === -1 ? 'Ilimitadas' : plano.limiteCandidaturas}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Mensagens por mês</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.limiteMensagens === -1 ? 'Ilimitadas' : plano.limiteMensagens}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Perfil em destaque</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.destaque ? '✅' : '❌'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Notificações prioritárias</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.id !== 'gratuito' ? '✅' : '❌'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-700">Suporte 24/7</td>
                      {planosParaMostrar.map((plano) => (
                        <td key={plano.id} className="text-center py-4 px-6">
                          {plano.id !== 'gratuito' ? '✅' : '❌'}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Métodos de Pagamento
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Aceitamos todos os principais métodos de pagamento de Moçambique
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {metodosPagamento.map((metodo) => (
              <div key={metodo.id} className="flex flex-col items-center justify-between text-center p-3 sm:p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors h-full min-h-[120px] break-words">
                <div className="text-3xl mb-2">{metodo.icone}</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{metodo.nome}</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-1 break-words">{metodo.descricao}</p>
                {metodo.popular && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Popular
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-4 sm:p-6">
              {checkoutStep === 1 && (
                <>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Finalizar Assinatura
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedPlan.nome}</h4>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedPlan.preco === 0 ? 'Grátis' : `${selectedPlan.preco.toLocaleString()} MT`}
                  <span className="text-sm font-normal text-gray-500">/Mensal</span>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Pagamento
                </label>
                <div className="space-y-3">
                  {metodosPagamento.map((metodo) => (
                    <label key={metodo.id} className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={metodo.id}
                        checked={paymentMethod === metodo.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                        disabled={paymentLoading || paymentSuccess}
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{metodo.icone}</span>
                        <div>
                          <div className="font-medium text-gray-900">{metodo.nome}</div>
                          <div className="text-sm text-gray-500">{metodo.descricao}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={paymentLoading}
                >
                  Cancelar
                </button>
                <button
                      onClick={handleConfirmarPagamento}
                  className={`flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${paymentLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={paymentLoading || paymentSuccess}
                >
                      {selectedPlan.preco === 0 ? 'Ativar Grátis' : 'Pagar Agora'}
                </button>
                  </div>
                </>
              )}
              {checkoutStep === 2 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
                  <h3 className="text-xl font-bold text-blue-700 mb-2">Processando pagamento...</h3>
                  <p className="text-gray-600 mb-4">Aguarde enquanto confirmamos sua transação.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso detalhado */}
      {showSuccessModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-screen overflow-y-auto animate__animated animate__fadeInDown">
            <div className="p-6 flex flex-col items-center">
              {/* Animação de sucesso */}
              <div className="mb-4">
                <svg className="w-16 h-16 text-green-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2">
                🎉 Parabéns!
                <span className={`px-3 py-1 rounded-full text-xs font-bold ml-2 ${selectedPlan.id === 'premium' ? 'bg-yellow-400 text-white' : selectedPlan.id === 'basico' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>{selectedPlan.nome}</span>
              </h2>
              <p className="text-gray-700 mb-4 text-center">Seu upgrade foi realizado com sucesso.<br/>Agora você é <b>{selectedPlan.nome}</b>! Aproveite todos os benefícios do seu novo plano.</p>
              <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumo do Plano</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  {selectedPlan.recursos && selectedPlan.recursos.map((r, i) => (
                    <li key={i} className="flex items-start"><span className="text-green-500 mr-2">✓</span>{r}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition mt-2"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal detalhado de benefícios */}
      {showBenefitsModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto animate__animated animate__fadeInDown">
            <div className="p-8 flex flex-col items-center">
              <h2 className="text-3xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                Benefícios do Plano {selectedPlan.nome}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ml-2 ${selectedPlan.id === 'premium' ? 'bg-yellow-400 text-white' : selectedPlan.id === 'basico' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>{selectedPlan.nome}</span>
              </h2>
              <ul className="text-lg text-gray-800 space-y-3 mb-6 w-full max-w-md">
                {selectedPlan.recursos && selectedPlan.recursos.map((r, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-green-500 text-xl">✓</span>{r}</li>
                ))}
              </ul>
              <button
                onClick={() => { setShowBenefitsModal(false); setShowSuccessModal(false); }}
                className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition mt-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 