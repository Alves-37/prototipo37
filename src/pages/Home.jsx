import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { io as ioClient } from 'socket.io-client'
import { mensagemService } from '../services/mensagemService'

export default function Home() {
   const { user, isAuthenticated, loading } = useAuth()
   const navigate = useNavigate()
   const location = useLocation()
  const HOME_FILTERS_KEY = 'home_filters'

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const lastUnreadRefreshAtRef = useRef(0)

  const refreshUnreadMessagesCount = async () => {
    if (!isAuthenticated) {
      setUnreadMessagesCount(0)
      return
    }
    try {
      const conversas = await mensagemService.listarConversas()
      const list = Array.isArray(conversas) ? conversas : []
      const total = list.reduce((acc, c) => acc + (Number(c?.mensagensNaoLidas) || 0), 0)
      setUnreadMessagesCount(total)
    } catch {
      // silencioso: não quebrar Home se mensagens falharem
    }
  }

  const readHomeFilters = () => {
    try {
      const raw = localStorage.getItem(HOME_FILTERS_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  const initialHomeFilters = readHomeFilters()

  const [busca, setBusca] = useState(() => String(initialHomeFilters.busca || ''))
  const [categoria, setCategoria] = useState(() => String(initialHomeFilters.categoria || ''))

  const [provincia, setProvincia] = useState(() => String(initialHomeFilters.provincia || ''))
  const [distrito, setDistrito] = useState(() => String(initialHomeFilters.distrito || ''))

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [postText, setPostText] = useState('')
  const [postImageDataUrl, setPostImageDataUrl] = useState('')
  const [postImageName, setPostImageName] = useState('')
  const postImageInputRef = useRef(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [userPosts, setUserPosts] = useState([])

  const [liked, setLiked] = useState(() => ({}))
  const [saved, setSaved] = useState(() => ({}))

  const [likeFx, setLikeFx] = useState(() => ({}))
  const likeFxTimeoutsRef = useRef({})

  const [openCommentsPostId, setOpenCommentsPostId] = useState(null)
  const [commentsByPostId, setCommentsByPostId] = useState(() => ({}))
  const [commentDraftByPostId, setCommentDraftByPostId] = useState(() => ({}))
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState(() => ({}))

  const [showMobileConnections, setShowMobileConnections] = useState(false)

  const [editingComment, setEditingComment] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(null)

  const beginEditComment = (postId, comment) => {
    if (!comment) return
    setEditingComment({ postId, commentId: comment.id })
    setEditingCommentText(String(comment.texto || ''))
  }

  const cancelEditComment = () => {
    setEditingComment(null)
    setEditingCommentText('')
  }

  const saveEditComment = async (postId, commentId) => {
    if (!isAuthenticated) return
    const text = String(editingCommentText || '').trim()
    if (!text) return

    try {
      const { data } = await api.put(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { texto: text })
      setCommentsByPostId(prev => {
        const next = { ...(prev || {}) }
        const list = Array.isArray(next[String(postId)]) ? next[String(postId)] : []
        next[String(postId)] = list.map(c => (String(c.id) === String(commentId) ? { ...c, texto: data?.texto ?? text, updatedAt: data?.updatedAt ?? c.updatedAt } : c))
        return next
      })
      cancelEditComment()
    } catch (e) {
      console.error('Erro ao editar comentário:', e)
      setFeedError('Erro ao editar comentário')
    }
  }

  const requestDeleteComment = (postId, commentId) => {
    if (!isAuthenticated) return
    setConfirmDeleteComment({ postId, commentId })
  }

  const confirmDeleteCommentNow = async () => {
    if (!isAuthenticated) return
    if (!confirmDeleteComment?.postId || !confirmDeleteComment?.commentId) return
    const { postId, commentId } = confirmDeleteComment

    try {
      await api.delete(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`)
      setCommentsByPostId(prev => {
        const next = { ...(prev || {}) }
        const list = Array.isArray(next[String(postId)]) ? next[String(postId)] : []
        next[String(postId)] = list.filter(c => String(c.id) !== String(commentId))
        return next
      })
    } catch (e) {
      console.error('Erro ao eliminar comentário:', e)
      setFeedError('Erro ao eliminar comentário')
    } finally {
      setConfirmDeleteComment(null)
    }
  }

  const [editingPostId, setEditingPostId] = useState(null)
  const [editingPostText, setEditingPostText] = useState('')

  const [confirmDeletePostId, setConfirmDeletePostId] = useState(null)

  const beginEditPost = (post) => {
    if (!post) return
    setEditingPostId(post.id)
    setEditingPostText(String(post.texto || ''))
  }

  const cancelEditPost = () => {
    setEditingPostId(null)
    setEditingPostText('')
  }

  const saveEditPost = async (postId) => {
    if (!isAuthenticated) return
    const text = String(editingPostText || '').trim()
    if (!text) {
      setFeedError('O texto da publicação não pode estar vazio')
      return
    }

    try {
      const { data } = await api.put(`/posts/${encodeURIComponent(postId)}`, {
        texto: text,
      })

      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it?.id) !== String(postId)) return it
        return {
          ...it,
          texto: data?.texto ?? it.texto,
          imageUrl: data?.imageUrl ?? it.imageUrl,
          counts: data?.counts ?? it.counts,
        }
      }))

      cancelEditPost()
    } catch (err) {
      console.error('Erro ao editar post:', err)
      setFeedError('Erro ao editar publicação')
    }
  }

  const deletePost = async (postId) => {
    if (!isAuthenticated) return
    setConfirmDeletePostId(postId)
  }

  const confirmDeletePost = async () => {
    if (!confirmDeletePostId) return
    const postId = confirmDeletePostId

    try {
      await api.delete(`/posts/${encodeURIComponent(postId)}`)
      setFeedItemsRemote(prev => prev.filter(it => !(it?.type === 'post' && String(it?.id) === String(postId))))

      setCommentsByPostId(prev => {
        const next = { ...(prev || {}) }
        delete next[String(postId)]
        return next
      })

      setCommentDraftByPostId(prev => {
        const next = { ...(prev || {}) }
        delete next[String(postId)]
        return next
      })

      if (String(openCommentsPostId) === String(postId)) {
        setOpenCommentsPostId(null)
      }
    } catch (err) {
      console.error('Erro ao eliminar post:', err)
      setFeedError('Erro ao eliminar publicação')
    } finally {
      setConfirmDeletePostId(null)
    }
  }

  useEffect(() => {
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

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err?.message || err)
    })

    socket.on('post:like', (evt) => {
      const postId = evt?.postId
      if (postId === undefined || postId === null) return

      const likes = typeof evt?.likes === 'number' ? evt.likes : undefined
      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== String(postId)) return it
        const counts = { ...(it.counts || {}) }
        if (typeof likes === 'number') counts.likes = likes
        return { ...it, counts }
      }))

      if (user?.id && String(evt?.userId) === String(user.id)) {
        setLiked(prev => ({ ...prev, [postId]: !!evt?.liked }))
      }
    })

    socket.on('post:update', (evt) => {
      const item = evt?.item
      const postId = evt?.postId ?? item?.id
      if (!postId) return

      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it?.id) !== String(postId)) return it
        return {
          ...it,
          ...item,
          id: it.id,
          type: 'post',
        }
      }))
    })

    socket.on('post:delete', (evt) => {
      const postId = evt?.postId
      if (!postId) return
      setFeedItemsRemote(prev => prev.filter(it => !(it?.type === 'post' && String(it?.id) === String(postId))))
      if (String(openCommentsPostId) === String(postId)) {
        setOpenCommentsPostId(null)
      }
    })

    socket.on('connection:update', (evt) => {
      const targetId = evt?.targetId
      const status = evt?.status
      if (!targetId || !status) return
      upsertConnectionStatus(targetId, { status, requestId: evt?.requestId })

      if (isAuthenticated) {
        try {
          if (refreshIncomingRequestsTimeoutRef.current) {
            clearTimeout(refreshIncomingRequestsTimeoutRef.current)
          }
          refreshIncomingRequestsTimeoutRef.current = setTimeout(() => {
            refreshIncomingRequestsTimeoutRef.current = null
            fetchIncomingRequests()
          }, 400)
        } catch {}
      }
    })

    socket.on('post:new', (evt) => {
      const item = evt?.item
      if (!item || item.type !== 'post') return
      const id = item?.id
      if (id === undefined || id === null) return

      setFeedItemsRemote(prev => {
        const exists = prev.some(p => p?.type === 'post' && String(p?.id) === String(id))
        if (exists) return prev
        return [item, ...prev]
      })
    })

    socket.on('post:comment', (evt) => {
      const postId = evt?.postId
      if (postId === undefined || postId === null) return

      const nextCommentsCount = typeof evt?.comments === 'number' ? evt.comments : undefined
      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== String(postId)) return it
        const counts = { ...(it.counts || {}) }
        if (typeof nextCommentsCount === 'number') counts.comments = nextCommentsCount
        return { ...it, counts }
      }))

      const comment = evt?.comment
      if (comment && openCommentsPostId && String(openCommentsPostId) === String(postId)) {
        setCommentsByPostId(prev => {
          const key = String(postId)
          const current = Array.isArray(prev[key]) ? prev[key] : []
          if (current.some(c => String(c?.id) === String(comment?.id))) return prev
          return { ...prev, [key]: [...current, comment] }
        })
      }
    })

    socket.on('post:comment:update', (evt) => {
      const postId = evt?.postId
      if (postId === undefined || postId === null) return

      const nextCommentsCount = typeof evt?.comments === 'number' ? evt.comments : undefined
      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== String(postId)) return it
        const counts = { ...(it.counts || {}) }
        if (typeof nextCommentsCount === 'number') counts.comments = nextCommentsCount
        return { ...it, counts }
      }))

      const comment = evt?.comment
      if (comment && openCommentsPostId && String(openCommentsPostId) === String(postId)) {
        setCommentsByPostId(prev => {
          const key = String(postId)
          const current = Array.isArray(prev[key]) ? prev[key] : []
          return {
            ...prev,
            [key]: current.map(c => (String(c?.id) === String(comment?.id) ? { ...c, ...comment } : c)),
          }
        })
      }
    })

    socket.on('post:comment:delete', (evt) => {
      const postId = evt?.postId
      const commentId = evt?.commentId
      if (postId === undefined || postId === null) return

      const nextCommentsCount = typeof evt?.comments === 'number' ? evt.comments : undefined
      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== String(postId)) return it
        const counts = { ...(it.counts || {}) }
        if (typeof nextCommentsCount === 'number') counts.comments = nextCommentsCount
        return { ...it, counts }
      }))

      if (commentId !== undefined && commentId !== null && openCommentsPostId && String(openCommentsPostId) === String(postId)) {
        setCommentsByPostId(prev => {
          const key = String(postId)
          const current = Array.isArray(prev[key]) ? prev[key] : []
          return {
            ...prev,
            [key]: current.filter(c => String(c?.id) !== String(commentId)),
          }
        })
      }
    })

    socket.on('message:new', (evt) => {
      try {
        const mensagem = evt?.mensagem
        if (!mensagem) return
        if (!isAuthenticated) return
        if (String(mensagem?.remetenteId) === String(user?.id)) return

        const now = Date.now()
        if (now - Number(lastUnreadRefreshAtRef.current || 0) > 1200) {
          lastUnreadRefreshAtRef.current = now
          refreshUnreadMessagesCount()
        }
      } catch {}
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}

      try {
        if (refreshIncomingRequestsTimeoutRef.current) {
          clearTimeout(refreshIncomingRequestsTimeoutRef.current)
          refreshIncomingRequestsTimeoutRef.current = null
        }
      } catch {}
    }
  }, [isAuthenticated, user?.id, openCommentsPostId])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessagesCount(0)
      return
    }
    refreshUnreadMessagesCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

   const FEED_PAGE_SIZE = 12
   const [feedTab, setFeedTab] = useState(() => {
     const saved = String(initialHomeFilters.feedTab || 'todos')
     const allowed = new Set(['todos', 'profissionais', 'empresas', 'vagas', 'servicos'])
     return allowed.has(saved) ? saved : 'todos'
   })
   const [feedPage, setFeedPage] = useState(1)
   const [isLoadingMore, setIsLoadingMore] = useState(false)
   const [feedItemsRemote, setFeedItemsRemote] = useState([])
   const [feedHasMore, setFeedHasMore] = useState(true)
   const [feedIsLoading, setFeedIsLoading] = useState(false)
   const [feedError, setFeedError] = useState('')
  const feedSentinelRef = useRef(null)
  const feedObserverRef = useRef(null)
  const refreshIncomingRequestsTimeoutRef = useRef(null)

  const postCardRefs = useRef({})
  const handledDeepLinkPostIdRef = useRef(null)
  const deepLinkLoadMoreAttemptsRef = useRef({})
  const deepLinkLastRequestedPageRef = useRef({})

  const [connectionStatusByUserId, setConnectionStatusByUserId] = useState(() => ({}))
  const [incomingConnectionRequests, setIncomingConnectionRequests] = useState(() => ([]))

  const connectedCount = useMemo(() => (
    Object.values(connectionStatusByUserId || {}).filter(v => v?.status === 'connected').length
  ), [connectionStatusByUserId])

  const FOLLOWING_KEY = 'following'
  const [following, setFollowing] = useState(() => {
    try {
      const raw = localStorage.getItem(FOLLOWING_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
 
  useEffect(() => {
    try {
      localStorage.setItem(FOLLOWING_KEY, JSON.stringify(following))
    } catch {}
  }, [following])

  useEffect(() => {
    try {
      localStorage.setItem(HOME_FILTERS_KEY, JSON.stringify({
        feedTab,
        busca,
        categoria,
        provincia,
        distrito,
      }))
    } catch {}
  }, [feedTab, busca, categoria, provincia, distrito])

  const upsertConnectionStatus = (userId, payload) => {
    if (userId === undefined || userId === null) return
    setConnectionStatusByUserId(prev => ({
      ...prev,
      [String(userId)]: {
        ...(prev[String(userId)] || {}),
        ...(payload || {}),
      },
    }))
  }

  const getConnectionStatus = (userId) => {
    const key = String(userId)
    return connectionStatusByUserId[key]?.status || 'none'
  }

  const fetchIncomingRequests = async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.get('/connections/requests')
      const reqs = Array.isArray(data?.requests) ? data.requests : []
      setIncomingConnectionRequests(reqs)
      reqs.forEach(r => {
        const requesterId = r?.requester?.id
        if (requesterId) {
          upsertConnectionStatus(requesterId, { status: 'pending_incoming', requestId: r?.id })
        }
      })
    } catch (err) {
      console.error('Erro ao carregar solicitações de conexão:', err)
      setIncomingConnectionRequests([])
    }
  }

  const fetchConnectionStatus = async (targetId) => {
    if (!isAuthenticated) return
    if (targetId === undefined || targetId === null) return
    const key = String(targetId)
    if (connectionStatusByUserId[key]?.status) return
    try {
      const { data } = await api.get(`/connections/status/${encodeURIComponent(targetId)}`)
      const status = data?.status || 'none'
      upsertConnectionStatus(targetId, { status, requestId: data?.requestId })
    } catch (err) {
      console.error('Erro ao buscar status de conexão:', err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchIncomingRequests()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    const ids = new Set()
    feedItemsRemote.forEach(it => {
      if (it?.type === 'pessoa') {
        if (it?.id !== undefined && it?.id !== null) ids.add(String(it.id))
      }
    })
    ids.forEach((id) => fetchConnectionStatus(id))
  }, [isAuthenticated, feedItemsRemote])

  useEffect(() => {
    const isAnyModalOpen = showMobileFilters
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPaddingRight = body.style.paddingRight

    if (isAnyModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPaddingRight
    }
  }, [showMobileFilters])

  const openMessages = () => {
    if (loading) return
    navigate('/mensagens')
  }

  const toggleLike = async (id) => {
    if (!isAuthenticated) return
    setLikeFx(prev => ({ ...prev, [id]: true }))
    try {
      if (likeFxTimeoutsRef.current[id]) clearTimeout(likeFxTimeoutsRef.current[id])
      likeFxTimeoutsRef.current[id] = setTimeout(() => {
        setLikeFx(prev => {
          const next = { ...(prev || {}) }
          delete next[id]
          return next
        })
      }, 280)
    } catch {}
    try {
      const { data } = await api.post(`/posts/${id}/like`)
      const nextLiked = !!data?.liked
      const nextLikesCount = typeof data?.likes === 'number' ? data.likes : undefined

      setLiked(prev => ({ ...prev, [id]: nextLiked }))
      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== String(id)) return it
        const counts = { ...(it.counts || {}) }
        if (typeof nextLikesCount === 'number') {
          counts.likes = nextLikesCount
        }
        return { ...it, likedByMe: nextLiked, counts }
      }))
    } catch (err) {
      console.error('Erro ao curtir/descurtir:', err)
    }
  }

  useEffect(() => {
    return () => {
      try {
        Object.values(likeFxTimeoutsRef.current || {}).forEach(t => clearTimeout(t))
      } catch {}
    }
  }, [])

  const toggleComments = async (postId) => {
    const id = String(postId)
    if (openCommentsPostId && String(openCommentsPostId) === id) {
      setOpenCommentsPostId(null)
      return
    }
    setOpenCommentsPostId(postId)

    if (commentsByPostId[id]) return
    setCommentsLoadingByPostId(prev => ({ ...prev, [id]: true }))
    try {
      const { data } = await api.get(`/posts/${postId}/comments`)
      const list = Array.isArray(data?.comments) ? data.comments : []
      setCommentsByPostId(prev => ({ ...prev, [id]: list }))
    } catch (err) {
      console.error('Erro ao carregar comentários:', err)
      setCommentsByPostId(prev => ({ ...prev, [id]: [] }))
    } finally {
      setCommentsLoadingByPostId(prev => ({ ...prev, [id]: false }))
    }
  }

  const sendComment = async (postId) => {
    if (!isAuthenticated) return
    const id = String(postId)
    const draft = (commentDraftByPostId[id] || '').trim()
    if (!draft) return

    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { texto: draft })
      setCommentDraftByPostId(prev => ({ ...prev, [id]: '' }))

      const created = data && typeof data === 'object' ? data : null
      if (created) {
        setCommentsByPostId(prev => {
          const current = Array.isArray(prev[id]) ? prev[id] : []
          return { ...prev, [id]: [...current, created] }
        })
      }

      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== id) return it
        const counts = { ...(it.counts || {}) }
        counts.comments = (typeof counts.comments === 'number' ? counts.comments : 0) + 1
        return { ...it, counts }
      }))
    } catch (err) {
      console.error('Erro ao comentar:', err)
    }
  }

  const toggleSave = (id) => {
    setSaved(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const onPickPostImage = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setFeedError('Formato inválido. Use JPG, PNG ou WebP.')
      try { e.target.value = '' } catch {}
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setFeedError('Imagem muito grande. Máximo 10MB.')
      try { e.target.value = '' } catch {}
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev?.target?.result
      if (typeof result === 'string') {
        setPostImageDataUrl(result)
        setPostImageName(file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  const initials = (name) => {
    const raw = String(name || '').trim()
    if (!raw) return 'U'
    const parts = raw.split(/\s+/).slice(0, 2)
    return parts.map(p => p[0]?.toUpperCase()).join('')
  }

  const absoluteAssetUrl = (maybePath) => {
    if (!maybePath) return ''
    const raw = String(maybePath)
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw

    const base = String(api?.defaults?.baseURL || '').replace(/\/?api\/?$/i, '')
    const path = raw.startsWith('/') ? raw : `/${raw}`
    return `${base}${path}`
  }

  const relativeTime = (seed) => {
    const m = (Number(seed) || 1) % 60
    if (m < 2) return 'Agora'
    return `${m} min`
  }

  const relativeTimeFromDate = (date) => {
    try {
      const ts = new Date(date).getTime()
      if (!Number.isFinite(ts)) return 'Agora'
      const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000))
      if (diffMin < 2) return 'Agora'
      if (diffMin < 60) return `${diffMin} min`
      const diffH = Math.floor(diffMin / 60)
      if (diffH < 24) return `${diffH} h`
      const diffD = Math.floor(diffH / 24)
      return `${diffD} d`
    } catch {
      return 'Agora'
    }
  }

  const typeLabel = (t) => {
    if (t === 'profissional') return 'Profissional'
    if (t === 'pessoa') return 'Pessoa'
    if (t === 'empresa') return 'Empresa'
    if (t === 'anuncio') return 'Patrocinado'
    if (t === 'post') return 'Publicação'
    if (t === 'servico') return 'Serviço'
    return 'Vaga'
  }

  const typePill = (t) => {
    if (t === 'profissional') return 'bg-blue-50 text-blue-700 border-blue-100'
    if (t === 'pessoa') return 'bg-blue-50 text-blue-700 border-blue-100'
    if (t === 'empresa') return 'bg-slate-50 text-slate-700 border-slate-200'
    if (t === 'anuncio') return 'bg-amber-50 text-amber-800 border-amber-100'
    if (t === 'post') return 'bg-gray-50 text-gray-700 border-gray-200'
    if (t === 'servico') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }

  const clearFilters = () => {
    setCategoria('')
    setProvincia('')
    setDistrito('')
    setFeedTab('todos')
  }

  

  const apiTabFromUiTab = (tab) => {
    if (tab === 'todos') return 'todos'
    if (tab === 'vagas') return 'vagas'
    if (tab === 'profissionais') return 'pessoas'
    if (tab === 'empresas') return 'empresas'
    if (tab === 'servicos') return 'servicos'
    return 'todos'
  }

  const fetchFeedPage = async (nextPage, { reset = false } = {}) => {
    const apiTab = apiTabFromUiTab(feedTab)
    const q = busca.trim()

    if (feedIsLoading) return

    setFeedIsLoading(true)
    setFeedError('')
    try {
      const { data } = await api.get('/feed', {
        params: {
          tab: apiTab,
          q,
          page: nextPage,
          limit: FEED_PAGE_SIZE,
        },
      })

      const incoming = Array.isArray(data?.items) ? data.items : []
      const incomingLiked = {}
      incoming
        .filter(it => it?.type === 'post' && (it?.id !== undefined && it?.id !== null))
        .forEach(it => {
          if (it?.likedByMe) incomingLiked[it.id] = true
        })

      if (Object.keys(incomingLiked).length) {
        setLiked(prev => ({ ...prev, ...incomingLiked }))
      }

      setFeedItemsRemote(prev => {
        const base = reset ? [] : (Array.isArray(prev) ? prev : [])
        const merged = [...base, ...(Array.isArray(incoming) ? incoming : [])]
        const seen = new Set()
        const deduped = []
        for (const it of merged) {
          const key = `${it?.type || 'item'}:${String(it?.id ?? '')}`
          if (seen.has(key)) continue
          seen.add(key)
          deduped.push(it)
        }
        return reset ? (Array.isArray(incoming) ? incoming : []) : deduped
      })
      setFeedHasMore(incoming.length >= FEED_PAGE_SIZE)
      setFeedPage(nextPage)
    } catch (err) {
      console.error('Erro ao carregar feed:', err)
      setFeedError('Erro ao carregar feed')
      if (reset) {
        setFeedItemsRemote([])
      }
      setFeedHasMore(false)
    } finally {
      setFeedIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoadingMore(false)
    setFeedHasMore(true)
    fetchFeedPage(1, { reset: true })
  }, [feedTab, busca, categoria, provincia, distrito])

  const publishPost = async () => {
    if (!user) {
      setFeedError('Faça login para publicar')
      return
    }

    const text = postText.trim()
    if (!text && !postImageDataUrl) return

    if (isPublishing) return
    setIsPublishing(true)
    setFeedError('')

    try {
      const resp = await api.post('/posts', {
        texto: text,
        imageUrl: postImageDataUrl || null,
      })

      const created = {
        type: 'post',
        id: resp.data?.id,
        createdAt: resp.data?.createdAt,
        nome: resp.data?.author?.nome || user?.nome || 'Usuário',
        texto: resp.data?.texto || text,
        imageUrl: resp.data?.imageUrl || postImageDataUrl || null,
        avatarUrl: resp.data?.author?.avatarUrl || resp.data?.author?.foto || resp.data?.author?.logo || user?.foto || user?.logo || '',
        author: resp.data?.author ? {
          id: resp.data.author.id,
          nome: resp.data.author.nome,
          tipo: resp.data.author.tipo,
          foto: resp.data.author.foto,
          logo: resp.data.author.logo,
        } : (user ? {
          id: user.id,
          nome: user.nome,
          tipo: user.tipo,
          foto: user.foto,
          logo: user.logo,
        } : null),
        counts: resp.data?.counts || { likes: 0, comments: 0 },
      }

      setFeedItemsRemote(prev => [created, ...prev])
      setPostText('')
      setPostImageDataUrl('')
      setPostImageName('')
      try {
        if (postImageInputRef.current) postImageInputRef.current.value = ''
      } catch {}

      if (feedTab !== 'todos') {
        setFeedTab('todos')
      }

      try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {}
    } catch (err) {
      console.error('Erro ao publicar:', err)
      setFeedError('Erro ao publicar')
    } finally {
      setIsPublishing(false)
    }
  }

  const provincias = useMemo(() => ([
    {
      id: 'cabo-delgado',
      nome: 'Cabo Delgado',
      distritos: [
        'Ancuabe',
        'Balama',
        'Chiúre',
        'Ibo',
        'Macomia',
        'Mecúfi',
        'Meluco',
        'Metuge',
        'Montepuez',
        'Mocímboa da Praia',
        'Mueda',
        'Muidumbe',
        'Namuno',
        'Nangade',
        'Palma',
        'Pemba',
        'Quissanga',
      ],
    },
    {
      id: 'gaza',
      nome: 'Gaza',
      distritos: [
        'Bilene',
        'Chibuto',
        'Chicualacuala',
        'Chigubo',
        'Chókwè',
        'Guijá',
        'Limpopo',
        'Mabalane',
        'Manjacaze',
        'Mapai',
        'Massangena',
        'Xai-Xai',
      ],
    },
    {
      id: 'inhambane',
      nome: 'Inhambane',
      distritos: [
        'Cidade de Inhambane',
        'Funhalouro',
        'Govuro',
        'Homoíne',
        'Inharrime',
        'Inhassoro',
        'Jangamo',
        'Mabote',
        'Massinga',
        'Maxixe',
        'Morrumbene',
        'Panda',
        'Vilankulo',
        'Zavala',
      ],
    },
    {
      id: 'manica',
      nome: 'Manica',
      distritos: [
        'Bárue',
        'Chimoio',
        'Gondola',
        'Guro',
        'Machaze',
        'Macossa',
        'Manica',
        'Mossurize',
        'Sussundenga',
        'Tambara',
        'Vanduzi',
      ],
    },
    {
      id: 'maputo-provincia',
      nome: 'Maputo (Província)',
      distritos: [
        'Boane',
        'Magude',
        'Manhiça',
        'Marracuene',
        'Matola',
        'Matutuíne',
        'Moamba',
        'Namaacha',
      ],
    },
    {
      id: 'maputo-cidade',
      nome: 'Maputo (Cidade)',
      distritos: [
        'KaMpfumo',
        'Nlhamankulu',
        'KaMaxakeni',
        'KaMavota',
        'KaMubukwana',
        'KaTembe',
        'KaNyaka',
      ],
    },
    {
      id: 'nampula',
      nome: 'Nampula',
      distritos: [
        'Angoche',
        'Erati',
        'Ilha de Moçambique',
        'Lalaua',
        'Larde',
        'Liúpo',
        'Malema',
        'Meconta',
        'Mecubúri',
        'Memba',
        'Mogincual',
        'Mogovolas',
        'Moma',
        'Monapo',
        'Mossuril',
        'Muecate',
        'Murrupula',
        'Nacala-a-Velha',
        'Nacala Porto',
        'Nacarôa',
        'Nampula',
        'Rapale',
        'Ribáuè',
      ],
    },
    {
      id: 'niassa',
      nome: 'Niassa',
      distritos: [
        'Cuamba',
        'Lago',
        'Metangula',
        'Lichinga',
        'Majune',
        'Mandimba',
        'Marrupa',
        'Maúa',
        'Mavago',
        'Mecula',
        'Metarica',
        'Muembe',
        'Ngaúma',
        'Nipepe',
        'Sanga',
      ],
    },
    {
      id: 'sofala',
      nome: 'Sofala',
      distritos: [
        'Beira',
        'Búzi',
        'Caia',
        'Chemba',
        'Cheringoma',
        'Chibabava',
        'Dondo',
        'Gorongosa',
        'Machanga',
        'Maringue',
        'Marromeu',
        'Muanza',
        'Nhamatanda',
      ],
    },
    {
      id: 'tete',
      nome: 'Tete',
      distritos: [
        'Angónia',
        'Cahora-Bassa',
        'Changara',
        'Chifunde',
        'Chiuta',
        'Doa',
        'Macanga',
        'Mágoè',
        'Marara',
        'Marávia',
        'Moatize',
        'Mutarara',
        'Tsangano',
        'Tete',
        'Zumbo',
      ],
    },
    {
      id: 'zambezia',
      nome: 'Zambézia',
      distritos: [
        'Alto Molócuè',
        'Chinde',
        'Derre',
        'Gilé',
        'Gurué',
        'Ile',
        'Inhassunge',
        'Lugela',
        'Maganja da Costa',
        'Milange',
        'Molumbo',
        'Mocuba',
        'Mopeia',
        'Morrumbala',
        'Mulevala',
        'Namacurra',
        'Namarroi',
        'Nicoadala',
        'Pebane',
        'Quelimane',
      ],
    },
  ]), [])

  const mockCompanyPosts = useMemo(() => ([
    {
      id: 'e-1',
      type: 'empresa',
      empresaId: 'e-1',
      empresa: 'Nevú',
      setor: 'Tecnologia & Talentos',
      localizacao: 'Maputo',
      provincia: 'maputo-cidade',
      distrito: 'KaMpfumo',
      texto: 'Estamos a contratar e também a conectar empresas a profissionais verificados. Publique vagas, serviços e encontre talentos com rapidez.',
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=60',
      imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60',
      ctaLabel: 'Ver página',
      ctaTo: `/perfil-empresa/${encodeURIComponent('e-1')}`,
    },
    {
      id: 'e-2',
      type: 'empresa',
      empresaId: 'e-2',
      empresa: 'TechMoç',
      setor: 'Software',
      localizacao: 'Maputo',
      provincia: 'maputo-cidade',
      distrito: 'Nlhamankulu',
      texto: 'Novas vagas abertas para Frontend e UI. Envie o seu portfólio e participe do nosso programa de estágio.',
      avatarUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=200&q=60',
      imageUrl: 'https://images.unsplash.com/photo-1522071901873-411886a10004?auto=format&fit=crop&w=1200&q=60',
      ctaLabel: 'Ver página',
      ctaTo: `/perfil-empresa/${encodeURIComponent('e-2')}`,
    },
  ]), [])

  const mockAds = useMemo(() => ([
    {
      id: 'ad-1',
      type: 'anuncio',
      empresaId: 'ad-1',
      empresa: 'Criativa',
      setor: 'Design & Branding',
      localizacao: 'Beira',
      provincia: 'sofala',
      distrito: 'Beira',
      titulo: 'Publicidade: Identidade visual para negócios',
      texto: 'Pacotes de branding completos (logo, paleta, templates e social). Entrega rápida e com contrato.',
      avatarUrl: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=200&q=60',
      imageUrl: 'https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=1200&q=60',
      ctaLabel: 'Ver página',
      ctaTo: `/perfil-empresa/${encodeURIComponent('ad-1')}`,
    },
  ]), [])

  const distritosDisponiveis = useMemo(() => {
    if (!provincia) return []
    const prov = provincias.find(p => p.id === provincia)
    return prov?.distritos || []
  }, [provincia, provincias])

  useEffect(() => {
    setDistrito('')
  }, [provincia])

  const mockProfessionals = useMemo(() => ([
    {
      id: 'p-1',
      type: 'profissional',
      nome: 'Amélia Mucavele',
      titulo: 'Desenvolvedora Frontend',
      localizacao: 'Maputo',
      provincia: 'maputo-cidade',
      distrito: 'KaMpfumo',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60',
      habilidades: ['React', 'Vite', 'Tailwind', 'UI/UX'],
      disponibilidade: 'Imediata',
      preco: '15.000 - 25.000 MT',
    },
    {
      id: 'p-2',
      type: 'profissional',
      nome: 'Carlos Mussa',
      titulo: 'Designer Gráfico',
      localizacao: 'Beira',
      provincia: 'sofala',
      distrito: 'Beira',
      avatarUrl: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=60',
      habilidades: ['Branding', 'Logo', 'Photoshop', 'Figma'],
      disponibilidade: '3 dias',
      preco: '8.000 - 18.000 MT',
    },
    {
      id: 'p-3',
      type: 'profissional',
      nome: 'Nádia Sitoe',
      titulo: 'Social Media & Marketing',
      localizacao: 'Nampula',
      provincia: 'nampula',
      distrito: 'Nampula',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=60',
      habilidades: ['Ads', 'Conteúdo', 'SEO', 'Analytics'],
      disponibilidade: '1 semana',
      preco: '10.000 - 22.000 MT',
    },
    {
      id: 'p-4',
      type: 'profissional',
      nome: 'João Nhantumbo',
      titulo: 'Técnico de Redes',
      localizacao: 'Maputo',
      provincia: 'maputo-provincia',
      distrito: 'Marracuene',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60',
      habilidades: ['Redes', 'MikroTik', 'Wi‑Fi', 'Manutenção'],
      disponibilidade: 'Imediata',
      preco: '12.000 - 20.000 MT',
    },
    {
      id: 'p-5',
      type: 'profissional',
      nome: 'Sara Machava',
      titulo: 'Contabilista',
      localizacao: 'Matola',
      provincia: 'maputo-provincia',
      distrito: 'Matola',
      avatarUrl: 'https://images.unsplash.com/photo-1520975958225-5f6f5f7e8f7a?auto=format&fit=crop&w=200&q=60',
      habilidades: ['Contabilidade', 'IVA', 'Folha de pagamento', 'Relatórios'],
      disponibilidade: '2 dias',
      preco: '9.000 - 16.000 MT',
    },
  ]), [])

  const mockServices = useMemo(() => ([
    {
      id: 's-1',
      type: 'servico',
      titulo: 'Preciso de um Website institucional',
      categoria: 'tecnologia',
      localizacao: 'Maputo',
      provincia: 'maputo-cidade',
      distrito: 'KaMavota',
      orcamento: '25.000 - 35.000 MT',
      prazo: '30 dias',
      tags: ['Website', 'Landing', 'Manutenção'],
    },
    {
      id: 's-2',
      type: 'servico',
      titulo: 'Design de logo e identidade visual',
      categoria: 'design',
      localizacao: 'Beira',
      provincia: 'sofala',
      distrito: 'Beira',
      orcamento: '8.000 - 15.000 MT',
      prazo: '15 dias',
      tags: ['Logo', 'Branding', 'Manual de marca'],
    },
    {
      id: 's-3',
      type: 'servico',
      titulo: 'Gestão de campanhas de marketing digital',
      categoria: 'marketing',
      localizacao: 'Nampula',
      provincia: 'nampula',
      distrito: 'Nampula',
      orcamento: '20.000 - 30.000 MT',
      prazo: '45 dias',
      tags: ['Ads', 'SEO', 'Conteúdo'],
    },
  ]), [])

  const mockJobs = useMemo(() => ([
    {
      id: 'v-1',
      type: 'vaga',
      titulo: 'Desenvolvedor Frontend',
      empresa: 'TechMoç',
      localizacao: 'Maputo',
      provincia: 'maputo-cidade',
      distrito: 'Nlhamankulu',
      salario: '15.000 - 25.000 MT',
      modelo: 'Híbrido',
      tags: ['React', 'UI', 'APIs'],
    },
    {
      id: 'v-2',
      type: 'vaga',
      titulo: 'Designer Gráfico',
      empresa: 'Criativa',
      localizacao: 'Beira',
      provincia: 'sofala',
      distrito: 'Beira',
      salario: '12.000 - 18.000 MT',
      modelo: 'Presencial',
      tags: ['Branding', 'Social media', 'Figma'],
    },
    {
      id: 'v-3',
      type: 'vaga',
      titulo: 'Analista de Marketing',
      empresa: 'DigitalMoç',
      localizacao: 'Nampula',
      provincia: 'nampula',
      distrito: 'Nampula',
      salario: '18.000 - 25.000 MT',
      modelo: 'Remoto',
      tags: ['SEO', 'Ads', 'Analytics'],
    },
  ]), [])

  const feedItemsBase = useMemo(() => {
    return [...userPosts, ...feedItemsRemote]
  }, [feedItemsRemote, userPosts])

  const normalizedQuery = busca.trim().toLowerCase()
  const feedItemsFiltered = useMemo(() => {
    const byTab = feedItemsBase.filter(it => {
      if (feedTab === 'todos') return true
      if (feedTab === 'profissionais') return it.type === 'pessoa'
      if (feedTab === 'empresas') return it.type === 'empresa' || it.type === 'anuncio'
      if (feedTab === 'vagas') return it.type === 'vaga'
      if (feedTab === 'servicos') return it.type === 'servico'
      return true
    })

    const selfId = user?.id ?? user?._id
    const withoutSelf = selfId
      ? byTab.filter(it => {
          if (it?.type === 'pessoa' || it?.type === 'profissional' || it?.type === 'empresa') {
            return String(it.id ?? '') !== String(selfId)
          }
          return true
        })
      : byTab

    const byCategoria = categoria
      ? withoutSelf.filter(it => {
          if (it.type === 'servico') return it.categoria === categoria
          return true
        })
      : withoutSelf

    const byProvincia = provincia
      ? byCategoria.filter(it => it.provincia === provincia)
      : byCategoria

    const byDistrito = distrito
      ? byProvincia.filter(it => it.distrito === distrito)
      : byProvincia

    if (!normalizedQuery) return byDistrito

    return byDistrito.filter(it => {
      const haystack = [
        it.nome,
        it.titulo,
        it.empresa,
        it.localizacao,
        it.provincia,
        it.distrito,
        it.texto,
        ...(Array.isArray(it.habilidades) ? it.habilidades : []),
        ...(Array.isArray(it.tags) ? it.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [categoria, distrito, feedItemsBase, feedTab, normalizedQuery, provincia, user?.id, user?._id])

  const visibleFeedItems = useMemo(() => {
    return feedItemsFiltered
  }, [feedItemsFiltered])

  useEffect(() => {
    const params = new URLSearchParams(String(location?.search || ''))
    const deepPostId = params.get('post')
    if (!deepPostId) return

    if (feedTab !== 'todos' || busca || categoria || provincia || distrito) {
      if (feedTab !== 'todos') setFeedTab('todos')
      if (busca) setBusca('')
      if (categoria) setCategoria('')
      if (provincia) setProvincia('')
      if (distrito) setDistrito('')
      return
    }

    const exists = visibleFeedItems.some(it => it?.type === 'post' && String(it?.id) === String(deepPostId))
    if (!exists) {
      const key = String(deepPostId)
      const prevAttempts = Number(deepLinkLoadMoreAttemptsRef.current[key] || 0)
      const maxAttempts = 6

      if (feedHasMore && !feedIsLoading && prevAttempts < maxAttempts) {
        const nextPage = Math.max(Number(feedPage) || 1, 1) + 1
        const lastReq = Number(deepLinkLastRequestedPageRef.current[key] || 0)
        if (nextPage !== lastReq) {
          deepLinkLoadMoreAttemptsRef.current[key] = prevAttempts + 1
          deepLinkLastRequestedPageRef.current[key] = nextPage
          fetchFeedPage(nextPage)
        }
      }
      return
    }

    if (String(handledDeepLinkPostIdRef.current) === String(deepPostId)) return
    handledDeepLinkPostIdRef.current = deepPostId

    try {
      delete deepLinkLoadMoreAttemptsRef.current[String(deepPostId)]
      delete deepLinkLastRequestedPageRef.current[String(deepPostId)]
    } catch {}

    try {
      const ref = postCardRefs.current[String(deepPostId)]
      if (ref && ref.scrollIntoView) {
        setTimeout(() => {
          try {
            ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } catch {}
        }, 0)
      }
    } catch {}

    toggleComments(deepPostId)
  }, [location?.search, visibleFeedItems, openCommentsPostId, feedTab, busca, categoria, provincia, distrito, feedHasMore, feedIsLoading, feedPage])

  useEffect(() => {
    const sentinel = feedSentinelRef.current
    if (!sentinel) return

    if (feedObserverRef.current) {
      feedObserverRef.current.disconnect()
    }

    feedObserverRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (isLoadingMore) return

        if (!feedHasMore) return
        if (feedIsLoading) return

        setIsLoadingMore(true)
        Promise.resolve(fetchFeedPage(feedPage + 1))
          .finally(() => setIsLoadingMore(false))
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    )

    feedObserverRef.current.observe(sentinel)
    return () => {
      feedObserverRef.current?.disconnect()
    }
  }, [feedHasMore, feedIsLoading, feedPage, isLoadingMore])

  const requestConnection = async (targetId) => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.post(`/connections/${encodeURIComponent(targetId)}`)
      const status = data?.status || 'pending_outgoing'
      upsertConnectionStatus(targetId, { status, requestId: data?.requestId })
      fetchIncomingRequests()
    } catch (err) {
      console.error('Erro ao solicitar conexão:', err)
    }
  }

  const removeConnection = async (targetId) => {
    if (!isAuthenticated) return
    try {
      await api.delete(`/connections/${encodeURIComponent(targetId)}`)
      upsertConnectionStatus(targetId, { status: 'none', requestId: undefined })
      fetchIncomingRequests()
    } catch (err) {
      console.error('Erro ao cancelar/remover conexão:', err)
    }
  }

  const acceptConnection = async (requestId, requesterId) => {
    if (!isAuthenticated) return
    try {
      await api.post(`/connections/${encodeURIComponent(requestId)}/accept`)
      upsertConnectionStatus(requesterId, { status: 'connected', requestId })
      setIncomingConnectionRequests(prev => prev.filter(r => String(r?.id) !== String(requestId)))
    } catch (err) {
      console.error('Erro ao aceitar conexão:', err)
    }
  }

  const rejectConnection = async (requestId, requesterId) => {
    if (!isAuthenticated) return
    try {
      await api.post(`/connections/${encodeURIComponent(requestId)}/reject`)
      upsertConnectionStatus(requesterId, { status: 'none', requestId })
      setIncomingConnectionRequests(prev => prev.filter(r => String(r?.id) !== String(requestId)))
    } catch (err) {
      console.error('Erro ao rejeitar conexão:', err)
    }
  }

  const isFollowing = (id) => following.includes(id)
  const toggleFollow = (id) => {
    setFollowing(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      return [...prev, id]
    })
  }

  const categorias = [
    { id: 'tecnologia', nome: 'Tecnologia', icon: '💻', vagas: 45 },
    { id: 'design', nome: 'Design', icon: '🎨', vagas: 32 },
    { id: 'marketing', nome: 'Marketing', icon: '📈', vagas: 28 },
    { id: 'administrativo', nome: 'Administrativo', icon: '📊', vagas: 38 },
    { id: 'vendas', nome: 'Vendas', icon: '💰', vagas: 25 },
    { id: 'saude', nome: 'Saúde', icon: '🏥', vagas: 18 }
  ]
  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'tecnologia': return '💻'
      case 'design': return '🎨'
      case 'marketing': return '📈'
      case 'administrativo': return '📊'
      case 'vendas': return '💰'
      case 'saude': return '🏥'
      default: return '💼'
    }
  }

  return (
    <div className="bg-[#f4f2ee] min-h-screen">
      {confirmDeletePostId ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="font-bold text-gray-900">Eliminar publicação</div>
            </div>
            <div className="p-4 text-sm text-gray-700">
              Tem certeza que deseja eliminar esta publicação?
            </div>
            <div className="px-4 pb-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePostId(null)}
                className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteComment ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="font-bold text-gray-900">Eliminar comentário</div>
            </div>
            <div className="px-4 py-4 text-sm text-gray-700">
              Tem certeza que deseja eliminar este comentário?
            </div>
            <div className="px-4 pb-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteComment(null)}
                className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCommentNow}
                className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="sticky top-0 z-40 bg-[#f4f2ee]/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar por pessoas, serviços, habilidades ou locais"
                  className="w-full outline-none text-gray-800 placeholder:text-gray-400"
                />
                {busca.trim() && (
                  <button
                    onClick={() => setBusca('')}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Limpar busca"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(true)}
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 transition"
              aria-label="Abrir filtros"
              title="Filtros"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17.999v-5.585L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </button>

            <button
              onClick={openMessages}
              className="relative hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
            >
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[10px] px-1.5 font-bold shadow z-10">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 01-4-.77L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Mensagens
            </button>

            <button
              onClick={openMessages}
              className="relative sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 text-white shadow-sm hover:bg-black transition"
              aria-label="Abrir mensagens"
              title="Mensagens"
            >
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[10px] px-1.5 font-bold shadow z-10">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 01-4-.77L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>

          <div className="sm:hidden mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'todos', label: 'Tudo' },
              { id: 'profissionais', label: 'Pessoas' },
              { id: 'empresas', label: 'Empresas' },
              { id: 'vagas', label: 'Vagas' },
              { id: 'servicos', label: 'Serviços' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setFeedTab(t.id)
                  if (t.id === 'profissionais') setBusca('')
                }}
                className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${feedTab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(categoria || provincia || distrito) && (
            <button
              onClick={clearFilters}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border bg-white text-gray-700 border-gray-200"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {showMobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:hidden"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl border-t border-gray-200 p-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-gray-900 text-lg">Filtros</div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Tipo</label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[
                    { id: 'todos', label: 'Tudo' },
                    { id: 'profissionais', label: 'Pessoas' },
                    { id: 'empresas', label: 'Empresas' },
                    { id: 'vagas', label: 'Vagas' },
                    { id: 'servicos', label: 'Serviços' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setFeedTab(t.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition ${feedTab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="mt-1 w-full px-3 py-3 rounded-2xl text-sm font-semibold border border-gray-200 bg-white text-gray-800"
                >
                  <option value="">Todas</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Província</label>
                <select
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="mt-1 w-full px-3 py-3 rounded-2xl text-sm font-semibold border border-gray-200 bg-white text-gray-800"
                >
                  <option value="">Todas</option>
                  {provincias.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Distrito</label>
                <select
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  disabled={!provincia}
                  className="mt-1 w-full px-3 py-3 rounded-2xl text-sm font-semibold border border-gray-200 bg-white text-gray-800 disabled:opacity-60"
                >
                  <option value="">Todos</option>
                  {distritosDisponiveis.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  clearFilters()
                }}
                className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 font-semibold"
              >
                Limpar
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-32 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="p-4 -mt-8">
                  <div className="flex items-end justify-between">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-800 shadow-sm">
                      {initials(user?.nome || 'Visitante')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {connectedCount} conexões
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="font-bold text-gray-900">
                      {user?.nome || 'Visitante'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user ? (user.tipo === 'empresa' ? 'Conta empresarial' : 'Conta pessoal') : 'Explore e conecte-se'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <div className="font-bold text-gray-900 mb-3">Filtros</div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'todos', label: 'Tudo' },
                    { id: 'profissionais', label: 'Pessoas' },
                    { id: 'empresas', label: 'Empresas' },
                    { id: 'vagas', label: 'Vagas' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setFeedTab(t.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${feedTab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-200'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-gray-600">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-blue-200 transition"
                    aria-label="Filtrar por categoria"
                  >
                    <option value="">Todas</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>

                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-600">Província</label>
                    <select
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-blue-200 transition"
                      aria-label="Filtrar por província"
                    >
                      <option value="">Todas</option>
                      {provincias.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-600">Distrito</label>
                    <select
                      value={distrito}
                      onChange={(e) => setDistrito(e.target.value)}
                      disabled={!provincia}
                      className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-blue-200 transition disabled:opacity-60"
                      aria-label="Filtrar por distrito"
                    >
                      <option value="">Todos</option>
                      {distritosDisponiveis.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    {visibleFeedItems.length} de {feedItemsFiltered.length}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-6 space-y-4">
            {isAuthenticated ? (
              <>
                <div className="md:hidden bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowMobileConnections(true)}
                    className="w-full p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 text-left">
                      <div className="font-bold text-gray-900">Conexões</div>
                      <div className="text-sm text-gray-600 truncate">
                        {Array.isArray(incomingConnectionRequests) && incomingConnectionRequests.length > 0
                          ? `${incomingConnectionRequests.length} solicitação(ões) pendente(s)`
                          : 'Ver solicitações e sugestões'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {Array.isArray(incomingConnectionRequests) && incomingConnectionRequests.length > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                          {incomingConnectionRequests.length > 99 ? '99+' : incomingConnectionRequests.length}
                        </span>
                      ) : null}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>

                {showMobileConnections ? (
                  <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-end md:hidden"
                    onClick={() => setShowMobileConnections(false)}
                  >
                    <div
                      className="w-full max-h-[85vh] bg-white rounded-t-3xl p-4 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-gray-900">Solicitações e sugestões</div>
                        <button
                          type="button"
                          onClick={() => setShowMobileConnections(false)}
                          className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
                          aria-label="Fechar"
                        >
                          ×
                        </button>
                      </div>

                      {Array.isArray(incomingConnectionRequests) && incomingConnectionRequests.length > 0 ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-gray-900">Solicitações</div>
                            <div className="text-xs text-gray-500">{incomingConnectionRequests.length}</div>
                          </div>
                          <div className="mt-3 space-y-3">
                            {incomingConnectionRequests.map((r) => {
                              const rid = r?.requester?.id
                              const rname = r?.requester?.nome || 'Usuário'
                              const ravatar = r?.requester?.foto || r?.requester?.logo || ''
                              return (
                                <div key={r?.id} className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                    {ravatar ? (
                                      <div className="w-full h-full rounded-full overflow-hidden">
                                        <img src={absoluteAssetUrl(ravatar)} alt={rname} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      initials(rname)
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900 truncate">{rname}</div>
                                    <div className="text-xs text-gray-600 truncate">Pedido de conexão</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => acceptConnection(r.id, rid)}
                                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                                    >
                                      Aceitar
                                    </button>
                                    <button
                                      onClick={() => rejectConnection(r.id, rid)}
                                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                                    >
                                      Recusar
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-700">
                          Sem solicitações por enquanto.
                        </div>
                      )}

                      <div className="mt-5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-gray-900">Sugestões</div>
                          <div className="text-xs text-gray-500">Para você</div>
                        </div>
                        <div className="mt-3 space-y-3">
                          {feedItemsRemote
                            .filter(it => it?.type === 'pessoa' || it?.type === 'empresa')
                            .slice(0, 10)
                            .map(s => (
                              <div key={s.id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                  {s.avatarUrl ? (
                                    <div className="w-full h-full rounded-full overflow-hidden">
                                      <img src={absoluteAssetUrl(s.avatarUrl)} alt={s.nome} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    initials(s.nome)
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 truncate">{s.nome}</div>
                                  <div className="text-xs text-gray-600 truncate">{s.type === 'empresa' ? 'Empresa' : 'Pessoa'}</div>
                                </div>

                                {s.type === 'pessoa' ? (
                                  (() => {
                                    const state = getConnectionStatus(s.id)
                                    const meta = connectionStatusByUserId[String(s.id)] || {}

                                    if (state === 'pending_incoming') {
                                      return (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => acceptConnection(meta.requestId, s.id)}
                                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                                          >
                                            Aceitar
                                          </button>
                                          <button
                                            onClick={() => rejectConnection(meta.requestId, s.id)}
                                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                                          >
                                            Recusar
                                          </button>
                                        </div>
                                      )
                                    }

                                    return (
                                      <button
                                        onClick={() => {
                                          if (state === 'connected' || state === 'pending_outgoing') return removeConnection(s.id)
                                          return requestConnection(s.id)
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${state === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : state === 'pending_outgoing' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                                      >
                                        {state === 'connected' ? 'Conectado' : state === 'pending_outgoing' ? 'Pendente' : 'Conectar'}
                                      </button>
                                    )
                                  })()
                                ) : (
                                  <button
                                    onClick={() => toggleFollow(s.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${isFollowing(s.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}
                                  >
                                    {isFollowing(s.id) ? 'Seguindo' : 'Seguir'}
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {isAuthenticated ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                      {user?.perfil?.foto || user?.foto || user?.perfil?.logo || user?.logo ? (
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <img src={absoluteAssetUrl(user?.perfil?.foto || user?.foto || user?.perfil?.logo || user?.logo)} alt={user?.nome || 'Usuário'} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        initials(user?.nome || 'Você')
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('home-post-composer-input')
                          if (el && el.focus) el.focus()
                        }}
                        className="w-full text-left px-4 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                      >
                        {user?.nome ? `No que você está a pensar, ${String(user.nome).split(' ')[0]}?` : 'No que você está a pensar?'}
                      </button>
                      <div className="mt-3 hidden">
                        <input
                          id="home-post-composer-input"
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {postText || postImageDataUrl ? (
                    <div className="mt-3">
                      <textarea
                        id="home-post-composer-input"
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Escreva algo..."
                      />
                    </div>
                  ) : null}

                  {postImageDataUrl ? (
                    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      <img src={postImageDataUrl} alt="" className="w-full max-h-[420px] object-cover" />
                    </div>
                  ) : null}

                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-semibold text-gray-700 cursor-pointer transition">
                        <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2v6.586l-2.293-2.293a1 1 0 00-1.414 0L9 12.586 7.707 11.293a1 1 0 00-1.414 0L4 13.586V5h12z" />
                        </svg>
                        Foto/Vídeo
                        <input
                          ref={postImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={onPickPostImage}
                          className="hidden"
                        />
                      </label>
                      {(postText || postImageDataUrl) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPostText('')
                            setPostImageDataUrl('')
                            setPostImageName('')
                            try { if (postImageInputRef.current) postImageInputRef.current.value = '' } catch {}
                          }}
                          className="px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-semibold text-gray-700 transition"
                        >
                          Limpar
                        </button>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={publishPost}
                      disabled={isPublishing || (!postText.trim() && !postImageDataUrl)}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 transition"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {feedIsLoading && visibleFeedItems.length === 0 ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200" />
                          <div className="flex-1">
                            <div className="h-4 w-44 bg-gray-200 rounded" />
                            <div className="mt-2 h-3 w-28 bg-gray-200 rounded" />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-3 w-full bg-gray-200 rounded" />
                          <div className="h-3 w-5/6 bg-gray-200 rounded" />
                          <div className="h-3 w-2/3 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-9 bg-gray-200 rounded-lg" />
                          <div className="h-9 bg-gray-200 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleFeedItems.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
                  Nenhum resultado para a sua busca.
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleFeedItems.map((item) => {
                    const itemKey = `${item.type || 'item'}-${item.id ?? item._seed ?? Math.random().toString(36).slice(2)}`

                    if (item?.type === 'pessoa') {
                      const authorName = item?.nome || 'Pessoa'
                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                {item.avatarUrl ? (
                                  <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={absoluteAssetUrl(item.avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  initials(authorName)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-gray-900 truncate">{authorName}</div>
                                <div className="text-sm text-gray-600 truncate">Perfil</div>
                              </div>
                              <Link
                                to={`/perfil/${encodeURIComponent(item.id)}`}
                                className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition"
                              >
                                Ver
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (item?.type === 'post') {
                      const postId = item?.id
                      const authorName = item?.nome || 'Usuário'
                      const likesCount = typeof item?.counts?.likes === 'number' ? item.counts.likes : 0
                      const commentsCount = typeof item?.counts?.comments === 'number' ? item.counts.comments : 0
                      const isLiked = typeof item?.likedByMe === 'boolean' ? item.likedByMe : !!liked[String(postId)]
                      const likeFxOn = !!likeFx[String(postId)]

                      return (
                        <div
                          key={itemKey}
                          ref={(el) => {
                            if (postId !== undefined && postId !== null) postCardRefs.current[String(postId)] = el
                          }}
                          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                                {item.avatarUrl ? (
                                  <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={absoluteAssetUrl(item.avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  initials(authorName)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-gray-900 truncate leading-tight">{authorName}</div>
                                <div className="text-xs text-gray-500 truncate leading-tight">{new Date(item?.createdAt || Date.now()).toLocaleString()}</div>
                              </div>
                              <button
                                type="button"
                                className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center transition"
                                aria-label="Mais opções"
                              >
                                ⋯
                              </button>
                            </div>

                            {item?.texto ? (
                              <div className="mt-3 text-[15px] text-gray-900 leading-relaxed whitespace-pre-line">{item.texto}</div>
                            ) : null}

                            {item?.imageUrl ? (
                              <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                <img src={absoluteAssetUrl(item.imageUrl)} alt="" className="w-full max-h-[520px] object-cover" />
                              </div>
                            ) : null}

                            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px]">👍</span>
                                <span>{likesCount}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleComments(postId)}
                                className="hover:underline hover:text-gray-900 transition"
                              >
                                {commentsCount} comentários
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 px-2 py-1">
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                type="button"
                                onClick={() => toggleLike(postId)}
                                className={`h-10 rounded-lg text-sm font-extrabold transition flex items-center justify-center gap-2 ${
                                  isLiked ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <svg className={likeFxOn ? 'w-5 h-5 transition-transform scale-110' : 'w-5 h-5 transition-transform'} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 10a2 2 0 012-2h3.586l1.707-1.707A1 1 0 0110.414 6H14a2 2 0 012 2v1.5a2 2 0 01-.586 1.414l-3.5 3.5A2 2 0 0110.5 15H7a2 2 0 01-2-2v-3H4a2 2 0 01-2-2z" />
                                </svg>
                                Gostei
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleComments(postId)}
                                className="h-10 rounded-lg text-sm font-extrabold transition hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a9.61 9.61 0 01-3.545-.668L2 17l1.314-3.286A6.56 6.56 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                                </svg>
                                Comentar
                              </button>
                              <button
                                type="button"
                                className="h-10 rounded-lg text-sm font-extrabold transition hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M15 8a3 3 0 10-2.83-4H7.83a3 3 0 100 2h4.34A3 3 0 0015 8zm-7 9a3 3 0 10-2.83-4H4a1 1 0 100 2h1.17A3 3 0 008 17zm9-4a3 3 0 10-2.83-4H11a1 1 0 100 2h3.17A3 3 0 0017 13z" />
                                </svg>
                                Partilhar
                              </button>
                            </div>
                          </div>

                          {openCommentsPostId && String(openCommentsPostId) === String(postId) ? (
                            <div className="border-t border-gray-200 p-4">
                              {commentsLoadingByPostId[String(postId)] ? (
                                <div className="text-sm text-gray-500">Carregando comentários...</div>
                              ) : (
                                <div className="space-y-3">
                                  {(Array.isArray(commentsByPostId[String(postId)]) ? commentsByPostId[String(postId)] : []).map((c) => (
                                    <div key={c?.id} className="text-sm">
                                      <div className="font-bold text-gray-900">{c?.autor?.nome || c?.nome || 'Usuário'}</div>
                                      <div className="text-gray-700 whitespace-pre-line">{c?.texto || ''}</div>
                                    </div>
                                  ))}
                                  <div className="flex items-center gap-2">
                                    <input
                                      value={commentDraftByPostId[String(postId)] || ''}
                                      onChange={(e) => setCommentDraftByPostId(prev => ({ ...(prev || {}), [String(postId)]: e.target.value }))}
                                      placeholder="Escreva um comentário..."
                                      className="flex-1 px-3 py-2 rounded-full border border-gray-200 text-sm bg-gray-50 focus:bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => sendComment(postId)}
                                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 transition"
                                    >
                                      Enviar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )
                    }

                    if (item?.type === 'empresa' || item?.type === 'anuncio') {
                      const name = item?.empresa || item?.nome || 'Empresa'
                      const subtitle = item?.setor || item?.titulo || (item?.type === 'anuncio' ? 'Patrocinado' : 'Empresa')
                      const companyId = item?.empresaId ?? item?.id
                      const fallbackCompanyTo = companyId !== undefined && companyId !== null
                        ? `/perfil-empresa/${encodeURIComponent(companyId)}`
                        : ''
                      const companyTo = item?.ctaTo || fallbackCompanyTo
                      const companyLabel = item?.ctaLabel || 'Ver página'
                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                {item.avatarUrl ? (
                                  <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={absoluteAssetUrl(item.avatarUrl)} alt={name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  initials(name)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-gray-900 truncate">{name}</div>
                                <div className="text-sm text-gray-600 truncate">{subtitle}</div>
                              </div>
                              {companyTo ? (
                                <Link
                                  to={companyTo}
                                  className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition"
                                >
                                  {companyLabel}
                                </Link>
                              ) : null}
                            </div>
                            {item?.texto ? (
                              <div className="mt-3 text-sm text-gray-800 leading-relaxed whitespace-pre-line">{item.texto}</div>
                            ) : null}
                            {item?.imageUrl ? (
                              <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                <img src={absoluteAssetUrl(item.imageUrl)} alt="" className="w-full max-h-[520px] object-cover" />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }

                    if (item?.type === 'vaga') {
                      const vagaTo = item?.id !== undefined && item?.id !== null
                        ? `/vaga/${encodeURIComponent(item.id)}`
                        : ''
                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">{item?.titulo || 'Vaga'}</div>
                                <div className="text-sm text-gray-600 truncate">{item?.empresa || ''} {item?.localizacao ? `· ${item.localizacao}` : ''}</div>
                              </div>
                              <div className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">Vaga</div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              {item?.salario ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{item.salario}</span>
                              ) : null}
                              {item?.modelo ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{item.modelo}</span>
                              ) : null}
                              {(Array.isArray(item?.tags) ? item.tags : []).slice(0, 6).map(t => (
                                <span key={t} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{t}</span>
                              ))}
                            </div>
                            {vagaTo ? (
                              <div className="mt-4">
                                <Link
                                  to={vagaTo}
                                  className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition"
                                >
                                  Ver detalhes
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }

                    if (item?.type === 'servico') {
                      const servicoTo = item?.id !== undefined && item?.id !== null
                        ? `/servico/${encodeURIComponent(item.id)}`
                        : ''
                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">{item?.titulo || 'Serviço'}</div>
                                <div className="text-sm text-gray-600 truncate">{item?.empresa || item?.nome || ''} {item?.localizacao ? `· ${item.localizacao}` : ''}</div>
                              </div>
                              <div className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">Serviço</div>
                            </div>
                            {item?.texto ? (
                              <div className="mt-3 text-sm text-gray-800 leading-relaxed whitespace-pre-line">{item.texto}</div>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              {item?.categoria ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{item.categoria}</span>
                              ) : null}
                              {(Array.isArray(item?.tags) ? item.tags : []).slice(0, 6).map(t => (
                                <span key={t} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{t}</span>
                              ))}
                            </div>
                            {servicoTo ? (
                              <div className="mt-4">
                                <Link
                                  to={servicoTo}
                                  className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition"
                                >
                                  Ver detalhes
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 text-sm text-gray-700">
                        {item?.type ? String(item.type) : 'Item'}
                      </div>
                    )
                  })}

                  <div ref={feedSentinelRef} className="h-8" />
                </div>
              )}
            </div>
          </main>

          {isAuthenticated ? (
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32 space-y-4">
                {Array.isArray(incomingConnectionRequests) && incomingConnectionRequests.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-900">Solicitações</div>
                      <div className="text-xs text-gray-500">{incomingConnectionRequests.length}</div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {incomingConnectionRequests.slice(0, 5).map((r) => {
                        const rid = r?.requester?.id
                        const rname = r?.requester?.nome || 'Usuário'
                        const ravatar = r?.requester?.foto || r?.requester?.logo || ''
                        return (
                          <div key={r?.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                              {ravatar ? (
                                <div className="w-full h-full rounded-full overflow-hidden">
                                  <img src={absoluteAssetUrl(ravatar)} alt={rname} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                initials(rname)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 truncate">{rname}</div>
                              <div className="text-xs text-gray-600 truncate">Pedido de conexão</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => acceptConnection(r.id, rid)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                              >
                                Aceitar
                              </button>
                              <button
                                onClick={() => rejectConnection(r.id, rid)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                              >
                                Recusar
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-900">Sugestões</div>
                    <div className="text-xs text-gray-500">Para você</div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {feedItemsRemote
                      .filter(it => it?.type === 'pessoa' || it?.type === 'empresa')
                      .slice(0, 5)
                      .map(s => (
                      <div key={s.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                          {s.avatarUrl ? (
                            <div className="w-full h-full rounded-full overflow-hidden">
                              <img src={absoluteAssetUrl(s.avatarUrl)} alt={s.nome} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            initials(s.nome)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{s.nome}</div>
                          <div className="text-xs text-gray-600 truncate">{s.type === 'empresa' ? 'Empresa' : 'Pessoa'}</div>
                        </div>

                        {s.type === 'pessoa' ? (
                          (() => {
                            const state = getConnectionStatus(s.id)
                            const meta = connectionStatusByUserId[String(s.id)] || {}

                            if (state === 'pending_incoming') {
                              return (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => acceptConnection(meta.requestId, s.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                                  >
                                    Aceitar
                                  </button>
                                  <button
                                    onClick={() => rejectConnection(meta.requestId, s.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                                  >
                                    Recusar
                                  </button>
                                </div>
                              )
                            }

                            return (
                              <button
                                onClick={() => {
                                  if (state === 'connected' || state === 'pending_outgoing') return removeConnection(s.id)
                                  return requestConnection(s.id)
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${state === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : state === 'pending_outgoing' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                              >
                                {state === 'connected' ? 'Conectado' : state === 'pending_outgoing' ? 'Pendente' : 'Conectar'}
                              </button>
                            )
                          })()
                        ) : (
                          <button
                            onClick={() => toggleFollow(s.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${isFollowing(s.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}
                          >
                            {isFollowing(s.id) ? 'Seguindo' : 'Seguir'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                  <div className="font-bold text-gray-900">Em alta</div>
                  <div className="mt-3 space-y-2">
                    {[
                      'React',
                      'Design de Logo',
                      'Marketing Digital',
                      'Freelance',
                      'Maputo',
                    ].map(t => (
                      <button
                        key={t}
                        onClick={() => setBusca(t)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 border border-transparent hover:border-gray-200 transition"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes like-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .like-pop {
          animation: like-pop 280ms ease-out;
        }
      `}</style>
    </div>
  )
}

