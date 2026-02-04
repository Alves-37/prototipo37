import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io as ioClient } from 'socket.io-client'

import Modal from '../components/Modal'
import NovaConversa from '../components/NovaConversa'
import { useMonetizacao } from '../context/MonetizacaoContext';
import { mensagemService } from '../services/mensagemService';
import api from '../services/api'

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
  const { user, isAuthenticated, loading } = useAuth()
  const [mensagemSelecionada, setMensagemSelecionada] = useState(null)

  const [onlineByUserId, setOnlineByUserId] = useState(() => ({}))
  const [lastSeenByUserId, setLastSeenByUserId] = useState(() => ({}))

  const [novaMensagem, setNovaMensagem] = useState('')
  const [busca, setBusca] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showNotificacoes, setShowNotificacoes] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [digitando, setDigitando] = useState(false)
  const [digitandoPorConversa, setDigitandoPorConversa] = useState(() => ({}))
  const [arquivosAnexados, setArquivosAnexados] = useState([])

  const [notificacoes, setNotificacoes] = useState([])
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const listaConversasRef = useRef(null) // ADICIONADO
  const openedChatFromListRef = useRef(false)
  const lastConversaRefreshAtRef = useRef(0)
  const refreshConversationsRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimeoutByConversaRef = useRef({})
  const typingSendStopTimeoutRef = useRef(null)
  const lastTypingSentAtRef = useRef(0)
  const menuButtonRef = useRef(null)
  const menuDropdownRef = useRef(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showNovaConversa, setShowNovaConversa] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  const [toast, setToast] = useState(null);
  const { podeEnviarMensagemCandidato, podeEnviarMensagem, assinatura } = useMonetizacao();

  const [mensagens, setMensagens] = useState([]) // lista de conversas do backend
  const [loadingConversas, setLoadingConversas] = useState(true)

  // Carregar conversas do backend
  const carregarConversas = useCallback(async () => {
    if (!isAuthenticated) {
      setMensagens([])
      setLoadingConversas(false)
      return []
    }

    setLoadingConversas(true);
    try {
      const conversas = await mensagemService.listarConversas();
      const next = Array.isArray(conversas) ? conversas : []
      setMensagens(next.map(c => {
        const id = c?.destinatarioId
        const online = id !== undefined && id !== null
          ? !!onlineByUserId[String(id)]
          : !!c?.online
        return { ...c, online }
      }));
      saveMensagensToStorage(conversas);
      return conversas;
    } catch (e) {
      console.error('Erro ao carregar conversas', e);
      return [];
    } finally {
      setLoadingConversas(false);
    }
  }, [isAuthenticated, onlineByUserId]);

  useEffect(() => {
    refreshConversationsRef.current = carregarConversas
  }, [carregarConversas])

  const mensagemSelecionadaRef = useRef(null)
  useEffect(() => {
    mensagemSelecionadaRef.current = mensagemSelecionada
  }, [mensagemSelecionada])

  useEffect(() => {
    if (!isAuthenticated) return

    const base = String(api?.defaults?.baseURL || '').replace(/\/?api\/?$/i, '')
    if (!base) return

    let token = null
    try {
      token = localStorage.getItem('token')
    } catch {}

    const socket = ioClient(base, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      auth: token ? { token } : undefined,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    })

    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err?.message || err)
    })

    socket.on('presence:state', (evt) => {
      try {
        const ids = Array.isArray(evt?.onlineUserIds) ? evt.onlineUserIds : []
        const onlineSet = new Set(ids.map(id => String(id)))

        setOnlineByUserId(prev => {
          const next = { ...(prev || {}) }
          ids.forEach(id => { next[String(id)] = true })
          return next
        })

        setMensagens(prev => {
          const list = Array.isArray(prev) ? prev : []
          return list.map(c => {
            const id = c?.destinatarioId
            if (id === undefined || id === null) return c
            return { ...c, online: onlineSet.has(String(id)) }
          })
        })

        setMensagemSelecionada(prev => {
          if (!prev) return prev
          const id = prev?.destinatarioId
          if (id === undefined || id === null) return prev
          return { ...prev, online: onlineSet.has(String(id)) }
        })
      } catch {}
    })

    socket.on('presence:update', (evt) => {
      try {
        const id = evt?.userId
        if (id === undefined || id === null) return
        const online = !!evt?.online

        setOnlineByUserId(prev => ({ ...(prev || {}), [String(id)]: online }))

        if (!online) {
          const lastSeenAt = evt?.lastSeenAt
          if (lastSeenAt !== undefined && lastSeenAt !== null) {
            setLastSeenByUserId(prev => ({ ...(prev || {}), [String(id)]: Number(lastSeenAt) }))
          }
        }

        setMensagens(prev => {
          const list = Array.isArray(prev) ? prev : []
          return list.map(c => {
            if (String(c?.destinatarioId) !== String(id)) return c
            return { ...c, online }
          })
        })

        setMensagemSelecionada(prev => {
          if (!prev) return prev
          if (String(prev?.destinatarioId) !== String(id)) return prev
          return { ...prev, online }
        })
      } catch {}
    })

    socket.on('typing', (evt) => {
      try {
        const isProd = (() => {
          try {
            const mode = import.meta?.env?.MODE
            if (mode !== undefined && mode !== null) {
              return String(mode).toLowerCase() === 'production'
            }
          } catch {}
          try {
            if (typeof process !== 'undefined' && process?.env) {
              return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
            }
          } catch {}
          return false
        })()

        if (!isProd) {
          // eslint-disable-next-line no-console
          console.debug('[socket typing]', evt)
        }

        const conversaId = evt?.conversaId
        if (!conversaId) return
        if (String(evt?.fromUserId) === String(user?.id)) return
        const typingNow = !!evt?.typing

        setDigitandoPorConversa(prev => ({ ...(prev || {}), [String(conversaId)]: typingNow }))

        const key = String(conversaId)
        const prevTimeout = typingTimeoutByConversaRef.current?.[key]
        if (prevTimeout) {
          clearTimeout(prevTimeout)
        }
        if (typingNow) {
          typingTimeoutByConversaRef.current = {
            ...(typingTimeoutByConversaRef.current || {}),
            [key]: setTimeout(() => {
              setDigitandoPorConversa(prev => ({ ...(prev || {}), [key]: false }))
            }, 1800),
          }
        }
      } catch {}
    })

    socket.on('message:status', (evt) => {
      try {
        const isProd = (() => {
          try {
            const mode = import.meta?.env?.MODE
            if (mode !== undefined && mode !== null) {
              return String(mode).toLowerCase() === 'production'
            }
          } catch {}
          try {
            if (typeof process !== 'undefined' && process?.env) {
              return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
            }
          } catch {}
          return false
        })()

        if (!isProd) {
          // eslint-disable-next-line no-console
          console.debug('[socket message:status]', evt)
        }

        const conversaId = evt?.conversaId
        if (!conversaId) return
        const messageId = evt?.messageId
        const messageIds = Array.isArray(evt?.messageIds) ? evt.messageIds : null

        const applyToMessage = (m) => {
          if (!m) return m
          const next = { ...m }
          if (evt?.entregue !== undefined) next.entregue = !!evt.entregue
          if (evt?.lida !== undefined) next.lida = !!evt.lida
          return next
        }

        setHistoricoMensagens(prev => {
          const current = Array.isArray(prev?.[conversaId]) ? prev[conversaId] : []
          if (!current.length) return prev

          const shouldUpdateById = (m) => {
            if (messageId !== undefined && messageId !== null) return String(m?.id) === String(messageId)
            if (messageIds) return messageIds.some(id => String(id) === String(m?.id))
            // Quando não vem IDs, aplica apenas às mensagens enviadas por mim
            return String(m?.remetenteId) === String(user?.id)
          }

          const updated = current.map(m => (shouldUpdateById(m) ? applyToMessage(m) : m))
          return { ...(prev || {}), [conversaId]: updated }
        })
      } catch {}
    })

    socket.on('message:new', (evt) => {
      try {
        const conversaId = evt?.conversaId
        const mensagem = evt?.mensagem
        if (!conversaId || !mensagem) return

        const msgId = mensagem?.id

        setHistoricoMensagens(prev => {
          const current = Array.isArray(prev?.[conversaId]) ? prev[conversaId] : []
          if (msgId !== undefined && msgId !== null) {
            if (current.some(m => String(m?.id) === String(msgId))) return prev
          }
          return { ...(prev || {}), [conversaId]: [...current, mensagem] }
        })

        setMensagens(prev => {
          const list = Array.isArray(prev) ? prev : []
          const idx = list.findIndex(c => String(c?.id) === String(conversaId))
          if (idx === -1) {
            try {
              const now = Date.now()
              if (now - Number(lastConversaRefreshAtRef.current || 0) > 1200) {
                lastConversaRefreshAtRef.current = now
                if (typeof refreshConversationsRef.current === 'function') {
                  refreshConversationsRef.current()
                }
              }
            } catch {}
            return list
          }

          const updated = { ...list[idx] }
          updated.ultimaMensagem = mensagem?.texto || updated.ultimaMensagem
          updated.ultimaAtividade = 'Agora'
          updated.data = new Date().toISOString()

          if (String(mensagem?.remetenteId) !== String(user?.id)) {
            updated.lida = false
            updated.mensagensNaoLidas = (Number(updated.mensagensNaoLidas) || 0) + 1
          }

          const next = [...list]
          next.splice(idx, 1)
          return [updated, ...next]
        })

        setTimeout(() => {
          try {
            const sel = mensagemSelecionadaRef.current
            if (sel && String(sel?.id) === String(conversaId)) {
              if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
            }
          } catch {}
        }, 30)
      } catch {}
    })

    return () => {
      try {
        Object.values(typingTimeoutByConversaRef.current || {}).forEach(t => {
          try { clearTimeout(t) } catch {}
        })
        typingTimeoutByConversaRef.current = {}
      } catch {}

      try { socket.disconnect() } catch {}
      socketRef.current = null
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (!isAuthenticated) return
    carregarConversas();
  }, [carregarConversas, isAuthenticated]);

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
        const prevMsgs = Array.isArray(prev?.[mensagemSelecionada.id]) ? prev[mensagemSelecionada.id] : [];
        const msgId = msgEnviada?.id
        if (msgId !== undefined && msgId !== null) {
          if (prevMsgs.some(m => String(m?.id) === String(msgId))) return prev
        }
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

      try {
        const s = socketRef.current
        if (s && mensagemSelecionada?.destinatarioId) {
          s.emit('typing', { toUserId: mensagemSelecionada.destinatarioId, conversaId: mensagemSelecionada.id, typing: false })
        }
      } catch {}

      setTimeout(() => {
        inputRef.current?.focus();
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    } catch (e) {
      console.error('Erro ao enviar mensagem', e);
      setToast({ type: 'warning', message: 'Não foi possível enviar a mensagem.' });
    }
  }, [novaMensagem, mensagemSelecionada])

  useEffect(() => {
    try {
      if (!mensagemSelecionada?.destinatarioId) return
      const s = socketRef.current
      if (!s) return
      const texto = String(novaMensagem || '')

      const isTypingNow = !!texto.trim()

      if (!isTypingNow) {
        if (typingSendStopTimeoutRef.current) {
          clearTimeout(typingSendStopTimeoutRef.current)
          typingSendStopTimeoutRef.current = null
        }
        if (digitando) setDigitando(false)
        s.emit('typing', { toUserId: mensagemSelecionada.destinatarioId, conversaId: mensagemSelecionada.id, typing: false })
        return
      }

      if (!digitando) setDigitando(true)

      // Envia "typing: true" enquanto a pessoa digita (throttle)
      const now = Date.now()
      if (now - Number(lastTypingSentAtRef.current || 0) > 650) {
        lastTypingSentAtRef.current = now
        s.emit('typing', { toUserId: mensagemSelecionada.destinatarioId, conversaId: mensagemSelecionada.id, typing: true })
      }

      // Se parar de digitar por um tempo, envia "typing: false" (debounce)
      if (typingSendStopTimeoutRef.current) {
        clearTimeout(typingSendStopTimeoutRef.current)
      }
      typingSendStopTimeoutRef.current = setTimeout(() => {
        try {
          const sock = socketRef.current
          if (!sock) return
          sock.emit('typing', { toUserId: mensagemSelecionada.destinatarioId, conversaId: mensagemSelecionada.id, typing: false })
          setDigitando(false)
        } catch {}
      }, 900)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novaMensagem, mensagemSelecionada?.id])

  const marcarComoLida = async (conversaId) => {
    try {
      await mensagemService.marcarComoLidas(conversaId);
      setMensagens(prev => prev.map(msg => msg.id === conversaId ? { ...msg, lida: true, mensagensNaoLidas: 0 } : msg));
    } catch (e) {
      console.error('Erro ao marcar como lidas', e);
    }
  }

  const abrirConversa = useCallback(async (conversa) => {
    if (!conversa) return

    const params = new URLSearchParams(location.search)
    const currentChat = params.get('chat')
    if (isMobile && currentChat !== String(conversa.id)) {
      openedChatFromListRef.current = true
      navigate({ pathname: location.pathname, search: `?chat=${conversa.id}` })
    }

    setMensagemSelecionada(conversa)
    try {
      const msgs = await mensagemService.obterMensagens(conversa.id)
      setHistoricoMensagens(prev => ({ ...prev, [conversa.id]: msgs }))
      await marcarComoLida(conversa.id)

    } catch (e) {
      console.error('Erro ao carregar mensagens da conversa', e)
    }
  }, [isMobile, location.pathname, location.search, marcarComoLida, navigate])

  useEffect(() => {
    if (!isMobile) return

    const params = new URLSearchParams(location.search)
    const chatId = params.get('chat')

    if (!chatId) {
      if (mensagemSelecionada) setMensagemSelecionada(null)
      return
    }

    if (!mensagemSelecionada && Array.isArray(mensagens) && mensagens.length > 0) {
      const conversa = mensagens.find(m => String(m.id) === String(chatId))
      if (conversa) {
        openedChatFromListRef.current = false
        abrirConversa(conversa)
      }
    }
  }, [abrirConversa, isMobile, location.search, mensagemSelecionada, mensagens])

  function ChatBaloes() {
    if (!mensagemSelecionada) return null
    const msgs = historicoMensagens[mensagemSelecionada.id] || []

    return (
      <div className="p-4" onClick={() => inputRef.current && inputRef.current.focus()}>
        {msgs.length === 0 && (
          <div className="text-center text-gray-400 py-4">Nenhuma mensagem ainda</div>
        )}
        {msgs.map((msg, idx) => {
          const isMine = msg?.remetenteId === user?.id
          const status = isMine
            ? (msg?.lida ? 'lida' : (msg?.entregue ? 'entregue' : 'enviada'))
            : null
          const statusColor = status === 'lida' ? 'text-green-400' : 'text-gray-300'
          return (
            <div key={`${msg?.id ?? 'tmp'}-${msg?.createdAt ?? msg?.data ?? idx}`} className={`mb-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-4 py-2 rounded-2xl text-[15px] leading-snug ${
                  isMine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-200 text-gray-900 rounded-bl-md'
                }`}
              >
                {msg?.texto || ''}
                {msg?.data && (
                  <div className={`mt-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                    <div className={`flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span>{msg.data}</span>
                      {isMine && (
                        <span className={`${statusColor} text-[12px] leading-none`}>
                          {status === 'enviada' ? '✓' : '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {!!digitandoPorConversa[String(mensagemSelecionada.id)] && (
          <div className="mt-1 text-xs text-gray-500">A escrever…</div>
        )}
      </div>
    )
  }

  const anexarArquivo = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.zip'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files || [])
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

  function ChatInput() {
    if (!mensagemSelecionada) return null
    return (
      <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 z-50' : 'sticky bottom-0 z-20'} border-t bg-white px-3 py-2`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={anexarArquivo}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            title="Anexar"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                enviarMensagem()
              }
            }}
            placeholder="Mensagem..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-100 border border-transparent text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Digite uma mensagem"
          />

          <button
            type="button"
            onClick={() => enviarMensagem()}
            className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition ${novaMensagem.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
            disabled={!novaMensagem.trim()}
            title="Enviar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  function ChatHeader() {
    if (!mensagemSelecionada) return null

    const perfilId =
      mensagemSelecionada?.destinatarioId ||
      mensagemSelecionada?.usuarioId ||
      mensagemSelecionada?.candidatoId ||
      mensagemSelecionada?.empresaId

    const formatLastSeen = (ms) => {
      try {
        const val = Number(ms)
        if (!val || Number.isNaN(val)) return null
        const diff = Math.max(0, Date.now() - val)
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Agora'
        if (mins < 60) return `${mins} min`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs} h`
        const days = Math.floor(hrs / 24)
        return `${days} d`
      } catch {
        return null
      }
    }

    const lastSeenText = (() => {
      const id = mensagemSelecionada?.destinatarioId
      if (id === undefined || id === null) return null
      return formatLastSeen(lastSeenByUserId[String(id)])
    })()

    return (
      <div
        className={`flex items-center justify-between px-2 py-2 border-b bg-white ${
          isMobile ? 'sticky top-0 z-50' : 'sticky top-0 z-20'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <button
              type="button"
              onClick={() => {
                setMensagemSelecionada(null)
                const canGoBack = typeof window !== 'undefined' && window.history?.state?.idx > 0
                if (openedChatFromListRef.current && canGoBack) {
                  openedChatFromListRef.current = false
                  navigate(-1)
                  return
                }

                openedChatFromListRef.current = false
                navigate({ pathname: location.pathname, search: '' })
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              title="Voltar"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="relative">
            <img
              src={mensagemSelecionada.foto}
              alt={mensagemSelecionada.candidato}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                mensagemSelecionada.online ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="font-extrabold text-gray-900 truncate text-[15px]">{mensagemSelecionada.candidato}</div>
            <div className="text-[12px] text-gray-500 truncate">
              {mensagemSelecionada.online
                ? 'Ativo agora'
                : (lastSeenText ? `Ativo há ${lastSeenText}` : 'Offline')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            className={`p-2 rounded-full hover:bg-gray-100 transition ${perfilId ? '' : 'opacity-40 cursor-not-allowed'}`}
            title="Ver perfil"
            disabled={!perfilId}
            onClick={() => {
              if (!perfilId) return
              if (mensagemSelecionada?.tipo === 'empresa') {
                navigate(`/perfil-empresa/${perfilId}`)
              } else {
                navigate(`/perfil/${perfilId}`)
              }
            }}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8h.01" />
            </svg>
          </button>

          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title="Mais opções"
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            ref={menuButtonRef}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div
              className="absolute right-0 w-48 bg-white border rounded-xl shadow-lg z-50 animate-fade-in"
              style={isMobile ? { marginTop: 56 } : { marginTop: 8 }}
              ref={menuDropdownRef}
            >
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  if (!perfilId) {
                    alert('Perfil não encontrado!')
                    return
                  }
                  if (mensagemSelecionada?.tipo === 'empresa') {
                    navigate(`/perfil-empresa/${perfilId}`)
                  } else {
                    navigate(`/perfil/${perfilId}`)
                  }
                  setShowMenu(false)
                }}
              >
                Ver perfil
              </button>

              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  silenciarConversa(mensagemSelecionada.id)
                  setShowMenu(false)
                }}
              >
                {mensagemSelecionada?.silenciada ? 'Desativar silêncio' : 'Silenciar conversa'}
              </button>

              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  apagarConversa(mensagemSelecionada.id)
                  setShowMenu(false)
                }}
              >
                Apagar conversa
              </button>

              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                onClick={() => {
                  bloquearUsuario(mensagemSelecionada.id)
                  setShowMenu(false)
                }}
              >
                {mensagemSelecionada?.bloqueada ? 'Desbloquear usuário' : 'Bloquear usuário'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e) {
      const target = e.target
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) return
      if (menuDropdownRef.current && menuDropdownRef.current.contains(target)) return
      setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  // Renderização condicional
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">A carregar...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
          <div className="text-xl font-extrabold text-gray-900">Mensagens</div>
          <div className="mt-2 text-gray-600">Faça login para ver e enviar mensagens.</div>
          <button
            onClick={() => navigate('/login', { state: { from: '/mensagens' } })}
            className="mt-5 w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Fazer login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-100 h-screen ${isMobile && mensagemSelecionada ? 'overflow-visible' : 'overflow-hidden'}`}>

      {/* Toast visual */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm px-6 py-3 rounded-lg shadow-lg text-white text-base font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'}`}
          style={{ fontSize: '1rem', maxWidth: '90vw', minWidth: '200px' }}
        >
          {toast.message}
        </div>
      )}
      {/* Header fixo principal (somente lista no mobile) */}
      {(!isMobile || !mensagemSelecionada) && (
        <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 ${isMobile ? 'py-2' : 'py-4'} shadow-sm`}>
          <span className="text-xl font-extrabold text-gray-900 mx-auto">Messenger</span>
          {!isMobile && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setShowNovaConversa(true)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                title="Nova conversa"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </header>
      )}

      {/* Layout responsivo: split view no desktop, troca no mobile */}
      <div
        className="max-w-7xl mx-auto flex bg-transparent"
        style={{ height: isMobile ? (mensagemSelecionada ? '100vh' : 'calc(100vh - 64px)') : 'calc(100vh - 80px)' }}
      >
        {/* Lista de conversas */}
        {(!isMobile || !mensagemSelecionada) && (
          <div
            ref={listaConversasRef}
            className={`w-full md:w-1/4 lg:w-1/3 xl:w-1/4 border-r bg-white ${isMobile ? 'overflow-y-auto pt-16' : 'rounded-l-xl pt-4 overflow-y-auto'}`}
            style={{
              ...(isMobile ? {} : { height: '100%' }),
              maxHeight: isMobile ? (mensagemSelecionada ? '100vh' : 'calc(100vh - 64px)') : '100%',
              ...(isMobile ? { paddingTop: 0, marginTop: 0 } : {})
            }}
          >
            {isMobile && (
              <div className="sticky top-0 z-10 bg-white px-4 pt-2 pb-3 border-b border-gray-100">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Pesquisar"
                    className="w-full bg-gray-100 rounded-full pl-12 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {isMobile && mensagensFiltradas.length > 0 && (
              <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-600 mb-2">Pessoas</div>
                <div className="flex flex-nowrap gap-3 overflow-x-auto">
                  {mensagensFiltradas.slice(0, 20).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => abrirConversa(m)}
                      className="shrink-0 flex flex-col items-center w-16"
                      title={m.candidato}
                    >
                      <div className="relative">
                        <img
                          src={m.foto}
                          alt={m.candidato}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                        />
                        <span
                          className={`absolute bottom-1 right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                            m?.online ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-gray-700 truncate w-full text-center">{m.candidato}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagensFiltradas.length === 0 && !loadingConversas && (
              <div className="text-center text-gray-400 py-8">Nenhuma conversa encontrada</div>
            )}
            <ul
              className={isMobile ? "divide-y divide-gray-100" : "space-y-2 lg:space-y-3"}
              style={isMobile ? { paddingTop: 0, marginTop: 0 } : {}}
            >
              {mensagensFiltradas.map((msg, idx) => (
                <li
                  key={msg.id}
                  className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                    isMobile
                      ? `bg-white hover:bg-gray-50 ${!msg.lida ? 'bg-blue-50/30' : ''}`
                      : `bg-white rounded-xl shadow hover:shadow-lg border border-transparent hover:border-blue-200 ${
                          mensagemSelecionada?.id === msg.id ? 'ring-2 ring-blue-400' : ''
                        }`
                  }`}
                  style={isMobile && idx === 0 ? { marginTop: 0, paddingTop: '12px' } : {}}
                  onClick={() => abrirConversa(msg)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 min-w-[48px] min-h-[48px] lg:min-w-[56px] lg:min-h-[56px]">
                    <img
                      src={msg.foto}
                      alt={msg.candidato}
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-blue-100 block"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                    {/* Status online */}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 border-2 border-white rounded-full ${
                        msg.online ? 'bg-green-400' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`truncate lg:text-base ${msg.lida ? 'font-semibold text-gray-900' : 'font-extrabold text-gray-900'}`}>{msg.candidato}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`truncate text-sm lg:text-base ${msg.lida ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>{msg.ultimaMensagem}</span>
                    </div>

                    {msg.silenciada && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">Silenciada</span>
                    )}
                  </div>
                  {/* Horário */}
                  <div className="flex flex-col items-end min-w-[56px] lg:min-w-[64px]">
                    <span className="text-xs lg:text-sm text-gray-400">{msg.ultimaAtividade}</span>
                    {msg.mensagensNaoLidas > 0 && (
                      <span className="ml-auto min-w-[22px] h-[22px] px-2 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {msg.mensagensNaoLidas > 99 ? '99+' : msg.mensagensNaoLidas}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Área do chat */}
        {((!isMobile && mensagemSelecionada) || (isMobile && mensagemSelecionada)) ? (
          <div className={`flex-1 flex flex-col bg-gray-100 rounded-r-xl shadow-lg ${isMobile ? 'w-full h-[100dvh]' : 'h-full'}`} style={{minWidth:0}}>
            {/* Header do chat melhorado */}
            {ChatHeader()}
            {/* Balões de mensagem melhorados */}
            <div className={`flex-1 ${isMobile ? 'overflow-y-auto pb-28' : 'overflow-y-auto'}`} ref={chatRef}>
              {ChatBaloes()}
            </div>
            {/* Campo de digitação melhorado */}
            {ChatInput()}
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

      {isMobile && !mensagemSelecionada && (
        <button
          type="button"
          onClick={() => setShowNovaConversa(true)}
          className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition"
          title="Nova mensagem"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Modal Nova Conversa */}
      <NovaConversa
        isOpen={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        onConversaCriada={async (conversaCriada) => {
          setToast({ type: 'success', message: 'Conversa criada com sucesso.' })
          const conversasAtualizadas = await carregarConversas()
          if (!conversaCriada) return

          const conversaId = conversaCriada?.id || conversaCriada?.conversaId
          const conversaDaLista = Array.isArray(conversasAtualizadas)
            ? conversasAtualizadas.find(c => String(c.id) === String(conversaId))
            : null

          await abrirConversa(conversaDaLista || conversaCriada)
        }}
      />
    </div>
  )
}