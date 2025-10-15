import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AreaMensagens({ 
  conversaAtiva, 
  mensagens, 
  loadingMensagens, 
  enviando, 
  onEnviarMensagem,
  onSilenciar,
  onBloquear,
  onApagar 
}) {
  const { user } = useAuth();
  const [novaMensagem, setNovaMensagem] = useState('');
  const mensagensRef = useRef(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleEnviar = () => {
    if (!novaMensagem.trim() || enviando) return;
    
    const destinatarioId = getDestinatarioId();
    if (destinatarioId) {
      onEnviarMensagem(novaMensagem, destinatarioId);
      setNovaMensagem('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const getDestinatarioId = () => {
    // Esta função precisa ser implementada baseada na estrutura dos dados
    // Por enquanto, retorna null - será implementada quando tivermos acesso aos dados reais
    return null;
  };

  const formatarData = (data) => {
    if (!data) return '';
    
    const agora = new Date();
    const dataMsg = new Date(data);
    const diffEmMinutos = Math.floor((agora - dataMsg) / (1000 * 60));
    
    if (diffEmMinutos < 1) return 'Agora';
    if (diffEmMinutos < 60) return `Há ${diffEmMinutos}min`;
    if (diffEmMinutos < 1440) return `Há ${Math.floor(diffEmMinutos / 60)}h`;
    
    return dataMsg.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMinhaMensagem = (mensagem) => {
    return mensagem.remetente === (user.tipo === 'empresa' ? 'empresa' : 'candidato');
  };

  if (!conversaAtiva) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg">Selecione uma conversa para começar</p>
          <p className="text-sm">Escolha uma conversa da lista ao lado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header da conversa */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src={getConversaAtiva()?.foto || 'https://via.placeholder.com/40'}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {getConversaAtiva()?.nome || 'Usuário'}
              </h3>
              <p className="text-xs text-gray-500">
                {getConversaAtiva()?.vaga || 'Conversa geral'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onSilenciar(conversaAtiva)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Silenciar"
            >
              🔇
            </button>
            <button
              onClick={() => onBloquear(conversaAtiva)}
              className="text-gray-400 hover:text-red-600 p-1"
              title="Bloquear"
            >
              🚫
            </button>
            <button
              onClick={() => onApagar(conversaAtiva)}
              className="text-gray-400 hover:text-red-600 p-1"
              title="Apagar"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div 
        ref={mensagensRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {loadingMensagens ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Carregando mensagens...</p>
            </div>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem para começar</p>
            </div>
          </div>
        ) : (
          mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`flex ${isMinhaMensagem(mensagem) ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-xs lg:max-w-md">
                <div
                  className={`px-4 py-2 rounded-lg shadow-sm ${
                    isMinhaMensagem(mensagem)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {mensagem.texto}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${isMinhaMensagem(mensagem) ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatarData(mensagem.data)}
                    </span>
                    {isMinhaMensagem(mensagem) && (
                      <span className="text-xs text-blue-100 ml-2">
                        {mensagem.lida ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Indicadores de status */}
                {mensagem.arquivo && (
                  <div className="mt-1 text-xs text-gray-500">
                    📎 Anexo enviado
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input de mensagem */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="1"
              disabled={enviando}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              title="Anexar arquivo"
            >
              📎
            </button>
          </div>
          <button
            onClick={handleEnviar}
            disabled={!novaMensagem.trim() || enviando}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {enviando ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Função auxiliar para obter dados da conversa ativa
function getConversaAtiva() {
  // Esta função será implementada quando tivermos acesso aos dados da conversa
  return null;
} 