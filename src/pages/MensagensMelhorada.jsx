import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io as ioClient } from 'socket.io-client'

import Modal from '../components/Modal'
import NovaConversa from '../components/NovaConversa'
import userfotoPlaceholder from '../assets/userfoto.avif'
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

  const defaultAvatarUrl = userfotoPlaceholder
  const fallbackAvatarUrl = '/nevu.png'

  const resolveAvatarUrl = useCallback((url) => {
    try {
      const val = String(url || '').trim()
      if (!val) return defaultAvatarUrl
      if (val.includes('via.placeholder.com')) return defaultAvatarUrl
      return val
    } catch {
      return defaultAvatarUrl
    }
  }, [defaultAvatarUrl])

  const handleAvatarError = useCallback((e) => {
    try {
      const img = e?.currentTarget
      if (!img) return

      const src = String(img.src || '')
      const defaultSrc = String(defaultAvatarUrl || '')
      const fallbackSrc = String(fallbackAvatarUrl || '')

      if (defaultSrc && src.includes(defaultSrc)) {
        if (fallbackSrc && !src.includes(fallbackSrc)) img.src = fallbackSrc
        return
      }

      if (fallbackSrc && src.includes(fallbackSrc)) return
      if (defaultSrc) img.src = defaultAvatarUrl
      else if (fallbackSrc) img.src = fallbackAvatarUrl
    } catch {}
  }, [defaultAvatarUrl, fallbackAvatarUrl])

  const [onlineByUserId, setOnlineByUserId] = useState(() => ({}))
  const [lastSeenByUserId, setLastSeenByUserId] = useState(() => ({}))

  const [novaMensagem, setNovaMensagem] = useState('')
  const [editandoMensagemId, setEditandoMensagemId] = useState(null)
  const [menuMsgAbertoId, setMenuMsgAbertoId] = useState(null)
  const [menuMsgPosition, setMenuMsgPosition] = useState({ top: 0, left: 0 })
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [busca, setBusca] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [showTemplates, setShowTemplates] = useState(false)
  const [showNotificacoes, setShowNotificacoes] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [digitando, setDigitando] = useState(false)
  const [digitandoPorConversa, setDigitandoPorConversa] = useState(() => ({}))
  const [arquivosAnexados, setArquivosAnexados] = useState([])
  const [gravandoAudio, setGravandoAudio] = useState(false)

  const [notificacoes, setNotificacoes] = useState([])
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioChunksRef = useRef([])

  const isNearBottomRef = useRef(true)

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

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => {
      try { setToast(null) } catch {}
    }, 3000)
    return () => {
      try { clearTimeout(t) } catch {}
    }
  }, [toast])

  const [mensagens, setMensagens] = useState(() => {
    try {
      const stored = loadMensagensFromStorage()
      const list = Array.isArray(stored) ? stored : []
      const onlyWithHistory = list.filter(c => {
        const last = String(c?.ultimaMensagem ?? '').trim()
        const unread = Number(c?.mensagensNaoLidas ?? 0)
        return last.length > 0 || unread > 0
      })
      if (onlyWithHistory.length !== list.length) {
        saveMensagensToStorage(onlyWithHistory)
      }
      return onlyWithHistory
    } catch {
      return []
    }
  }) // lista de conversas do backend
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

      const onlyWithHistory = next.filter(c => {
        const last = String(c?.ultimaMensagem ?? '').trim()
        const unread = Number(c?.mensagensNaoLidas ?? 0)
        return last.length > 0 || unread > 0
      })

      setMensagens(onlyWithHistory.map(c => {
        const id = c?.destinatarioId
        const online = id !== undefined && id !== null
          ? !!onlineByUserId[String(id)]
          : !!c?.online
        return { ...c, online }
      }));
      saveMensagensToStorage(onlyWithHistory);
      return onlyWithHistory;
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

    socket.on('message:update', (evt) => {
      try {
        const conversaId = evt?.conversaId
        const mensagem = evt?.mensagem
        if (!conversaId || !mensagem?.id) return

        setHistoricoMensagens(prev => {
          const current = Array.isArray(prev?.[conversaId]) ? prev[conversaId] : []
          const updated = current.map(m => {
            if (String(m?.id) !== String(mensagem.id)) return m
            return {
              ...m,
              texto: mensagem?.apagadaParaTodos ? 'Mensagem apagada' : (mensagem?.texto ?? m.texto),
              editada: mensagem?.editada !== undefined ? !!mensagem.editada : !!m.editada,
              editadaEm: mensagem?.editadaEm !== undefined ? mensagem.editadaEm : m.editadaEm,
              apagadaParaTodos: mensagem?.apagadaParaTodos !== undefined ? !!mensagem.apagadaParaTodos : !!m.apagadaParaTodos,
              tipo: mensagem?.apagadaParaTodos ? 'sistema' : (m.tipo || 'texto'),
              arquivo: mensagem?.apagadaParaTodos ? null : m.arquivo,
            }
          })
          return { ...(prev || {}), [conversaId]: updated }
        })
      } catch {}
    })

    socket.on('message:delete', (evt) => {
      try {
        const conversaId = evt?.conversaId
        const messageId = evt?.messageId
        const scope = String(evt?.scope || 'all')
        if (!conversaId || !messageId) return

        if (scope === 'all') {
          setHistoricoMensagens(prev => {
            const current = Array.isArray(prev?.[conversaId]) ? prev[conversaId] : []
            const updated = current.map(m => {
              if (String(m?.id) !== String(messageId)) return m
              return {
                ...m,
                apagadaParaTodos: true,
                texto: 'Mensagem apagada',
                tipo: 'sistema',
                arquivo: null,
              }
            })
            return { ...(prev || {}), [conversaId]: updated }
          })
        }
      } catch {}
    })

    socket.on('message:new', (evt) => {
      try {
        const conversaId = evt?.conversaId
        const mensagem = evt?.mensagem
        if (!conversaId || !mensagem) return

        const msgId = mensagem?.id

        setHistoricoMensagens(prev => {
          const prevMsgs = Array.isArray(prev?.[conversaId]) ? prev[conversaId] : [];
          const msgId = mensagem?.id
          if (msgId !== undefined && msgId !== null) {
            if (prevMsgs.some(m => String(m?.id) === String(msgId))) return prev
          }
          return {
            ...prev,
            [conversaId]: [...prevMsgs, mensagem]
          };
        });
        // Atualizar resumo da conversa
        setMensagens(prev => {
          const list = Array.isArray(prev) ? prev : []
          const conversaId = mensagemSelecionada?.id
          const idx = list.findIndex(m => String(m?.id) === String(conversaId))

          // Se a conversa ainda não está na lista (ex.: foi criada e filtrada por estar vazia),
          // insere agora que existe a primeira mensagem.
          if (idx === -1) {
            const inserted = {
              ...(mensagemSelecionada || {}),
              ultimaMensagem: mensagem.texto,
              lida: false,
              mensagensNaoLidas: 0,
              ultimaAtividade: 'Agora',
              data: new Date().toISOString(),
            }
            return [inserted, ...list]
          }

          const current = list[idx]
          const updated = {
            ...current,
            ultimaMensagem: mensagem.texto,
            lida: false,
            ultimaAtividade: 'Agora',
            data: new Date().toISOString(),
          }

          const nextList = [updated, ...list.filter((_, i) => i !== idx)]
          return nextList
        });

        setTimeout(() => {
          try {
            const inListView = isMobile ? !mensagemSelecionadaRef.current : true
            if (inListView && listaConversasRef.current) {
              listaConversasRef.current.scrollTop = 0
            }
          } catch {}
        }, 30)
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

  const STORAGE_KEY_ARCHIVED = 'mensagens_chat_archived_ids'
  const [archivedIds, setArchivedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ARCHIVED)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  })

  const saveArchivedIds = useCallback((ids) => {
    try {
      localStorage.setItem(STORAGE_KEY_ARCHIVED, JSON.stringify(Array.isArray(ids) ? ids : []))
    } catch {}
  }, [])

  const isArchived = useCallback((conversaId) => {
    return (archivedIds || []).some(id => String(id) === String(conversaId))
  }, [archivedIds])

  const arquivarConversa = useCallback((conversaId, nextArchived = true) => {
    setArchivedIds(prev => {
      const list = Array.isArray(prev) ? prev.map(String) : []
      const id = String(conversaId)
      const next = nextArchived
        ? (list.includes(id) ? list : [...list, id])
        : list.filter(x => x !== id)
      saveArchivedIds(next)
      return next
    })
  }, [saveArchivedIds])

  // Filtrar mensagens conforme tipo de usuário logado
  const mensagensFiltradas = mensagens.filter(msg => {

    let tipoValido = true
    if (user?.tipo === 'empresa') {
      tipoValido = msg.tipo === 'candidato' || (msg.tipo === 'empresa' && msg.empresa !== user.nome)
    } else if (user?.tipo === 'candidato') {
      tipoValido = msg.tipo === 'empresa' || msg.tipo === 'chamado'
    }

    const q = String(busca || '').toLowerCase()
    const matchBusca = q === '' ||
      String(msg?.candidato || '').toLowerCase().includes(q) ||
      String(msg?.vaga || '').toLowerCase().includes(q) ||
      String(msg?.email || '').toLowerCase().includes(q)

    const archivedMatch = showArchived ? isArchived(msg?.id) : !isArchived(msg?.id)
    return tipoValido && matchBusca && archivedMatch
  })

  const silenciarConversa = useCallback(async (conversaId) => {
    try {
      await mensagemService.silenciarConversa(conversaId)
      setMensagens(prev => (Array.isArray(prev) ? prev : []).map(c => {
        if (String(c?.id) !== String(conversaId)) return c
        return { ...c, silenciada: !c?.silenciada }
      }))
      if (String(mensagemSelecionadaRef.current?.id) === String(conversaId)) {
        setMensagemSelecionada(prev => (prev ? { ...prev, silenciada: !prev?.silenciada } : prev))
      }
    } catch (e) {
      console.error('Erro ao silenciar conversa', e)
      setToast({ type: 'warning', message: 'Não foi possível silenciar a conversa.' })
    }
  }, [setToast])

  const bloquearUsuario = useCallback(async (conversaId) => {
    try {
      await mensagemService.bloquearUsuario(conversaId)
      setMensagens(prev => (Array.isArray(prev) ? prev : []).map(c => {
        if (String(c?.id) !== String(conversaId)) return c
        return { ...c, bloqueada: !c?.bloqueada }
      }))
      if (String(mensagemSelecionadaRef.current?.id) === String(conversaId)) {
        setMensagemSelecionada(prev => (prev ? { ...prev, bloqueada: !prev?.bloqueada } : prev))
      }
    } catch (e) {
      console.error('Erro ao bloquear usuário', e)
      setToast({ type: 'warning', message: 'Não foi possível bloquear o usuário.' })
    }
  }, [setToast])

  const apagarConversa = useCallback(async (conversaId) => {
    try {
      await mensagemService.apagarConversa(conversaId)

      setMensagens(prev => {
        const list = Array.isArray(prev) ? prev : []
        const next = list.filter(c => String(c?.id) !== String(conversaId))
        saveMensagensToStorage(next)
        return next
      })

      setHistoricoMensagens(prev => {
        const next = { ...(prev || {}) }
        delete next[String(conversaId)]
        return next
      })

      setMensagemSelecionada(prev => {
        if (!prev) return prev
        if (String(prev?.id) !== String(conversaId)) return prev
        return null
      })
    } catch (e) {
      console.error('Erro ao apagar conversa', e)
      setToast({ type: 'warning', message: 'Não foi possível apagar a conversa.' })
    }
  }, [setToast])

  const [menuConversaAbertoId, setMenuConversaAbertoId] = useState(null)
  const [longPressConversaTimer, setLongPressConversaTimer] = useState(null)

  const handleConversaTouchStart = useCallback((msg) => {
    if (!isMobile) return
    if (!msg?.id) return
    const timer = setTimeout(() => {
      setMenuConversaAbertoId(msg.id)
    }, 450)
    setLongPressConversaTimer(timer)
  }, [isMobile])

  const handleConversaTouchEnd = useCallback(() => {
    if (longPressConversaTimer) {
      clearTimeout(longPressConversaTimer)
      setLongPressConversaTimer(null)
    }
  }, [longPressConversaTimer])

  const closeConversaMenu = useCallback(() => {
    setMenuConversaAbertoId(null)
  }, [])

  const marcarComoLida = useCallback(async (conversaId) => {
    try {
      await mensagemService.marcarComoLidas(conversaId)
      setMensagens(prev => (Array.isArray(prev) ? prev : []).map(msg =>
        String(msg?.id) === String(conversaId)
          ? { ...msg, lida: true, mensagensNaoLidas: 0 }
          : msg
      ))
    } catch (e) {
      console.error('Erro ao marcar como lidas', e)
    }
  }, [])

  const abrirConversa = useCallback(async (conversa) => {
    if (!conversa) return

    try {
      const params = new URLSearchParams(location.search)
      const currentChat = params.get('chat')
      if (isMobile && currentChat !== String(conversa.id)) {
        openedChatFromListRef.current = true
        navigate({ pathname: location.pathname, search: `?chat=${conversa.id}` }, { replace: true })
      }
    } catch {}

    setMensagemSelecionada(conversa)
    try {
      const msgs = await mensagemService.obterMensagens(conversa.id)
      setHistoricoMensagens(prev => ({ ...(prev || {}), [conversa.id]: Array.isArray(msgs) ? msgs : [] }))
      await marcarComoLida(conversa.id)
      setTimeout(() => {
        try {
          if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
        } catch {}
      }, 30)
    } catch (e) {
      console.error('Erro ao carregar mensagens da conversa', e)
    }
  }, [isMobile, location.pathname, location.search, marcarComoLida, navigate])

  const handleChatScroll = useCallback(() => {
    try {
      const el = chatRef.current
      if (!el) return
      const threshold = 120
      const distance = (el.scrollHeight - el.scrollTop - el.clientHeight)
      isNearBottomRef.current = distance <= threshold
    } catch {}
  }, [])

  useEffect(() => {
    if (!mensagemSelecionada) return
    const conversaId = mensagemSelecionada.id
    const msgs = historicoMensagens?.[conversaId] || []
    void msgs

    if (!isNearBottomRef.current) return
    const t = setTimeout(() => {
      try {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
      } catch {}
    }, 30)

    return () => {
      try { clearTimeout(t) } catch {}
    }
  }, [historicoMensagens, mensagemSelecionada])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!isMobile) return

    let chatId = null
    try {
      const params = new URLSearchParams(location.search)
      chatId = params.get('chat')
    } catch {}
    if (!chatId) return

    if (mensagemSelecionadaRef.current && String(mensagemSelecionadaRef.current?.id) === String(chatId)) return

    const list = Array.isArray(mensagens) ? mensagens : []
    const conversa = list.find(c => String(c?.id) === String(chatId))
    if (conversa) {
      abrirConversa(conversa)
    }
  }, [abrirConversa, isAuthenticated, isMobile, location.search, mensagens])

  const enviarAnexoArquivo = useCallback(async (file) => {
    if (!file) return

    const conversaAtual = mensagemSelecionadaRef.current
    const conversaId = conversaAtual?.id
    const destinatarioId = conversaAtual?.destinatarioId
    if (!conversaId || !destinatarioId) return

    try {
      const resp = await mensagemService.enviarAnexo({
        destinatarioId,
        vagaId: conversaAtual?.vagaId || null,
        arquivo: file,
      })

      setHistoricoMensagens(prev => {
        const current = Array.isArray(prev?.[conversaId]) ? prev[conversaId] : []
        const msgId = resp?.id
        if (msgId !== undefined && msgId !== null) {
          if (current.some(m => String(m?.id) === String(msgId))) return prev
        }
        return { ...(prev || {}), [conversaId]: [...current, resp] }
      })

      setMensagens(prev => {
        const list = Array.isArray(prev) ? prev : []
        const idx = list.findIndex(m => String(m?.id) === String(conversaId))
        if (idx === -1) return list
        const current = list[idx]
        const updated = {
          ...current,
          ultimaMensagem: resp?.texto || resp?.message || current?.ultimaMensagem,
          lida: false,
          ultimaAtividade: 'Agora',
          data: new Date().toISOString(),
        }
        const next = [updated, ...list.filter((_, i) => i !== idx)]
        saveMensagensToStorage(next)
        return next
      })

      setTimeout(() => {
        try {
          if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
        } catch {}
      }, 30)
    } catch (e) {
      console.error('Erro ao enviar anexo', e)
      setToast({ type: 'warning', message: 'Não foi possível enviar o anexo.' })
    }
  }, [])

  const anexarArquivo = useCallback(() => {
    const conversaAtual = mensagemSelecionadaRef.current
    if (!conversaAtual?.destinatarioId) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip,.mp3,.wav,.ogg,.webm,.m4a'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files || [])
      files.forEach(file => {
        try { enviarAnexoArquivo(file) } catch {}
      })
    }
    input.click()
  }, [enviarAnexoArquivo])

  const iniciarGravacaoAudio = useCallback(async () => {
    if (gravandoAudio) return

    const conversaAtual = mensagemSelecionadaRef.current
    if (!conversaAtual?.destinatarioId) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (evt) => {
        try {
          if (evt?.data && evt.data.size > 0) audioChunksRef.current.push(evt.data)
        } catch {}
      }

      recorder.onstop = async () => {
        try {
          const chunks = audioChunksRef.current || []
          if (!chunks.length) return
          const mime = recorder.mimeType || 'audio/webm'
          const blob = new Blob(chunks, { type: mime })
          const ext = mime.includes('ogg') ? 'ogg' : (mime.includes('mpeg') ? 'mp3' : 'webm')
          const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: mime })
          await enviarAnexoArquivo(file)
        } catch (e) {
          console.error('Erro ao finalizar gravação', e)
        } finally {
          try { mediaStreamRef.current?.getTracks?.().forEach(t => t.stop()) } catch {}
          mediaStreamRef.current = null
          mediaRecorderRef.current = null
          audioChunksRef.current = []
        }
      }

      recorder.start()
      setGravandoAudio(true)
    } catch (e) {
      console.error('Erro ao iniciar gravação', e)
      setToast({ type: 'warning', message: 'Permissão de microfone necessária.' })
    }
  }, [enviarAnexoArquivo, gravandoAudio])

  const pararGravacaoAudio = useCallback(() => {
    try {
      const rec = mediaRecorderRef.current
      if (!rec) return
      if (rec.state !== 'inactive') rec.stop()
    } catch {}
    setGravandoAudio(false)
  }, [])

  function ChatHeader() {
    if (!mensagemSelecionada) return null
    const msgs = historicoMensagens[mensagemSelecionada.id] || []

    const perfilId = mensagemSelecionada?.tipo === 'empresa'
      ? (mensagemSelecionada?.empresaId ?? null)
      : (mensagemSelecionada?.destinatarioId ?? null)

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
                navigate({ pathname: location.pathname, search: '' }, { replace: true })
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
              src={resolveAvatarUrl(mensagemSelecionada.foto)}
              alt={mensagemSelecionada.candidato}
              className="w-10 h-10 rounded-full object-cover"
              onError={handleAvatarError}
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
                onTouchStart={isMine ? (e) => handleMsgTouchStart(msg, e) : undefined}
                onTouchEnd={isMine ? handleMsgTouchEnd : undefined}
                onClick={isMine ? (e) => handleMsgClick(msg, e) : undefined}
              >
                {!isMobile && isMine && !msg?.apagadaParaTodos && (
                  <div className="flex justify-end mb-1">
                    <button
                      type="button"
                      className="text-white/80 hover:text-white text-xs px-2"
                      onTouchStart={(e) => handleMsgTouchStart(msg, e)}
                      onTouchEnd={handleMsgTouchEnd}
                      onClick={(e) => handleMsgClick(msg, e)}
                      title="Opções"
                    >
                      ⋮
                    </button>
                  </div>
                )}

                {isMine && String(menuMsgAbertoId) === String(msg.id) && (
                  <div className="mb-2 bg-white/10 rounded-lg p-2 text-xs">
                    <button
                      type="button"
                      className="block w-full text-left py-1 hover:underline"
                      onClick={() => iniciarEdicaoMensagem(msg)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left py-1 hover:underline"
                      onClick={() => apagarMensagem(msg, 'me')}
                    >
                      Apagar para mim
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left py-1 hover:underline"
                      onClick={() => apagarMensagem(msg, 'all')}
                    >
                      Apagar para todos
                    </button>
                  </div>
                )}

                {(() => {
                  const arquivo = msg?.arquivo
                  const url = arquivo?.url
                  const mimetype = String(arquivo?.mimetype || '')

                  if (msg?.tipo === 'imagem' && url) {
                    return (
                      <div className="mt-1">
                        <img src={url} alt="imagem" className="max-w-[240px] rounded-lg" />
                      </div>
                    )
                  }

                  if (url && mimetype.startsWith('audio/')) {
                    return (
                      <div className="mt-1">
                        <audio controls src={url} className="w-[240px]" />
                      </div>
                    )
                  }

                  if (url && arquivo?.originalname) {
                    return (
                      <div className="mt-1">
                        <a href={url} target="_blank" rel="noreferrer" className={isMine ? 'underline text-white' : 'underline text-blue-700'}>
                          {arquivo.originalname}
                        </a>
                      </div>
                    )
                  }

                  return <>{msg?.texto || ''}</>
                })()}

                {msg?.data && (
                  <div className={`mt-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                    <div className={`flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span>{msg.data}</span>
                      {msg?.editada && !msg?.apagadaParaTodos && (
                        <span className={`${isMine ? 'text-blue-100' : 'text-gray-400'} text-[11px]`}>
                          (editada)
                        </span>
                      )}
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

  function ChatInput() {
    if (!mensagemSelecionada) return null
    return (
      <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 z-50' : 'sticky bottom-0 z-20'} border-t bg-white ${isMobile ? 'px-2 py-2' : 'px-3 py-2'}`}>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={anexarArquivo}
            className={isMobile
              ? 'shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition'
              : 'w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition'
            }
            title="Anexar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => (gravandoAudio ? pararGravacaoAudio() : iniciarGravacaoAudio())}
            className={`${isMobile ? 'shrink-0 w-10 h-10 min-w-[40px] min-h-[40px]' : 'w-10 h-10'} rounded-full flex items-center justify-center transition ${gravandoAudio ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            title={gravandoAudio ? 'Parar gravação' : 'Gravar áudio'}
          >
            <span className="text-lg leading-none">{gravandoAudio ? '■' : '🎤'}</span>
          </button>

          <div className="flex-1 min-w-0">
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
              placeholder={editandoMensagemId ? 'Editar mensagem...' : 'Mensagem...'}
              className={`${isMobile ? 'w-full px-3 py-2' : 'w-full px-4 py-2'} rounded-full bg-gray-100 border border-transparent text-[15px] outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Digite uma mensagem"
            />
          </div>

          {editandoMensagemId && (
            <button
              type="button"
              onClick={cancelarEdicaoMensagem}
              className={isMobile
                ? 'shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center'
                : 'px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm'
              }
              title="Cancelar edição"
            >
              {isMobile ? '✕' : 'Cancelar'}
            </button>
          )}

          <button
            type="button"
            onClick={() => enviarMensagem()}
            className={`${isMobile ? 'shrink-0 w-11 h-11 min-w-[44px] min-h-[44px]' : 'w-10 h-10'} rounded-full font-semibold flex items-center justify-center transition ${novaMensagem.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
            disabled={!novaMensagem.trim()}
            title={editandoMensagemId ? 'Salvar' : 'Enviar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {gravandoAudio && (
          <div className="mt-1 text-xs text-red-600 font-semibold">Gravando…</div>
        )}
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
            {!isMobile && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${!showArchived ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setShowArchived(false)}
                  >
                    Conversas
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${showArchived ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setShowArchived(true)}
                  >
                    Arquivadas
                  </button>
                </div>
              </div>
            )}

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

                <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-full p-1">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${!showArchived ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setShowArchived(false)}
                  >
                    Conversas
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${showArchived ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setShowArchived(true)}
                  >
                    Arquivadas
                  </button>
                </div>
              </div>
            )}

            {isMobile && mensagensFiltradas.length > 0 && (
              <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-600 mb-2">Pessoas</div>
                <div
                  className="flex flex-nowrap gap-3 overflow-x-auto touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
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
                          src={resolveAvatarUrl(m?.foto)}
                          alt={m.candidato}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                          onError={handleAvatarError}
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
              <div className="text-center text-gray-400 py-8">
                {showArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa encontrada'}
              </div>
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
                  onTouchStart={isMobile ? () => handleConversaTouchStart(msg) : undefined}
                  onTouchEnd={isMobile ? handleConversaTouchEnd : undefined}
                  onTouchCancel={isMobile ? handleConversaTouchEnd : undefined}
                  onContextMenu={isMobile ? (e) => { try { e.preventDefault(); setMenuConversaAbertoId(msg.id) } catch {} } : undefined}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 min-w-[48px] min-h-[48px] lg:min-w-[56px] lg:min-h-[56px]">
                    <img
                      src={resolveAvatarUrl(msg?.foto)}
                      alt={msg.candidato}
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-blue-100 block"
                      style={{ objectFit: 'cover', display: 'block' }}
                      onError={handleAvatarError}
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
            <div className={`flex-1 ${isMobile ? 'overflow-y-auto pb-28' : 'overflow-y-auto'}`} ref={chatRef} onScroll={handleChatScroll}>
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

      {isMobile && menuConversaAbertoId && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeConversaMenu}
            aria-label="Fechar menu"
          />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl border border-gray-200 p-4">
            {(() => {
              const conversa = (Array.isArray(mensagens) ? mensagens : []).find(c => String(c?.id) === String(menuConversaAbertoId))
              const archived = isArchived(menuConversaAbertoId)
              const silenciada = !!conversa?.silenciada
              return (
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100"
                    onClick={async () => {
                      await silenciarConversa(menuConversaAbertoId)
                      closeConversaMenu()
                    }}
                  >
                    {silenciada ? 'Desativar silêncio' : 'Silenciar conversa'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100"
                    onClick={() => {
                      arquivarConversa(menuConversaAbertoId, !archived)
                      closeConversaMenu()
                    }}
                  >
                    {archived ? 'Desarquivar conversa' : 'Arquivar conversa'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 text-red-600"
                    onClick={async () => {
                      await apagarConversa(menuConversaAbertoId)
                      closeConversaMenu()
                    }}
                  >
                    Apagar conversa
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}