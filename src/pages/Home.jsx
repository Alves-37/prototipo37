import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { io as ioClient } from 'socket.io-client'

export default function Home() {
   const { user, isAuthenticated, loading } = useAuth()
   const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')

  const [provincia, setProvincia] = useState('')
  const [distrito, setDistrito] = useState('')

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [postText, setPostText] = useState('')
  const [postImageDataUrl, setPostImageDataUrl] = useState('')
  const [postImageName, setPostImageName] = useState('')
  const postImageInputRef = useRef(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [userPosts, setUserPosts] = useState([])

  const [liked, setLiked] = useState(() => ({}))
  const [saved, setSaved] = useState(() => ({}))

  const [openCommentsPostId, setOpenCommentsPostId] = useState(null)
  const [commentsByPostId, setCommentsByPostId] = useState(() => ({}))
  const [commentDraftByPostId, setCommentDraftByPostId] = useState(() => ({}))
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState(() => ({}))

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

    return () => {
      try {
        socket.disconnect()
      } catch {}
    }
  }, [user?.id, openCommentsPostId])

   const FEED_PAGE_SIZE = 12
   const [feedTab, setFeedTab] = useState('todos')
   const [feedPage, setFeedPage] = useState(1)
   const [isLoadingMore, setIsLoadingMore] = useState(false)
   const [feedItemsRemote, setFeedItemsRemote] = useState([])
   const [feedHasMore, setFeedHasMore] = useState(true)
   const [feedIsLoading, setFeedIsLoading] = useState(false)
   const [feedError, setFeedError] = useState('')
   const feedSentinelRef = useRef(null)
   const feedObserverRef = useRef(null)
 
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
      if (it?.type === 'pessoa' || it?.type === 'profissional') {
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
    return 'Vaga'
  }

  const typePill = (t) => {
    if (t === 'profissional') return 'bg-blue-50 text-blue-700 border-blue-100'
    if (t === 'pessoa') return 'bg-blue-50 text-blue-700 border-blue-100'
    if (t === 'empresa') return 'bg-slate-50 text-slate-700 border-slate-200'
    if (t === 'anuncio') return 'bg-amber-50 text-amber-800 border-amber-100'
    if (t === 'post') return 'bg-gray-50 text-gray-700 border-gray-200'
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

      setFeedItemsRemote(prev => (reset ? incoming : [...prev, ...incoming]))
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
      if (feedTab === 'profissionais') return it.type === 'profissional' || it.type === 'pessoa' || it.type === 'empresa'
      if (feedTab === 'vagas') return it.type === 'vaga'
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
        ...(Array.isArray(it.habilidades) ? it.habilidades : []),
        ...(Array.isArray(it.tags) ? it.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [categoria, distrito, feedItemsBase, feedTab, normalizedQuery, provincia])

  const visibleFeedItems = useMemo(() => {
    return feedItemsFiltered
  }, [feedItemsFiltered])

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
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 01-4-.77L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Mensagens
            </button>

            <button
              onClick={openMessages}
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 text-white shadow-sm hover:bg-black transition"
              aria-label="Abrir mensagens"
              title="Mensagens"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 01-4-.77L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>

          <div className="sm:hidden mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'todos', label: 'Tudo' },
              { id: 'profissionais', label: 'Pessoas' },
              { id: 'vagas', label: 'Vagas' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFeedTab(t.id)}
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
                    { id: 'vagas', label: 'Vagas' },
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
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                      {user?.perfil?.foto || user?.foto || user?.logo ? (
                        <img
                          src={absoluteAssetUrl(user?.perfil?.foto || user?.foto || user?.logo)}
                          alt={user?.nome || 'Usuário'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials(user?.nome || 'Visitante')
                      )}
                    </div>

                    <div className="flex-1">
                      <textarea
                        value={postText}
                        onChange={(e) => {
                          setPostText(e.target.value)
                          if (feedError) setFeedError('')
                        }}
                        rows={2}
                        placeholder="No que você está pensando?"
                        className="w-full resize-none outline-none text-gray-900 placeholder:text-gray-500 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 focus:border-blue-300"
                      />

                      {postImageDataUrl ? (
                        <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                          <div className="relative">
                            <img src={postImageDataUrl} alt="" className="w-full max-h-72 object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setPostImageDataUrl('')
                                setPostImageName('')
                                try {
                                  if (postImageInputRef.current) postImageInputRef.current.value = ''
                                } catch {}
                              }}
                              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center"
                              aria-label="Remover foto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {postImageName ? (
                            <div className="px-3 py-2 text-xs text-gray-500 truncate">{postImageName}</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                </div>

                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <input
                        ref={postImageInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={onPickPostImage}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => postImageInputRef.current && postImageInputRef.current.click()}
                        className="px-3 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                        disabled={isPublishing}
                      >
                        Foto
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={publishPost}
                      className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                      disabled={isPublishing || !user || (!postText.trim() && !postImageDataUrl)}
                    >
                      {isPublishing ? 'Publicando...' : 'Publicar'}
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {feedError ? (
              <div className="bg-white border border-red-200 rounded-2xl p-4 text-center text-red-700 shadow-sm">
                {feedError}
              </div>
            ) : null}

            {feedIsLoading && visibleFeedItems.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-600 shadow-sm">
                Carregando feed...
              </div>
            ) : visibleFeedItems.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
                Nenhum resultado para a sua busca.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleFeedItems.map((item) => {
                  const authorName = item.type === 'profissional'
                    ? item.nome
                    : item.type === 'pessoa'
                      ? item.nome
                      : item.type === 'vaga'
                        ? (item.empresaObj?.nome || item.empresa || 'Empresa')
                      : item.type === 'empresa' || item.type === 'anuncio'
                        ? (item.empresa || item.nome || 'Empresa')
                        : item.type === 'post'
                          ? item.nome
                          : 'Cliente'

                  const headline = item.type === 'profissional'
                    ? `${item.titulo} · ${item.localizacao}`
                    : item.type === 'pessoa'
                      ? (item.perfil?.bio ? `${item.perfil.bio}` : 'Membro')
                      : item.type === 'post'
                        ? 'Publicação'
                      : item.type === 'vaga'
                        ? `${item.localizacao || ''}${item.modalidade ? ` · ${item.modalidade}` : ''}`.trim()
                        : item.type === 'empresa' || item.type === 'anuncio'
                          ? `${item.perfil?.setor || item.setor || ''}${(item.perfil?.endereco || item.localizacao) ? ` · ${item.perfil?.endereco || item.localizacao}` : ''}`.trim()
                          : `${getCategoriaIcon(item.categoria)} ${item.localizacao} · Prazo: ${item.prazo}`

                  const likeCount = typeof item?.counts?.likes === 'number'
                    ? item.counts.likes
                    : 12 + ((item._seed || 1) % 90) + (liked[item.id] ? 1 : 0)

                  const commentCount = typeof item?.counts?.comments === 'number'
                    ? item.counts.comments
                    : (item._seed || 1) % 18

                  const timeLabel = item.createdAt ? relativeTimeFromDate(item.createdAt) : relativeTime(item._seed)

                  const itemKey = `${item.type || 'item'}-${item.id ?? item._seed ?? Math.random().toString(36).slice(2)}`

                  if (item.type === 'profissional' || item.type === 'pessoa') {
                    const profileTitle = item.type === 'profissional'
                      ? (item.titulo || item.perfil?.titulo || '')
                      : (item.perfil?.bio || '')
                    const profileLocation = item.localizacao || item.perfil?.endereco || ''
                    const skills = Array.isArray(item.habilidades)
                      ? item.habilidades
                      : (Array.isArray(item.perfil?.habilidades) ? item.perfil.habilidades : [])

                    const connectionState = getConnectionStatus(item.id)
                    const connectionMeta = connectionStatusByUserId[String(item.id)] || {}

                    return (
                      <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-end gap-3">
                            <div className="text-xs text-gray-500">{timeLabel} · Público</div>
                          </div>

                          <div className="mt-3 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                {item.avatarUrl ? (
                                  <img src={absoluteAssetUrl(item.avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
                                ) : (
                                  initials(authorName)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-extrabold text-gray-900 truncate">{authorName}</div>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typePill(item.type)}`}>
                                    {typeLabel(item.type)}
                                  </span>
                                </div>
                                {profileTitle ? (
                                  <div className="text-sm text-gray-700 truncate">{profileTitle}</div>
                                ) : (
                                  <div className="text-sm text-gray-600 truncate">{headline}</div>
                                )}
                                {profileLocation ? (
                                  <div className="text-xs text-gray-500 truncate">{profileLocation}</div>
                                ) : null}
                              </div>
                            </div>

                            {isAuthenticated ? (
                              connectionState === 'pending_incoming' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => acceptConnection(connectionMeta.requestId, item.id)}
                                    className="px-3 py-2 rounded-xl text-xs font-extrabold bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                                  >
                                    Aceitar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => rejectConnection(connectionMeta.requestId, item.id)}
                                    className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                                  >
                                    Recusar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (connectionState === 'connected' || connectionState === 'pending_outgoing') return removeConnection(item.id)
                                    return requestConnection(item.id)
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition ${connectionState === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : connectionState === 'pending_outgoing' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                                >
                                  {connectionState === 'connected'
                                    ? 'Conectado'
                                    : connectionState === 'pending_outgoing'
                                      ? 'Pendente'
                                      : 'Conectar'}
                                </button>
                              )
                            ) : null}
                          </div>

                          {Array.isArray(skills) && skills.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {skills.slice(0, 6).map((s) => (
                                <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-4 flex items-center gap-2">
                            <Link
                              to={`/perfil/${encodeURIComponent(item.id)}`}
                              className="flex-1 text-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:border-blue-200 hover:text-blue-700 transition"
                            >
                              Ver perfil
                            </Link>
                            {isAuthenticated ? (
                              <button
                                type="button"
                                onClick={openMessages}
                                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black transition"
                              >
                                Mensagem
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                              {item.avatarUrl ? (
                                <img src={absoluteAssetUrl(item.avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
                              ) : (
                                initials(authorName)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold text-gray-900 truncate">{authorName}</div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${typePill(item.type)}`}>
                                  {typeLabel(item.type)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 truncate">{headline}</div>
                              <div className="text-xs text-gray-500">{timeLabel} · Público</div>
                            </div>
                          </div>

                          {isAuthenticated && (item.type === 'profissional' || item.type === 'pessoa') ? (
                            (() => {
                              const state = getConnectionStatus(item.id)
                              const meta = connectionStatusByUserId[String(item.id)] || {}

                              if (state === 'pending_incoming') {
                                return (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => acceptConnection(meta.requestId, item.id)}
                                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                                    >
                                      Aceitar
                                    </button>
                                    <button
                                      onClick={() => rejectConnection(meta.requestId, item.id)}
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
                                    if (state === 'connected' || state === 'pending_outgoing') return removeConnection(item.id)
                                    return requestConnection(item.id)
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${state === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : state === 'pending_outgoing' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                                >
                                  {state === 'connected' ? 'Conectado' : state === 'pending_outgoing' ? 'Pendente' : 'Conectar'}
                                </button>
                              )
                            })()
                          ) : null}
                        </div>

                        <div className="mt-3 text-gray-900">
                          {item.type === 'post' ? (
                            <>
                              {item.texto ? (
                                <div className="text-sm text-gray-800 leading-relaxed">{item.texto}</div>
                              ) : null}

                              {item.imageUrl ? (
                                <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                  <img
                                    src={absoluteAssetUrl(item.imageUrl)}
                                    alt=""
                                    className="w-full max-h-96 object-cover"
                                  />
                                </div>
                              ) : null}
                            </>
                          ) : item.type === 'empresa' || item.type === 'anuncio' ? (
                            <>
                              {item.titulo ? (
                                <div className="text-base font-semibold">{item.titulo}</div>
                              ) : null}
                              <div className="text-sm text-gray-800 leading-relaxed mt-1">{item.texto}</div>
                              <div className="mt-3 flex items-center gap-2">
                                <div className="text-xs text-gray-500">
                                  {item.type === 'anuncio' ? 'Publicidade' : 'Publicação'}
                                </div>
                              </div>
                            </>
                          ) : item.type === 'profissional' ? (
                            <>
                              <div className="text-base font-semibold">Disponível para projetos</div>
                              <div className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Disponibilidade:</span> {item.disponibilidade}
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="font-semibold">Faixa:</span> {item.preco}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(Array.isArray(item.habilidades) ? item.habilidades : []).map(h => (
                                  <span key={h} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-base font-semibold">{item.titulo}</div>
                              <div className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Salário:</span> {item.salario}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(Array.isArray(item.tags) ? item.tags : []).map(t => (
                                  <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                          <div>{likeCount} reações</div>
                          <div>{commentCount} comentários</div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 grid grid-cols-4 text-sm">
                        <button
                          onClick={() => toggleLike(item.id)}
                          className={`px-3 py-3 hover:bg-gray-50 transition flex items-center justify-center gap-2 ${liked[item.id] ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-1 7H5a2 2 0 00-2 2v7a2 2 0 002 2h9a2 2 0 002-2l2-7a2 2 0 00-2-2h-2z" />
                          </svg>
                          <span>Curtir</span>
                        </button>
                        <button
                          onClick={() => toggleComments(item.id)}
                          className="px-3 py-3 hover:bg-gray-50 transition flex items-center justify-center gap-2 text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 01-4-.77L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Comentar</span>
                        </button>
                        <button
                          className="px-3 py-3 hover:bg-gray-50 transition flex items-center justify-center gap-2 text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
                          </svg>
                          <span>Partilhar</span>
                        </button>
                        <button
                          onClick={() => toggleSave(item.id)}
                          className={`px-3 py-3 hover:bg-gray-50 transition flex items-center justify-center gap-2 ${saved[item.id] ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
                          </svg>
                          <span>Salvar</span>
                        </button>
                      </div>

                      {item.type === 'post' && openCommentsPostId && String(openCommentsPostId) === String(item.id) ? (
                        <div className="border-t border-gray-200 p-4">
                          {commentsLoadingByPostId[String(item.id)] ? (
                            <div className="text-sm text-gray-500">Carregando comentários...</div>
                          ) : (
                            <div className="space-y-3">
                              {(Array.isArray(commentsByPostId[String(item.id)]) ? commentsByPostId[String(item.id)] : []).map((c) => {
                                const cName = c?.author?.nome || 'Usuário'
                                const cAvatar = c?.author?.foto || c?.author?.logo || ''
                                return (
                                  <div key={c?.id || `${c?.userId}-${c?.createdAt}`} className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                                      {cAvatar ? (
                                        <img src={absoluteAssetUrl(cAvatar)} alt={cName} className="w-full h-full object-cover" />
                                      ) : (
                                        initials(cName)
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2">
                                        <div className="text-xs font-bold text-gray-900">{cName}</div>
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{c?.texto}</div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}

                              {isAuthenticated ? (
                                <div className="flex items-end gap-2 pt-1">
                                  <textarea
                                    rows={1}
                                    value={commentDraftByPostId[String(item.id)] || ''}
                                    onChange={(e) => setCommentDraftByPostId(prev => ({ ...prev, [String(item.id)]: e.target.value }))}
                                    placeholder="Escreva um comentário..."
                                    className="flex-1 resize-none outline-none text-gray-900 placeholder:text-gray-500 rounded-2xl bg-white border border-gray-200 px-4 py-2 focus:border-blue-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => sendComment(item.id)}
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                                  >
                                    Enviar
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="p-4 pt-3 flex items-center gap-2">
                        {item.type === 'profissional' || item.type === 'pessoa' ? (
                          <>
                            <Link
                              to={`/perfil/${encodeURIComponent(item.id)}`}
                              className="flex-1 text-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:border-blue-200 hover:text-blue-700 transition"
                            >
                              Ver perfil
                            </Link>
                            <button
                              onClick={openMessages}
                              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                            >
                              Mensagem
                            </button>
                          </>
                        ) : item.type === 'post' ? (
                          <div className="w-full" />
                        ) : item.type === 'empresa' ? (
                          <>
                            <Link
                              to={`/perfil-empresa/${encodeURIComponent(item.id)}`}
                              className="flex-1 text-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:border-slate-300 hover:text-slate-900 transition"
                            >
                              Ver página
                            </Link>
                            <button
                              onClick={openMessages}
                              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black transition"
                            >
                              Contactar
                            </button>
                          </>
                        ) : item.type === 'anuncio' ? (
                          <>
                            <Link
                              to={item.ctaTo}
                              className="flex-1 text-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:border-slate-300 hover:text-slate-900 transition"
                            >
                              {item.ctaLabel}
                            </Link>
                            <button
                              onClick={openMessages}
                              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black transition"
                            >
                              Contactar
                            </button>
                          </>
                        ) : item.type === 'vaga' ? (
                          <>
                            <Link
                              to="/vagas"
                              className="flex-1 text-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:border-blue-200 hover:text-blue-700 transition"
                            >
                              Ver vagas
                            </Link>
                            <button
                              onClick={() => navigate('/candidaturas')}
                              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                            >
                              Candidatar
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/chamados"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:border-blue-200 hover:text-blue-700 transition"
                            >
                              Ver chamados
                            </Link>
                            <button
                              onClick={openMessages}
                              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                            >
                              Propor
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div ref={feedSentinelRef} className="h-8" />
                <div className="text-center text-sm text-gray-500 pb-2">
                  {isLoadingMore
                    ? 'Carregando mais...'
                    : !feedHasMore
                      ? 'Você chegou ao fim.'
                      : 'Role para carregar mais'}
                </div>
              </div>
            )}
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
                                <img src={absoluteAssetUrl(ravatar)} alt={rname} className="w-full h-full object-cover" />
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
                            <img src={absoluteAssetUrl(s.avatarUrl)} alt={s.nome} className="w-full h-full object-cover" />
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
    </div>
  )
}

