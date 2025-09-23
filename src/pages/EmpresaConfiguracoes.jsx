import { useState } from 'react'

export default function EmpresaConfiguracoes() {
  const [provider, setProvider] = useState('zendesk')
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl] = useState(window.location.origin + '/api/webhooks/mock')
  const [status, setStatus] = useState('desconectado') // conectado | desconectado | erro

  const testarConexao = async () => {
    // Mock de teste
    setStatus('testando')
    setTimeout(() => {
      setStatus(apiKey ? 'conectado' : 'erro')
    }, 700)
  }

  const salvar = () => {
    // Mock salvar
    alert('Configurações salvas (mock).')
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensageria da Empresa</h1>

      <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provedor</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full p-2 border rounded">
            <option value="zendesk">Zendesk</option>
            <option value="hubspot">HubSpot</option>
            <option value="email">E-mail (IMAP/SMTP)</option>
            <option value="whatsapp">WhatsApp Business (via provedor)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Token</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" className="w-full p-2 border rounded" placeholder="Cole aqui o token do provedor" />
          <p className="text-xs text-gray-500 mt-1">Este valor será criptografado no backend (mock).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (leitura)</label>
          <input value={webhookUrl} readOnly className="w-full p-2 border rounded bg-gray-50" />
          <p className="text-xs text-gray-500 mt-1">Configure seu provedor para enviar eventos para esta URL.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={testarConexao} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Testar Conexão</button>
          <button onClick={salvar} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Salvar</button>
          <span className={`ml-2 text-sm px-2 py-1 rounded ${status === 'conectado' ? 'bg-green-100 text-green-700' : status === 'erro' ? 'bg-red-100 text-red-700' : status === 'testando' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
            {status === 'conectado' ? 'Conectado' : status === 'erro' ? 'Erro' : status === 'testando' ? 'Testando...' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg border shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 mb-2">Canais</h2>
        <p className="text-sm text-gray-600">Configuração de múltiplos canais por provedor (mock em breve).</p>
      </div>
    </div>
  )
}
