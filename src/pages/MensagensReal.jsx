import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMensagens } from '../hooks/useMensagens';
import LoadingOverlay from '../components/LoadingOverlay';
import ListaConversas from '../components/ListaConversas';
import AreaMensagens from '../components/AreaMensagens';
import NovaConversa from '../components/NovaConversa';

export default function MensagensReal() {
  const { user } = useAuth();
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Carregar conversas ao montar o componente
  useEffect(() => {
    carregarConversas();
  }, []);

  // Carregar mensagens quando conversa ativa mudar
  useEffect(() => {
    if (conversaAtiva) {
      carregarMensagens(conversaAtiva);
    }
  }, [conversaAtiva]);

  const carregarConversas = async () => {
    try {
      setLoading(true);
      const data = await mensagemService.listarConversas();
      setConversas(data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarMensagens = async (conversaId) => {
    try {
      setLoadingMensagens(true);
      const data = await mensagemService.obterMensagens(conversaId);
      setMensagens(data);
      
      // Marcar como lidas
      await mensagemService.marcarComoLidas(conversaId);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoadingMensagens(false);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !conversaAtiva) return;

    try {
      setEnviando(true);
      const dados = {
        destinatarioId: getDestinatarioId(),
        texto: novaMensagem.trim(),
        conversaId: conversaAtiva
      };

      const mensagemEnviada = await mensagemService.enviarMensagem(dados);
      
      // Adicionar mensagem à lista
      setMensagens(prev => [...prev, mensagemEnviada]);
      setNovaMensagem('');
      
      // Recarregar conversas para atualizar última mensagem
      await carregarConversas();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setEnviando(false);
    }
  };

  const getDestinatarioId = () => {
    const conversa = conversas.find(c => c.id === conversaAtiva);
    if (!conversa) return null;
    
    // Determinar quem é o destinatário baseado no usuário logado
    // Isso depende da estrutura dos dados retornados pela API
    return conversa.usuario1Id === user.id ? conversa.usuario2Id : conversa.usuario1Id;
  };

  const buscarUsuarios = async (busca) => {
    try {
      setLoadingUsuarios(true);
      const data = await mensagemService.buscarUsuarios(busca);
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const iniciarConversa = async (destinatarioId) => {
    try {
      await mensagemService.iniciarConversa(destinatarioId);
      setShowNovaConversa(false);
      setBuscaUsuario('');
      setUsuarios([]);
      await carregarConversas();
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
    }
  };

  const silenciarConversa = async (conversaId) => {
    try {
      await mensagemService.silenciarConversa(conversaId);
      await carregarConversas();
    } catch (error) {
      console.error('Erro ao silenciar conversa:', error);
    }
  };

  const bloquearUsuario = async (conversaId) => {
    try {
      await mensagemService.bloquearUsuario(conversaId);
      await carregarConversas();
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
    }
  };

  const apagarConversa = async (conversaId) => {
    if (!window.confirm('Tem certeza que deseja apagar esta conversa?')) return;

    try {
      await mensagemService.apagarConversa(conversaId);
      if (conversaAtiva === conversaId) {
        setConversaAtiva(null);
        setMensagens([]);
      }
      await carregarConversas();
    } catch (error) {
      console.error('Erro ao apagar conversa:', error);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getConversaAtiva = () => {
    return conversas.find(c => c.id === conversaAtiva);
  };

  if (loading) {
    return <LoadingOverlay isVisible={true} title="Carregando mensagens..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="flex h-96">
            {/* Lista de conversas */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
                  <button
                    onClick={() => setShowNovaConversa(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                  >
                    Nova Conversa
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto h-80">
                {conversas.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma conversa encontrada
                  </div>
                ) : (
                  conversas.map((conversa) => (
                    <div
                      key={conversa.id}
                      onClick={() => setConversaAtiva(conversa.id)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        conversaAtiva === conversa.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={conversa.foto || 'https://via.placeholder.com/40'}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversa.candidato || conversa.empresa}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conversa.ultimaMensagem || 'Nenhuma mensagem'}
                          </p>
                        </div>
                        {conversa.mensagensNaoLidas > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {conversa.mensagensNaoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 flex flex-col">
              {conversaAtiva ? (
                <>
                  {/* Header da conversa */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getConversaAtiva()?.foto || 'https://via.placeholder.com/40'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {getConversaAtiva()?.candidato || getConversaAtiva()?.empresa}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {getConversaAtiva()?.vaga || 'Conversa geral'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => silenciarConversa(conversaAtiva)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Silenciar"
                        >
                          🔇
                        </button>
                        <button
                          onClick={() => bloquearUsuario(conversaAtiva)}
                          className="text-gray-400 hover:text-red-600"
                          title="Bloquear"
                        >
                          🚫
                        </button>
                        <button
                          onClick={() => apagarConversa(conversaAtiva)}
                          className="text-gray-400 hover:text-red-600"
                          title="Apagar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMensagens ? (
                      <div className="text-center text-gray-500">Carregando mensagens...</div>
                    ) : mensagens.length === 0 ? (
                      <div className="text-center text-gray-500">Nenhuma mensagem ainda</div>
                    ) : (
                      mensagens.map((mensagem) => (
                        <div
                          key={mensagem.id}
                          className={`flex ${mensagem.remetente === (user.tipo === 'empresa' ? 'empresa' : 'candidato') ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              mensagem.remetente === (user.tipo === 'empresa' ? 'empresa' : 'candidato')
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{mensagem.texto}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {formatarData(mensagem.data)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input de mensagem */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={enviando}
                      />
                      <button
                        onClick={enviarMensagem}
                        disabled={!novaMensagem.trim() || enviando}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {enviando ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Selecione uma conversa para começar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Conversa */}
      <Modal
        isOpen={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        title="Nova Conversa"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar usuário
            </label>
            <input
              type="text"
              value={buscaUsuario}
              onChange={(e) => {
                setBuscaUsuario(e.target.value);
                if (e.target.value.trim()) {
                  buscarUsuarios(e.target.value);
                } else {
                  setUsuarios([]);
                }
              }}
              placeholder="Digite nome ou email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loadingUsuarios && (
            <div className="text-center text-gray-500">Buscando usuários...</div>
          )}

          {usuarios.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  onClick={() => iniciarConversa(usuario.id)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md"
                >
                  <img
                    src={usuario.foto}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{usuario.nome}</p>
                    <p className="text-xs text-gray-500">{usuario.email}</p>
                    <p className="text-xs text-gray-400 capitalize">{usuario.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {buscaUsuario && !loadingUsuarios && usuarios.length === 0 && (
            <div className="text-center text-gray-500">Nenhum usuário encontrado</div>
          )}
        </div>
      </Modal>
    </div>
  );
} 