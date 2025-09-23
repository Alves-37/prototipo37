import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function EmpresaConversas() {
  // Mock: conversas
  const [conversas] = useState([
    { id: 'c1', assunto: 'Candidatura: Desenvolvedor Frontend', remetente: 'João Silva', ultimaMensagem: 'Enviei meu CV atualizado.', data: '2025-09-20 14:25', canal: 'Interno', status: 'aberta', atribuidaPara: 'Ana (RH)' },
    { id: 'c2', assunto: 'Pergunta sobre vaga de Marketing', remetente: 'Maria Santos', ultimaMensagem: 'Qual o formato do contrato?', data: '2025-09-21 09:12', canal: 'Externo/Zendesk', status: 'pendente', atribuidaPara: 'Carlos (MKT)' },
    { id: 'c3', assunto: 'Proposta Comercial', remetente: 'Agência XYZ', ultimaMensagem: 'Podemos agendar uma call?', data: '2025-09-21 16:43', canal: 'Externo/Email', status: 'aberta', atribuidaPara: '—' },
  ])

  const [selecionada, setSelecionada] = useState(conversas[0])
  const [mensagem, setMensagem] = useState('')

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Conversas da Empresa</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/empresa/config/mensagens" className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Configurar Mensageria</Link>
          <Link to="/empresa/equipe" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Equipe</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lista */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden md:col-span-1">
          <div className="p-3 border-b flex gap-2">
            <input className="flex-1 p-2 border rounded" placeholder="Buscar por assunto/remetente" />
            <select className="p-2 border rounded text-sm">
              <option>Todos</option>
              <option>Abertas</option>
              <option>Pendentes</option>
              <option>Fechadas</option>
            </select>
          </div>
          <ul className="divide-y">
            {conversas.map(c => (
              <li key={c.id} className={`p-3 cursor-pointer hover:bg-gray-50 ${selecionada?.id === c.id ? 'bg-blue-50' : ''}`} onClick={() => setSelecionada(c)}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{c.assunto}</h3>
                  <span className="text-xs text-gray-500">{new Date(c.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">{c.remetente} • {c.canal}</div>
                <div className="text-sm text-gray-700 line-clamp-1">{c.ultimaMensagem}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${c.status === 'aberta' ? 'bg-green-100 text-green-700' : c.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                  <span className="text-gray-500">Atribuída: {c.atribuidaPara}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Painel */}
        <div className="bg-white rounded-lg border shadow-sm md:col-span-2 flex flex-col min-h-[60vh]">
          {selecionada ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">{selecionada.assunto}</h2>
                <div className="text-sm text-gray-600">De: {selecionada.remetente} • {selecionada.canal}</div>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-auto">
                {/* Mock de mensagens */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 text-gray-800 p-3 rounded-lg">Olá! Vi a vaga e gostaria de saber mais detalhes.</div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-blue-600 text-white p-3 rounded-lg">Obrigado pelo interesse! Pode compartilhar seu portfólio?</div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 text-gray-800 p-3 rounded-lg">Enviei meu CV atualizado.</div>
                </div>
              </div>
              <div className="p-3 border-t flex items-center gap-2">
                <input value={mensagem} onChange={e => setMensagem(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Escreva uma mensagem..." />
                <button disabled={!mensagem} onClick={() => setMensagem('')} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Enviar</button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-gray-500">Selecione uma conversa</div>
          )}
        </div>
      </div>
    </div>
  )
}
