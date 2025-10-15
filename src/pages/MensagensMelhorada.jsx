import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import NovaConversa from '../components/NovaConversa'
import { useMonetizacao } from '../context/MonetizacaoContext';
import { mensagemService } from '../services/mensagemService';

// Funções utilitárias para persistência das conversas
const STORAGE_KEY_MSGS = 'mensagens_chat';
function saveMensagensToStorage(mensagens) {
  localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(mensagens));
}
function loadMensagensFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY_MSGS);
  return data ? JSON.parse(data) : null;
}

// Funções utilitárias para persistência do histórico de mensagens
const STORAGE_KEY_HIST = 'historico_mensagens_chat';
function saveHistoricoToStorage(historico) {
  localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(historico));
}
function loadHistoricoFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY_HIST);
  return data ? JSON.parse(data) : null;
}

export default function MensagensMelhorada() {
  const { user } = useAuth()
  const [mensagemSelecionada, setMensagemSelecionada] = useState(null)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [busca, setBusca] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showNotificacoes, setShowNotificacoes] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [digitando, setDigitando] = useState(false)
  const [arquivosAnexados, setArquivosAnexados] = useState([])
  const [notificacoes, setNotificacoes] = useState([])
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const listaConversasRef = useRef(null) // ADICIONADO
  const [showMenu, setShowMenu] = useState(false)
  const [showNovaConversa, setShowNovaConversa] = useState(false)
  const navigate = useNavigate()
  const [toast, setToast] = useState(null);
  const { podeEnviarMensagemCandidato, podeEnviarMensagem, assinatura } = useMonetizacao();

  const [mensagens, setMensagens] = useState([]) // lista de conversas do backend
  const [loadingConversas, setLoadingConversas] = useState(true)

  // Carregar conversas do backend
  const carregarConversas = useCallback(async () => {
    setLoadingConversas(true);
    try {
      const conversas = await mensagemService.listarConversas();
      setMensagens(conversas);
      saveMensagensToStorage(conversas);
    } catch (e) {
      console.error('Erro ao carregar conversas', e);
    } finally {
      setLoadingConversas(false);
    }
  }, []);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  const [historicoMensagens, setHistoricoMensagens] = useState({});
  // Persistir histórico no localStorage sempre que mudar
  useEffect(() => {
    saveHistoricoToStorage(historicoMensagens);
  }, [historicoMensagens]);

  // Emojis populares
  const emojis = ['😊', '👍', '👋', '🎉', '💼', '📝', '✅', '❌', '🤝', '💡', '🚀', '⭐', '💪', '🎯', '📞', '📧']

  // Templates de mensagem
  const templates = [
    {
      titulo: 'Saudação',
      texto: 'Olá! Como posso ajudá-lo hoje?'
    },
    {
      titulo: 'Agradecimento',
      texto: 'Obrigado pelo seu interesse!'
    },
    {
      titulo: 'Agendamento',
      texto: 'Gostaria de agendar uma entrevista?'
    },
    {
      titulo: 'Informações',
      texto: 'Posso fornecer mais informações sobre a vaga.'
    }
  ]

  // Filtrar mensagens conforme tipo de usuário logado
  const mensagensFiltradas = mensagens.filter(msg => {
    // Filtrar por tipo de usuário
    let tipoValido = true
    if (user?.tipo === 'empresa') {
      tipoValido = msg.tipo === 'candidato' || (msg.tipo === 'empresa' && msg.empresa !== user.nome)
    } else if (user?.tipo === 'candidato') {
      tipoValido = msg.tipo === 'empresa' || msg.tipo === 'chamado'
    }
    
    // Filtrar por busca
    const matchBusca = busca === '' || 
                      msg.candidato.toLowerCase().includes(busca.toLowerCase()) ||
                      msg.vaga.toLowerCase().includes(busca.toLowerCase()) ||
                      msg.email.toLowerCase().includes(busca.toLowerCase())
    
    return tipoValido && matchBusca
  })

  // Garantir que a lista de conversas sempre comece no topo ao montar ou ao filtrar
  useEffect(() => {
    if (listaConversasRef.current) {
      listaConversasRef.current.scrollTop = 0;
    }
  }, [mensagensFiltradas.length]);


  const enviarMensagem = useCallback(async () => {
    if (!novaMensagem.trim() || !mensagemSelecionada) return;
    try {
      const payload = {
        destinatarioId: mensagemSelecionada.destinatarioId,
        texto: novaMensagem.trim(),
        tipo: 'texto',
        vagaId: mensagemSelecionada.vagaId || null,
      };
      const msgEnviada = await mensagemService.enviarMensagem(payload);
      // Append no histórico local
      setHistoricoMensagens(prev => {
        const prevMsgs = prev[mensagemSelecionada.id] || [];
        return {
          ...prev,
          [mensagemSelecionada.id]: [...prevMsgs, msgEnviada]
        };
      });
      // Atualizar resumo da conversa
      setMensagens(prev => prev.map(m => m.id === mensagemSelecionada.id ? {
        ...m,
        ultimaMensagem: msgEnviada.texto,
        lida: false,
        ultimaAtividade: 'Agora',
        data: new Date().toISOString(),
      } : m));
      setNovaMensagem('');
      setDigitando(false);
      setTimeout(() => {
        inputRef.current?.focus();
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    } catch (e) {
      console.error('Erro ao enviar mensagem', e);
      setToast({ type: 'warning', message: 'Não foi possível enviar a mensagem.' });
    }
  }, [novaMensagem, mensagemSelecionada])

  const marcarComoLida = async (conversaId) => {
    try {
      await mensagemService.marcarComoLidas(conversaId);
      setMensagens(prev => prev.map(msg => msg.id === conversaId ? { ...msg, lida: true, mensagensNaoLidas: 0 } : msg));
    } catch (e) {
      console.error('Erro ao marcar como lidas', e);
    }
  }

  const selecionarTemplate = (texto) => {
    setNovaMensagem(texto)
  }

  const adicionarEmoji = (emoji) => {
    setNovaMensagem(prev => prev + emoji)
    setShowEmojis(false)
    inputRef.current?.focus()
  }

  const anexarArquivo = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.jpg,.png,.zip'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files)
      files.forEach(file => {
        const arquivo = {
          id: Date.now() + Math.random(),
          nome: file.name,
          tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          tipo: file.name.split('.').pop(),
          arquivo: file
        }
        setArquivosAnexados(prev => [...prev, arquivo])
      })
    }
    input.click()
  }, [])

  const removerArquivo = (id) => {
    setArquivosAnexados(prev => prev.filter(arq => arq.id !== id))
  }

  const simularDigitacao = () => {
    if (mensagemSelecionada) {
      setDigitando(true)
      setTimeout(() => setDigitando(false), 3000)
    }
  }


  useEffect(() => {
    if (mensagemSelecionada) {
      marcarComoLida(mensagemSelecionada.id)
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }, [mensagemSelecionada])

  // Foco no input ao enviar mensagem
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [novaMensagem])

  // Simular notificações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const mensagensNaoLidas = mensagens.filter(m => !m.lida && !m.silenciada)
      if (mensagensNaoLidas.length > 0) {
        const novaNotificacao = {
          id: Date.now(),
          titulo: 'Nova mensagem',
          mensagem: `${mensagensNaoLidas[0].candidato} enviou uma mensagem`,
          tempo: 'Agora'
        }
        setNotificacoes(prev => [novaNotificacao, ...prev.slice(0, 4)])
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [mensagens])

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'finalizado': return 'bg-gray-100 text-gray-800'
      case 'contratado': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'ativo': return 'Ativo'
      case 'finalizado': return 'Finalizado'
      case 'contratado': return 'Contratado'
      default: return 'Desconhecido'
    }
  }

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getIconeArquivo = (tipo) => {
    switch (tipo) {
      case 'pdf': return '📄'
      case 'doc':
      case 'docx': return '📝'
      case 'jpg':
      case 'png': return '🖼️'
      case 'zip': return '📦'
      default: return '📎'
    }
  }

  // Responsividade: detectar se é mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      // No desktop, ao entrar, desce a página
      window.scrollTo(0, document.body.scrollHeight);
    } else {
      // No mobile, sobe para o topo
    window.scrollTo(0, 0);
    }
  }, [isMobile]);

  // Função para silenciar conversa
  const silenciarConversa = (id) => {
    setMensagens(prevMensagens => {
      const silenciadaAgora = !prevMensagens.find(m => m.id === id)?.silenciada;
      const novo = prevMensagens.map(msg =>
        msg.id === id ? { ...msg, silenciada: silenciadaAgora } : msg
      );
      saveMensagensToStorage(novo);
      setToast({ type: 'info', message: silenciadaAgora ? 'Conversa silenciada.' : 'Conversa reativada.' });
      // Atualizar mensagemSelecionada se for a mesma
      if (mensagemSelecionada && mensagemSelecionada.id === id) {
        setMensagemSelecionada(novo.find(m => m.id === id));
      }
      return novo;
    });
  }

  // Função para apagar conversa
  const apagarConversa = (id) => {
    setMensagens(prevMensagens => {
      const novo = prevMensagens.filter(msg => msg.id !== id);
      saveMensagensToStorage(novo);
      return novo;
    });
    setHistoricoMensagens(prev => {
      const novo = { ...prev }
      delete novo[id]
      return novo
    })
    setMensagemSelecionada(null)
    setToast({ type: 'success', message: 'Conversa apagada.' });
  }

  // Função para bloquear usuário
  const bloquearUsuario = (id) => {
    setMensagens(prevMensagens => {
      const bloqueadaAgora = !prevMensagens.find(m => m.id === id)?.bloqueada;
      const novo = prevMensagens.map(msg =>
        msg.id === id ? { ...msg, bloqueada: bloqueadaAgora } : msg
      );
      saveMensagensToStorage(novo);
      setToast({ type: 'warning', message: bloqueadaAgora ? 'Usuário bloqueado.' : 'Usuário desbloqueado.' });
      // Atualizar mensagemSelecionada se for a mesma
      if (mensagemSelecionada && mensagemSelecionada.id === id) {
        setMensagemSelecionada(novo.find(m => m.id === id));
      }
      return novo;
    });
    if (mensagemSelecionada && mensagemSelecionada.id === id) {
      setMensagemSelecionada(null)
    }
  }

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Função para renderizar o header do chat
  function ChatHeader() {
    if (!mensagemSelecionada) return null
    const mobile = isMobile;
    if (loadingConversas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">A carregar mensagens...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b bg-white sticky top-0 z-10 shadow-sm">
        {/* Botão voltar no mobile */}
        {isMobile && (
          <button onClick={() => setMensagemSelecionada(null)} className="mr-2 p-2 rounded-full hover:bg-blue-50 transition">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {/* Avatar e nome */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img src={mensagemSelecionada.foto} alt={mensagemSelecionada.candidato} className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-blue-100" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 truncate text-base lg:text-lg">{mensagemSelecionada.candidato}</div>
            <div className="text-xs lg:text-sm text-gray-500 truncate">{mensagemSelecionada.vaga}</div>
            <div className="text-xs lg:text-sm text-green-600 font-medium">
              {mensagemSelecionada.online ? 'Online' : `Última atividade: ${mensagemSelecionada.ultimaAtividade}`}
            </div>
          </div>
        </div>
        {/* Ícones de ação */}
        <div className="flex items-center gap-2 ml-2 relative">
          <button
            className="p-2 rounded-full hover:bg-blue-50 transition"
            title="Mais opções"
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
              <circle cx="5" cy="12" r="1.5"/>
            </svg>
          </button>
          {showMenu && (
            <div className={`absolute right-0 w-48 bg-white border rounded-lg shadow-lg z-50 animate-fade-in`} style={mobile ? {marginTop: 72} : {marginTop: 8}}>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => {
                if (!mensagemSelecionada?.id) {
                  alert('Perfil não encontrado!');
                  return;
                }
                if (mensagemSelecionada?.tipo === 'empresa') {
                  navigate(`/perfil-empresa/${mensagemSelecionada.id}`);
                } else {
                  navigate(`/perfil/${mensagemSelecionada.id}`);
                }
                setShowMenu(false);
              }}>Ver perfil</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => {
                silenciarConversa(mensagemSelecionada.id);
                setShowMenu(false);
              }}>
                {mensagemSelecionada?.silenciada ? 'Desativar silêncio' : 'Silenciar conversa'}
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => {
                apagarConversa(mensagemSelecionada.id);
                setShowMenu(false);
              }}>
                Apagar conversa
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => {
                bloquearUsuario(mensagemSelecionada.id);
                setShowMenu(false);
              }}>
                {mensagemSelecionada?.bloqueada ? 'Desbloquear usuário' : 'Bloquear usuário'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Função para renderizar balões de mensagem
  function ChatBaloes() {
    if (!mensagemSelecionada) return null
    if (mensagemSelecionada.bloqueada) {
      return <div className="text-center text-red-500 py-8">Usuário bloqueado. Você não pode enviar ou receber mensagens nesta conversa.</div>
    }
    const msgs = historicoMensagens[mensagemSelecionada.id] || []
    return (
      <div className="p-4 lg:p-6" ref={chatRef} onClick={() => inputRef.current && inputRef.current.focus()}>
        {msgs.length === 0 && (
          <div className="text-center text-gray-400 py-4">Nenhuma mensagem ainda</div>
        )}
        {msgs.map((msg, idx) => (
          <div key={msg.id || idx} className={`mb-2 flex ${msg.remetenteId === user.id ? 'justify-end' : 'justify-start'}`} >
            <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-2xl shadow text-sm lg:text-base relative
              ${msg.remetenteId === user.id ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}
            >
              {msg.tipo === 'texto' ? msg.texto : (
                <a href="#" className="underline flex items-center gap-2">
                  <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828M7 7h.01"/><path d="M15 9h.01"/></svg>
                  {msg.texto}
                </a>
              )}
              {/* Status de envio */}
              <div className="flex items-center gap-1 mt-1 text-xs">
                <span className="text-gray-300">{msg.data}</span>
                {msg.lida && <span className="text-green-400">✓✓</span>}
                {!msg.lida && <span className="text-gray-400">✓</span>}
                {msg.status === 'erro' && <span className="text-red-500">!</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Função para renderizar o campo de digitação
  function ChatInput() {
    if (!mensagemSelecionada) return null
    if (mensagemSelecionada.bloqueada) return null
    // Estado para modal de upgrade
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    // Função correta de bloqueio
    const isEmpresa = user?.tipo === 'empresa';
    const podeEnviar = isEmpresa ? podeEnviarMensagem() : podeEnviarMensagemCandidato();
    
    const handleInputChange = useCallback((e) => {
      setNovaMensagem(e.target.value)
    }, [])
    
    const handleKeyDown = useCallback((e) => {
      if (e.key === 'Enter' && novaMensagem.trim()) {
        enviarMensagem()
      }
    }, [novaMensagem, enviarMensagem])
    
    const handleFocus = useCallback(() => {
      setDigitando(true)
    }, [])
    
    const handleBlur = useCallback(() => {
      setDigitando(false)
    }, [])
    
    const handleEmojiClick = useCallback(() => {
      setShowEmojis(!showEmojis)
    }, [showEmojis])
    
    return (
      <div className={`${isMobile ? 'fixed bottom-4 left-0 right-0 z-50' : 'sticky bottom-0 z-20'} border-t bg-white flex items-center gap-2 lg:gap-3 shadow-md px-2 sm:px-4 py-2`} style={{boxShadow: '0 2px 12px #0001', marginBottom: isMobile ? 0 : 20}}>
        {/* Remover emoji no mobile */}
        {!isMobile && (
        <button onClick={handleEmojiClick} aria-label="Abrir emojis" className="p-2 rounded-full hover:bg-blue-50 transition text-xl flex-shrink-0" disabled={!podeEnviar}>
          {/* SVG emoji */}
          <svg width="24" height="24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
        </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={novaMensagem}
          onChange={handleInputChange}
          onFocus={e => {
            if (!podeEnviar) {
              setShowUpgradeModal(true);
              e.target.blur();
              return;
            }
            handleFocus();
          }}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (!podeEnviar) {
              setShowUpgradeModal(true);
              e.preventDefault();
              return;
            }
            handleKeyDown(e);
          }}
          placeholder={!podeEnviar ? 'Limite de mensagens do plano atingido' : 'Digite uma mensagem...'}
          className="flex-1 px-4 py-2 rounded-full border text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          style={{
            border: novaMensagem.trim() ? '1px solid #3b82f6' : '1px solid #d1d5db',
            boxShadow: novaMensagem.trim() ? '0 0 0 2px #3b82f6' : 'none'
          }}
          aria-label="Digite uma mensagem"
          disabled={!podeEnviar}
        />
        <button onClick={anexarArquivo} aria-label="Anexar arquivo" className="p-2 rounded-full hover:bg-blue-50 transition text-xl flex-shrink-0" disabled={!podeEnviar}>
          {/* SVG clipe */}
          <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 114.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l9.2-9.19"/></svg>
        </button>
        <button
          onClick={() => {
            if (!podeEnviar) {
              setShowUpgradeModal(true);
              return;
            }
            enviarMensagem();
          }}
          aria-label="Enviar mensagem"
          className={`p-2 sm:p-3 lg:p-4 rounded-full font-semibold transition-all duration-200 shadow-md flex-shrink-0 ${
            novaMensagem.trim() && podeEnviar ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 shadow-none'
          }`}
          style={{marginRight: isMobile ? 8 : 24}}
          disabled={!novaMensagem.trim() || !podeEnviar}
          title={podeEnviar ? (novaMensagem.trim() ? 'Enviar mensagem' : 'Digite uma mensagem para enviar') : 'Limite de mensagens do plano atingido'}
        >
          {/* SVG avião */}
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
        {/* Modal de upgrade de plano */}
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Limite do Plano atingido"
          size="sm"
        >
          <div className="text-center space-y-4">
            <p className="text-gray-700">Você atingiu o limite de mensagens do seu plano <b>{assinatura?.nome}</b>.</p>
            <p className="text-gray-600">Faça upgrade para o plano <b>Básico</b> ou <b>Premium</b> para enviar mais mensagens!</p>
            <button
              onClick={() => { setShowUpgradeModal(false); navigate('/monetizacao'); }}
              className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Ver Planos e Fazer Upgrade
        </button>
          </div>
        </Modal>
      </div>
    )
  }

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e) {
      setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  // Renderização condicional
  return (
    <div className="relative bg-gray-50 h-screen overflow-hidden">
      {/* Toast visual */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm px-6 py-3 rounded-lg shadow-lg text-white text-base font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'}`}
          style={{ fontSize: '1rem', maxWidth: '90vw', minWidth: '200px' }}
        >
          {toast.message}
        </div>
      )}
      {/* Header fixo principal */}
      <header className={`fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 ${isMobile ? 'py-0' : 'py-4'} shadow-sm`}>
        {/* Botão voltar no mobile quando chat não está aberto */}
        {isMobile && mensagemSelecionada && (
          <button onClick={() => setMensagemSelecionada(null)} className="mr-2 p-2 rounded-full hover:bg-blue-50 transition">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <span className="text-xl font-bold text-blue-700 mx-auto">Mensagens</span>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={() => setShowNovaConversa(true)}
            className="p-2 rounded-full hover:bg-green-50 transition"
            title="Nova conversa"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-blue-50 transition" title="Buscar">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </header>
      {!isMobile && <div className="h-20" />}

      {/* Layout responsivo: split view no desktop, troca no mobile */}
      <div className="max-w-7xl mx-auto flex bg-transparent" style={{ height: isMobile ? 'calc(100vh - 64px)' : 'calc(100vh - 80px)' }}>
        {/* Lista de conversas */}
        {(!isMobile || !mensagemSelecionada) && (
          <div
            ref={listaConversasRef}
            className={`w-full md:w-1/4 lg:w-1/3 xl:w-1/4 border-r bg-gray-50 px-2 sm:px-0 ${isMobile ? 'overflow-y-auto pb-16' : 'rounded-l-xl pt-4 overflow-y-auto'}`}
            style={{
              ...(isMobile ? {} : { height: '100%' }),
              maxHeight: isMobile ? 'calc(100vh - 64px)' : '100%',
              ...(isMobile ? { paddingTop: 0, marginTop: 0 } : {})
            }}
          >
            {mensagensFiltradas.length === 0 && !loadingConversas && (
              <div className="text-center text-gray-400 py-8">Nenhuma conversa encontrada</div>
            )}
            <ul className="space-y-2 lg:space-y-3" style={isMobile ? {paddingTop:0, marginTop:0} : {}}>
              {mensagensFiltradas.map((msg, idx) => (
                <li
                  key={msg.id}
                  className={`group bg-white rounded-xl shadow flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4 cursor-pointer transition hover:shadow-lg border border-transparent hover:border-blue-200 ${mensagemSelecionada?.id === msg.id ? 'ring-2 ring-blue-400' : ''}`}
                  style={isMobile && idx === 0 ? {marginTop: '4px', paddingTop: '8px'} : {}} // garantir espaço no topo
                  onClick={async () => { 
                    setMensagemSelecionada(msg);
                    try {
                      const msgs = await mensagemService.obterMensagens(msg.id);
                      setHistoricoMensagens(prev => ({ ...prev, [msg.id]: msgs }));
                      await marcarComoLida(msg.id);
                    } catch (e) {
                      console.error('Erro ao carregar mensagens da conversa', e);
                    }
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 min-w-[48px] min-h-[48px] lg:min-w-[56px] lg:min-h-[56px]">
                    <img
                      src={msg.foto}
                      alt={msg.candidato}
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-blue-100 block"
                      style={{objectFit: 'cover', display: 'block'}}
                    />
                    {/* Status online */}
                    {msg.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-green-400 border-2 border-white rounded-full" />
                    )}
                  </div>
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 truncate lg:text-base">{msg.candidato}</span>
                      {/* Badge prioridade */}
                      {msg.prioridade === 'alta' && <span className="ml-1 px-2 py-0.5 rounded-full text-xs lg:text-sm bg-red-100 text-red-700 font-bold">Alta</span>}
                      {msg.prioridade === 'media' && <span className="ml-1 px-2 py-0.5 rounded-full text-xs lg:text-sm bg-yellow-100 text-yellow-700 font-bold">Média</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`truncate text-sm lg:text-base ${msg.lida ? 'text-gray-500' : 'text-blue-700 font-medium'}`}>{msg.ultimaMensagem}</span>
                      {/* Badge não lida */}
                      {!msg.lida && <span className="ml-1 w-2 h-2 lg:w-3 lg:h-3 bg-blue-600 rounded-full inline-block" />}
                    </div>
                    {msg.silenciada && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">Silenciada</span>
                    )}
                  </div>
                  {/* Horário */}
                  <div className="flex flex-col items-end min-w-[56px] lg:min-w-[64px]">
                    <span className="text-xs lg:text-sm text-gray-400">{msg.ultimaAtividade}</span>
                    {/* Ícone de erro se necessário */}
                    {msg.status === 'erro' && (
                      <span title="Erro ao enviar" className="text-red-500 text-lg lg:text-xl">!</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Área do chat */}
        {((!isMobile && mensagemSelecionada) || (isMobile && mensagemSelecionada)) ? (
          <div className={`flex-1 flex flex-col bg-white rounded-r-xl shadow-lg ${isMobile ? 'fixed inset-0 z-40 pt-16' : 'h-full'}`} style={{minWidth:0}}>
            {/* Header do chat melhorado */}
            <ChatHeader />
            {/* Balões de mensagem melhorados */}
            <div className={`flex-1 ${isMobile ? 'overflow-y-auto pb-28' : 'overflow-y-auto'}`} ref={chatRef}>
              <ChatBaloes />
            </div>
            {/* Campo de digitação melhorado */}
            <ChatInput />
          </div>
        ) : (
          // Desktop: área do chat vazia
          !isMobile && (
            <div className="flex-1 flex items-center justify-center bg-white rounded-r-xl">
              <div className="text-gray-400 text-lg lg:text-xl">Selecione uma conversa para começar</div>
            </div>
          )
        )}
      </div>

      {/* Botão flutuante para nova conversa */}
      {!mensagemSelecionada && (
        <button
          className="fixed right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2 transition"
          style={{bottom: isMobile ? '5rem' : '2rem'}}
          title="Nova conversa"
          onClick={() => setShowNovaConversa(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8m-4-4v8" />
          </svg>
          <span className="hidden sm:inline">Nova conversa</span>
        </button>
      )}

      {/* Modal Nova Conversa */}
      <NovaConversa
        isOpen={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        onConversaCriada={async () => {
          setToast({ type: 'success', message: 'Conversa criada com sucesso.' });
          await carregarConversas();
        }}
      />
    </div>
  )
}