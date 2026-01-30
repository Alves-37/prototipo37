import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ListaConversas({ 
  conversas, 
  conversaAtiva, 
  onSelecionarConversa, 
  onNovaConversa,
  onSilenciar,
  onBloquear,
  onApagar 
}) {
  const { user } = useAuth();

  const formatarData = (data) => {
    if (!data) return '';
    
    const agora = new Date();
    const dataMsg = new Date(data);
    const diffEmMinutos = Math.floor((agora - dataMsg) / (1000 * 60));
    
    if (diffEmMinutos < 1) return 'Agora';
    if (diffEmMinutos < 60) return `Há ${diffEmMinutos}min`;
    if (diffEmMinutos < 1440) return `Há ${Math.floor(diffEmMinutos / 60)}h`;
    if (diffEmMinutos < 10080) return `Há ${Math.floor(diffEmMinutos / 1440)}d`;
    
    return dataMsg.toLocaleDateString('pt-BR');
  };

  const getNomeConversa = (conversa) => {
    // Determinar quem é o outro usuário na conversa
    const outroUsuario = conversa.usuario1Id === user.id ? conversa.usuario2 : conversa.usuario1;
    return outroUsuario?.nome || 'Usuário desconhecido';
  };

  const getFotoConversa = (conversa) => {
    const outroUsuario = conversa.usuario1Id === user.id ? conversa.usuario2 : conversa.usuario1;
    return outroUsuario?.foto || 'https://via.placeholder.com/40';
  };

  const getTipoConversa = (conversa) => {
    const outroUsuario = conversa.usuario1Id === user.id ? conversa.usuario2 : conversa.usuario1;
    return outroUsuario?.tipo || 'usuario';
  };

  const getStatusConversa = (conversa) => {
    if (conversa.bloqueada) return 'bloqueada';
    if (conversa.silenciada) return 'silenciada';
    return 'ativa';
  };

  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
          <button
            onClick={onNovaConversa}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Nova Conversa
          </button>
        </div>
      </div>
      
      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {conversas.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>Nenhuma conversa encontrada</p>
            <p className="text-sm">Inicie uma nova conversa para começar</p>
          </div>
        ) : (
          conversas.map((conversa) => {
            const status = getStatusConversa(conversa);
            const isAtiva = conversaAtiva === conversa.id;
            
            return (
              <div
                key={conversa.id}
                onClick={() => onSelecionarConversa(conversa.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  isAtiva 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                } ${status === 'bloqueada' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={getFotoConversa(conversa)}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {status === 'bloqueada' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🚫</span>
                      </div>
                    )}
                    {status === 'silenciada' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🔇</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Informações da conversa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getNomeConversa(conversa)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {getTipoConversa(conversa)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs text-gray-400">
                          {formatarData(conversa.ultimaMensagemData)}
                        </span>
                        {conversa.mensagensNaoLidas > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversa.mensagensNaoLidas > 99 ? '99+' : conversa.mensagensNaoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {conversa.ultimaMensagem || 'Nenhuma mensagem'}
                    </p>
                    
                    {conversa.vaga && (
                      <p className="text-xs text-blue-600 truncate">
                        📋 {conversa.vaga}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Ações da conversa (apenas quando ativa) */}
                {isAtiva && (
                  <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSilenciar(conversa.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                      title="Silenciar"
                    >
                      🔇
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBloquear(conversa.id);
                      }}
                      className="text-gray-400 hover:text-red-600 text-xs"
                      title="Bloquear"
                    >
                      🚫
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApagar(conversa.id);
                      }}
                      className="text-gray-400 hover:text-red-600 text-xs"
                      title="Apagar"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 