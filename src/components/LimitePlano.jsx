import { useState } from 'react'
import { useMonetizacao } from '../context/MonetizacaoContext'
import { Link } from 'react-router-dom'

export default function LimitePlano({ tipo, onClose }) {
  const { assinatura, planos } = useMonetizacao()
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (!assinatura) return null

  const plano = planos[assinatura.plano]
  const limite = tipo === 'vagas' ? plano.limiteVagas : plano.limiteMensagens
  const usado = tipo === 'vagas' ? assinatura.vagasUsadas : assinatura.mensagensUsadas

  const getTitulo = () => {
    if (tipo === 'vagas') {
      return 'Limite de Vagas Atingido'
    }
    return 'Limite de Mensagens Atingido'
  }

  const getDescricao = () => {
    if (tipo === 'vagas') {
      return `Você atingiu o limite de ${limite} vagas do seu plano ${assinatura.nome}. Faça upgrade para publicar mais vagas.`
    }
    return `Você atingiu o limite de ${limite} mensagens do seu plano ${assinatura.nome}. Faça upgrade para enviar mensagens ilimitadas.`
  }

  const getPlanoRecomendado = () => {
    if (tipo === 'vagas') {
      return planos.premium
    }
    return planos.basico
  }

  const planoRecomendado = getPlanoRecomendado()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{getTitulo()}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">{getDescricao()}</p>
            
            {/* Progresso atual */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {tipo === 'vagas' ? 'Vagas utilizadas' : 'Mensagens enviadas'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {usado} / {limite === -1 ? '∞' : limite}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(usado / limite) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Plano recomendado */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2">
                Recomendamos: {planoRecomendado.nome}
              </h4>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {planoRecomendado.preco.toLocaleString()} MT/mês
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                {tipo === 'vagas' ? (
                  <>
                    <li>• Vagas ilimitadas</li>
                    <li>• Mensagens ilimitadas</li>
                    <li>• Comissão reduzida (3%)</li>
                    <li>• Suporte 24/7</li>
                  </>
                ) : (
                  <>
                    <li>• Mensagens ilimitadas</li>
                    <li>• Até 10 vagas ativas</li>
                    <li>• Comissão: 5%</li>
                    <li>• Suporte prioritário</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <Link
              to="/monetizacao"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Ver Todos os Planos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 