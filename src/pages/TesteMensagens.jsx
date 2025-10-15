import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function TesteMensagens() {
  const { user } = useAuth()
  const [conversas, setConversas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testeEnvio, setTesteEnvio] = useState('')
  const [destinatarioId, setDestinatarioId] = useState('')

  // Carregar conversas
  const carregarConversas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/mensagens/conversas')
      setConversas(response.data)
      console.log('Conversas carregadas:', response.data)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      setError(error.response?.data?.error || 'Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  // Enviar mensagem de teste
  const enviarMensagemTeste = async () => {
    if (!testeEnvio.trim() || !destinatarioId) {
      setError('Preencha a mensagem e o ID do destinatário')
      return
    }

    try {
      setError(null)
      const response = await api.post('/mensagens/enviar', {
        destinatarioId: parseInt(destinatarioId),
        texto: testeEnvio
      })
      console.log('Mensagem enviada:', response.data)
      setTesteEnvio('')
      setDestinatarioId('')
      // Recarregar conversas
      await carregarConversas()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setError(error.response?.data?.error || 'Erro ao enviar mensagem')
    }
  }

  useEffect(() => {
    carregarConversas()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Carregando conversas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Teste do Sistema de Mensagens</h1>
        
        {/* Informações do usuário */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Usuário Logado</h2>
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Nome:</strong> {user?.nome}</p>
          <p><strong>Tipo:</strong> {user?.tipo}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>

        {/* Teste de envio */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📤 Teste de Envio de Mensagem</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Destinatário
              </label>
              <input
                type="number"
                value={destinatarioId}
                onChange={(e) => setDestinatarioId(e.target.value)}
                placeholder="Ex: 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <input
                type="text"
                value={testeEnvio}
                onChange={(e) => setTesteEnvio(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={enviarMensagemTeste}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Enviar Mensagem
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">💬 Conversas ({conversas.length})</h2>
            <button
              onClick={carregarConversas}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
            >
              Atualizar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800"><strong>Erro:</strong> {error}</p>
            </div>
          )}

          {conversas.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm mt-2">Envie uma mensagem para criar uma conversa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversas.map((conversa) => (
                <div key={conversa.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <img
                      src={conversa.foto}
                      alt={conversa.candidato}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{conversa.candidato}</h3>
                      <p className="text-sm text-gray-600">{conversa.vaga}</p>
                      <p className="text-xs text-gray-500">{conversa.ultimaMensagem}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{conversa.ultimaAtividade}</div>
                      {conversa.mensagensNaoLidas > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {conversa.mensagensNaoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Detalhes da conversa */}
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p><strong>ID da Conversa:</strong> {conversa.id}</p>
                    <p><strong>Tipo:</strong> {conversa.tipo}</p>
                    <p><strong>Status:</strong> {conversa.status}</p>
                    {conversa.silenciada && <p className="text-orange-600">🔇 Silenciada</p>}
                    {conversa.bloqueada && <p className="text-red-600">🚫 Bloqueada</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold mb-2">📋 Logs do Console</h3>
          <p className="text-sm">Abra o console do navegador (F12) para ver logs detalhados</p>
        </div>
      </div>
    </div>
  )
} 