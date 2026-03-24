import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { io as ioClient } from 'socket.io-client'
import { mensagemService } from '../services/mensagemService'
import userfotoPlaceholder from '../assets/userfoto.avif'
import { normalizeExternalUrl } from '../services/url'
import WelcomeNevuModal from '../components/WelcomeNevuModal'

/** Texto longo no feed: usar “Ver mais” (linhas ou tamanho). */
function shouldTruncateFeedText(text, charThreshold = 220, lineThreshold = 5) {
  const t = String(text || '').trim()
  if (!t) return false
  if (t.length > charThreshold) return true
  const lines = t.split(/\r\n|\r|\n/).length
  return lines > lineThreshold
}

export default function Home() {
   const { user, isAuthenticated, loading } = useAuth()
   const navigate = useNavigate()
   const location = useLocation()
  const HOME_FILTERS_KEY = 'home_filters'

  const TEXT_POST_BG_KEY = 'text_post_bg_by_id'

  const TEXT_POST_BACKGROUNDS = useMemo(() => (
    [
      { key: 'sunset', style: { backgroundImage: 'linear-gradient(135deg, #ff512f 0%, #f09819 100%)' } },
      { key: 'ocean', style: { backgroundImage: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' } },
      { key: 'violet', style: { backgroundImage: 'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)' } },
      { key: 'mint', style: { backgroundImage: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' } },
      { key: 'night', style: { backgroundImage: 'linear-gradient(135deg, #232526 0%, #414345 100%)' } },
      { key: 'sky', style: { backgroundImage: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' } },
    ]
  ), [])

  const [textPostBgById, setTextPostBgById] = useState(() => {
    try {
      const raw = localStorage.getItem(TEXT_POST_BG_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })

  const persistTextPostBgById = (next) => {
    try {
      localStorage.setItem(TEXT_POST_BG_KEY, JSON.stringify(next || {}))
    } catch {}
  }

  const hashStringToInt = (str) => {
    try {
      const s = String(str || '')
      let h = 0
      for (let i = 0; i < s.length; i += 1) {
        h = ((h << 5) - h) + s.charCodeAt(i)
        h |= 0
      }
      return Math.abs(h)
    } catch {
      return 0
    }
  }

  const pickDefaultTextBgKeyForPostId = (postId) => {
    const list = Array.isArray(TEXT_POST_BACKGROUNDS) ? TEXT_POST_BACKGROUNDS : []
    if (!list.length) return ''
    const idx = hashStringToInt(postId) % list.length
    return list[idx]?.key || ''
  }

  const getTextBgKeyForPostId = (postId) => {
    const id = String(postId || '')
    const stored = textPostBgById && typeof textPostBgById === 'object' ? textPostBgById[id] : ''
    const found = TEXT_POST_BACKGROUNDS.some(b => b.key === stored)
    return found ? stored : pickDefaultTextBgKeyForPostId(id)
  }

  const getTextBgStyleForKey = (bgKey) => {
    const list = Array.isArray(TEXT_POST_BACKGROUNDS) ? TEXT_POST_BACKGROUNDS : []
    const found = list.find(b => b.key === bgKey)
    return found?.style || {}
  }

  const defaultAvatarUrl = userfotoPlaceholder
  const fallbackAvatarUrl = '/nevu.png'

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

  const categorias = useMemo(() => ([]), [])

  const [provincia, setProvincia] = useState(() => String(initialHomeFilters.provincia || ''))
  const [distrito, setDistrito] = useState(() => String(initialHomeFilters.distrito || ''))

  const provincias = useMemo(() => ([]), [])
  const distritosDisponiveis = useMemo(() => ([]), [provincia])

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [postText, setPostText] = useState('')
  const [postImageDataUrl, setPostImageDataUrl] = useState('')
  const [postImageMime, setPostImageMime] = useState('')
  const [postImageName, setPostImageName] = useState('')
  const [postMediaFile, setPostMediaFile] = useState(null)
  const [postMediaFiles, setPostMediaFiles] = useState([]) // até 5 arquivos
  const [postMediaPreviews, setPostMediaPreviews] = useState([]) // URLs de preview
  const postMediaObjectUrlRef = useRef('')
  const postImageInputRef = useRef(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const composerTextareaRef = useRef(null)
  const [composerHeight, setComposerHeight] = useState(null)
  const [composerOverflowY, setComposerOverflowY] = useState('hidden')
  const [composerTextBgKey, setComposerTextBgKey] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishProgressText, setPublishProgressText] = useState('')
  const [userPosts, setUserPosts] = useState([])
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem('post_saved')
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })

  const REACTION_TYPES = [
    { type: 'like', emoji: '👍', label: 'Gosto', color: 'text-blue-600' },
    { type: 'love', emoji: '❤️', label: 'Adoro', color: 'text-red-500' },
    { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
    { type: 'wow', emoji: '😮', label: 'Uau', color: 'text-yellow-500' },
    { type: 'sad', emoji: '😢', label: 'Triste', color: 'text-yellow-500' },
    { type: 'angry', emoji: '😡', label: 'Grrr', color: 'text-orange-600' },
  ]

  const getReactionInfo = (type) => {
    return REACTION_TYPES.find(r => r.type === (type || 'like').toLowerCase()) || REACTION_TYPES[0]
  }

  const [openReactionPickerPostId, setOpenReactionPickerPostId] = useState(null)
  const reactionPickerTimeoutRef = useRef(null)

  const [reactionsByPostId, setReactionsByPostId] = useState(() => ({}))
  const [myReactionByPostId, setMyReactionByPostId] = useState(() => ({}))

  const POST_MENUS_KEY = 'post_menu_prefs'
  const [postMenuOpenById, setPostMenuOpenById] = useState(() => ({}))
  const [postHiddenById, setPostHiddenById] = useState(() => {
    try {
      const raw = localStorage.getItem(POST_MENUS_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      const map = parsed?.hiddenPosts
      return map && typeof map === 'object' ? map : {}
    } catch {
      return {}
    }
  })
  const [postSnoozedUserUntilById, setPostSnoozedUserUntilById] = useState(() => {
    try {
      const raw = localStorage.getItem(POST_MENUS_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      const map = parsed?.snoozedUsers
      return map && typeof map === 'object' ? map : {}
    } catch {
      return {}
    }
  })
  const [postHiddenAuthorById, setPostHiddenAuthorById] = useState(() => {
    try {
      const raw = localStorage.getItem(POST_MENUS_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      const map = parsed?.hiddenAuthors
      return map && typeof map === 'object' ? map : {}
    } catch {
      return {}
    }
  })
  const [postNotifyById, setPostNotifyById] = useState(() => {
    try {
      const raw = localStorage.getItem(POST_MENUS_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      const map = parsed?.notifyPosts
      return map && typeof map === 'object' ? map : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(POST_MENUS_KEY, JSON.stringify({
        hiddenPosts: postHiddenById,
        snoozedUsers: postSnoozedUserUntilById,
        hiddenAuthors: postHiddenAuthorById,
        notifyPosts: postNotifyById,
      }))
    } catch {}
  }, [postHiddenById, postSnoozedUserUntilById, postHiddenAuthorById, postNotifyById])

  useEffect(() => {
    const onDocClick = () => setPostMenuOpenById({})
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const [likeFx, setLikeFx] = useState(() => ({}))
  const likeFxTimeoutsRef = useRef({})

  const [openCommentsPostId, setOpenCommentsPostId] = useState(null)
  const [commentsByPostId, setCommentsByPostId] = useState(() => ({}))
  const [commentDraftByPostId, setCommentDraftByPostId] = useState(() => ({}))
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState(() => ({}))
  const [sendingCommentByPostId, setSendingCommentByPostId] = useState(() => ({}))
  const [commentMenuOpenById, setCommentMenuOpenById] = useState(() => ({}))
  const [commentLikesByCommentId, setCommentLikesByCommentId] = useState(() => ({}))
  const [commentLikedByMeByCommentId, setCommentLikedByMeByCommentId] = useState(() => ({}))
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [modalPostId, setModalPostId] = useState(null)

  const postCardRefs = useRef({})

  const viewedPostsRef = useRef(new Set())
  const registerPostView = async (postId) => {
    try {
      if (postId === undefined || postId === null) return
      const key = String(postId)
      if (viewedPostsRef.current.has(key)) return
      viewedPostsRef.current.add(key)
      await api.post(`/posts/${encodeURIComponent(postId)}/view`)
    } catch {
      // silent
    }
  }

  const [showMobileConnections, setShowMobileConnections] = useState(false)

  const [editingComment, setEditingComment] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(null)

  const [editingVendaComment, setEditingVendaComment] = useState(null)
  const [editingVendaCommentText, setEditingVendaCommentText] = useState('')
  const [confirmDeleteVendaComment, setConfirmDeleteVendaComment] = useState(null)

  const REACTION_TYPES_PRODUTO = [
    { type: 'like', emoji: '👍', label: 'Gosto', color: 'text-blue-600' },
    { type: 'love', emoji: '❤️', label: 'Adoro', color: 'text-red-500' },
    { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
    { type: 'wow', emoji: '😮', label: 'Uau', color: 'text-yellow-500' },
    { type: 'sad', emoji: '😢', label: 'Triste', color: 'text-yellow-500' },
    { type: 'angry', emoji: '😡', label: 'Grrr', color: 'text-orange-600' },
  ]
  const reactionEmojiProduto = (t) => {
    const r = REACTION_TYPES_PRODUTO.find(x => x.type === String(t || '').toLowerCase())
    return r ? r.emoji : '👍'
  }
  const reactionLabelProduto = (t) => {
    const r = REACTION_TYPES_PRODUTO.find(x => x.type === String(t || '').toLowerCase())
    return r ? r.label : 'Gosto'
  }

  const [openCommentsVendaId, setOpenCommentsVendaId] = useState(null)
  const [commentsByVendaId, setCommentsByVendaId] = useState(() => ({}))
  const [commentDraftByVendaId, setCommentDraftByVendaId] = useState(() => ({}))
  const [commentFileByVendaId, setCommentFileByVendaId] = useState(() => ({}))
  const [commentsLoadingByVendaId, setCommentsLoadingByVendaId] = useState(() => ({}))
  const [openReactionPickerByVendaId, setOpenReactionPickerByVendaId] = useState(() => ({}))

  const openCommentsVendaIdRef = useRef(null)
  useEffect(() => {
    openCommentsVendaIdRef.current = openCommentsVendaId
  }, [openCommentsVendaId])

  const currentUserIdRef = useRef(null)
  useEffect(() => {
    currentUserIdRef.current = user?.id ?? user?._id ?? null
  }, [user?.id, user?._id])

  const isVendaCommentAuthor = (comment) => {
    try {
      const myId = currentUserIdRef.current
      if (myId === undefined || myId === null) return false
      const authorId = comment?.userId ?? comment?.author?.id
      if (authorId === undefined || authorId === null) return false
      return String(myId) === String(authorId)
    } catch {
      return false
    }
  }

  const beginEditVendaComment = (vendaId, comment) => {
    if (!comment) return
    setEditingVendaComment({ vendaId, commentId: comment.id })
    setEditingVendaCommentText(String(comment.texto || ''))
  }

  const cancelEditVendaComment = () => {
    setEditingVendaComment(null)
    setEditingVendaCommentText('')
  }

  const saveEditVendaComment = async (vendaId, commentId) => {
    if (!isAuthenticated) return
    const text = String(editingVendaCommentText || '').trim()
    if (!text) return

    try {
      const { data } = await api.put(`/produtos/${encodeURIComponent(vendaId)}/comments/${encodeURIComponent(commentId)}`, { texto: text })
      setCommentsByVendaId(prev => {
        const next = { ...(prev || {}) }
        const list = Array.isArray(next[String(vendaId)]) ? next[String(vendaId)] : []
        next[String(vendaId)] = list.map(c => (String(c?.id) === String(commentId) ? { ...c, ...data } : c))
        return next
      })
      cancelEditVendaComment()
    } catch (e) {
      console.error('Erro ao editar comentário do produto:', e)
      setFeedError('Erro ao editar comentário')
    }
  }

  const requestDeleteVendaComment = (vendaId, commentId) => {
    if (!isAuthenticated) return
    setConfirmDeleteVendaComment({ vendaId, commentId })
  }

  const confirmDeleteVendaCommentNow = async () => {
    if (!isAuthenticated) return
    if (!confirmDeleteVendaComment?.vendaId || !confirmDeleteVendaComment?.commentId) return
    const { vendaId, commentId } = confirmDeleteVendaComment

    try {
      await api.delete(`/produtos/${encodeURIComponent(vendaId)}/comments/${encodeURIComponent(commentId)}`)

      setCommentsByVendaId(prev => {
        const next = { ...(prev || {}) }
        const list = Array.isArray(next[String(vendaId)]) ? next[String(vendaId)] : []
        next[String(vendaId)] = list.filter(c => String(c?.id) !== String(commentId))
        return next
      })

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it?.id) !== String(vendaId)) return it
        const counts = { ...(it.counts || {}) }
        counts.comments = Math.max(0, (typeof counts.comments === 'number' ? counts.comments : 0) - 1)
        return { ...it, counts }
      }))
    } catch (e) {
      console.error('Erro ao eliminar comentário do produto:', e)
      setFeedError('Erro ao eliminar comentário')
    } finally {
      setConfirmDeleteVendaComment(null)
    }
  }

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
        setMyReactionByPostId(prev => ({ ...prev, [postId]: evt?.liked ? 'like' : null }))
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

    socket.on('venda:new', (evt) => {
      const item = evt?.item
      if (!item || (item.type !== 'venda' && item.type !== 'produto')) return
      const id = item?.id
      if (id === undefined || id === null) return

      setFeedItemsRemote(prev => {
        const exists = prev.some(p => (p?.type === 'venda' || p?.type === 'produto') && String(p?.id) === String(id))
        if (exists) return prev
        return [item, ...prev]
      })
    })

    socket.on('venda:update', (evt) => {
      const item = evt?.item
      const vendaId = evt?.vendaId ?? item?.id
      if (!vendaId) return

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it?.id) !== String(vendaId)) return it
        return { ...it, ...(item || {}) }
      }))
    })

    socket.on('venda:delete', (evt) => {
      const vendaId = evt?.vendaId
      if (!vendaId) return
      setFeedItemsRemote(prev => prev.filter(it => !((it?.type === 'venda' || it?.type === 'produto') && String(it?.id) === String(vendaId))))
    })

    socket.on('produto:reaction', (evt) => {
      const produtoId = evt?.produtoId
      if (produtoId === undefined || produtoId === null) return
      const counts = evt?.counts
      const total = typeof counts?.total === 'number' ? counts.total : undefined
      const byType = counts?.byType && typeof counts.byType === 'object' ? counts.byType : undefined

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it?.id) !== String(produtoId)) return it
        const nextCounts = { ...(it.counts || {}) }
        if (typeof total === 'number') nextCounts.reactions = total
        if (byType) nextCounts.reactionsByType = byType

        const myId = currentUserIdRef.current
        if (myId !== undefined && myId !== null && String(evt?.userId) === String(myId)) {
          return { ...it, myReactionType: evt?.reacted ? (evt?.type || null) : null, counts: nextCounts }
        }

        return { ...it, counts: nextCounts }
      }))
    })

    socket.on('produto:comment:new', (evt) => {
      const produtoId = evt?.produtoId
      if (produtoId === undefined || produtoId === null) return
      const comment = evt?.comment
      if (!comment) return

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it?.id) !== String(produtoId)) return it
        const nextCounts = { ...(it.counts || {}) }
        nextCounts.comments = (typeof nextCounts.comments === 'number' ? nextCounts.comments : 0) + 1
        return { ...it, counts: nextCounts }
      }))

      const openVendaId = openCommentsVendaIdRef.current
      if (openVendaId && String(openVendaId) === String(produtoId)) {
        setCommentsByVendaId(prev => {
          const key = String(produtoId)
          const current = Array.isArray(prev[key]) ? prev[key] : []
          if (current.some(c => String(c?.id) === String(comment?.id))) return prev
          return { ...(prev || {}), [key]: [...current, comment] }
        })
      }
    })

    socket.on('produto:comment:update', (evt) => {
      const produtoId = evt?.produtoId
      const comment = evt?.comment
      if (produtoId === undefined || produtoId === null) return
      if (!comment) return

      const openVendaId = openCommentsVendaIdRef.current
      if (openVendaId && String(openVendaId) === String(produtoId)) {
        setCommentsByVendaId(prev => {
          const key = String(produtoId)
          const current = Array.isArray(prev[key]) ? prev[key] : []
          return {
            ...(prev || {}),
            [key]: current.map(c => (String(c?.id) === String(comment?.id) ? { ...c, ...comment } : c)),
          }
        })
      }
    })

    socket.on('produto:comment:delete', (evt) => {
      const produtoId = evt?.produtoId
      const commentId = evt?.commentId
      if (produtoId === undefined || produtoId === null) return
      if (commentId === undefined || commentId === null) return

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it?.id) !== String(produtoId)) return it
        const counts = { ...(it.counts || {}) }
        counts.comments = Math.max(0, (typeof counts.comments === 'number' ? counts.comments : 0) - 1)
        return { ...it, counts }
      }))

      const openVendaId = openCommentsVendaIdRef.current
      if (openVendaId && String(openVendaId) === String(produtoId)) {
        setCommentsByVendaId(prev => {
          const key = String(produtoId)
          const current = Array.isArray(prev[key]) ? prev[key] : []
          return {
            ...(prev || {}),
            [key]: current.filter(c => String(c?.id) !== String(commentId)),
          }
        })
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
  }, [isAuthenticated, openCommentsPostId])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessagesCount(0)
      return
    }
    refreshUnreadMessagesCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

   const FEED_PAGE_SIZE = 1000 // Aumentado para evitar limites visíveis
   const [feedTab, setFeedTab] = useState(() => {
     const saved = String(initialHomeFilters.feedTab || 'todos')
     const allowed = new Set(['todos', 'profissionais', 'empresas', 'vagas', 'servicos', 'vendas'])
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
   const feedAbortControllerRef = useRef(null)
   const feedRequestSeqRef = useRef(0)

  const feedItemsFiltered = useMemo(() => {
    return Array.isArray(feedItemsRemote) ? feedItemsRemote : []
  }, [feedItemsRemote])

  const visibleFeedItems = useMemo(() => {
    return Array.isArray(feedItemsFiltered) ? feedItemsFiltered : []
  }, [feedItemsFiltered])

  const [showImageViewer, setShowImageViewer] = useState(false)
  const [viewerUrl, setViewerUrl] = useState('')
  const [viewerPostId, setViewerPostId] = useState(null)

  const [viewerImageIndex, setViewerImageIndex] = useState(0)
  const openImageViewer = (url, postId = null, imageIndex = 0) => {
    setViewerUrl(url)
    setViewerPostId(postId)
    setViewerImageIndex(imageIndex)
    setShowImageViewer(true)
  }

  const closeImageViewer = () => {
    setShowImageViewer(false)
    setViewerUrl('')
    setViewerPostId(null)
    setViewerImageIndex(0)
  }

  const [feedTextExpanded, setFeedTextExpanded] = useState({})

  const renderFeedExpandableParagraph = useCallback((storageKey, text, opts = {}) => {
    const t = String(text || '').trim()
    if (!t) return null
    const key = String(storageKey)
    const need = shouldTruncateFeedText(
      t,
      typeof opts.charThreshold === 'number' ? opts.charThreshold : 220,
      typeof opts.lineThreshold === 'number' ? opts.lineThreshold : 5,
    )
    const expanded = !!feedTextExpanded[key]
    const {
      textClassName = 'text-[15px] text-gray-900 leading-relaxed',
      lineClamp = 'line-clamp-4',
      buttonClassName = 'mt-1 text-sm font-semibold text-blue-700 hover:underline',
      outerClassName = 'mt-3',
    } = opts
    return (
      <div className={outerClassName}>
        <div className={`${textClassName} whitespace-pre-line ${need && !expanded ? lineClamp : ''}`}>{t}</div>
        {need ? (
          <button
            type="button"
            onClick={() => setFeedTextExpanded((p) => ({ ...p, [key]: !p[key] }))}
            className={buttonClassName}
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        ) : null}
      </div>
    )
  }, [feedTextExpanded])

  const deepLinkLastRequestedPageRef = useRef({})
  const deepLinkLoadMoreAttemptsRef = useRef({})

  useEffect(() => {
    try {
      const search = String(location?.search || '')
      if (!search) return
      const params = new URLSearchParams(search)
      const tab = params.get('tab')
      const vendaId = params.get('venda')
      if (tab !== 'vendas' || !vendaId) return

      if (feedTab !== 'vendas') {
        setFeedTab('vendas')
      }

      if (handledDeepLinkVendaIdRef.current && String(handledDeepLinkVendaIdRef.current) === String(vendaId)) {
        return
      }

      const attemptKey = String(vendaId)
      const attempts = Number(deepLinkLoadMoreAttemptsRef.current?.[attemptKey] || 0)
      const el = vendaCardRefs.current?.[attemptKey]
      if (el && typeof el.scrollIntoView === 'function') {
        handledDeepLinkVendaIdRef.current = vendaId
        setTimeout(() => {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } catch {
            try { el.scrollIntoView(true) } catch {}
          }
        }, 50)
        return
      }

      if (attempts < 6 && feedHasMore && !feedIsLoading && !isLoadingMore) {
        deepLinkLoadMoreAttemptsRef.current = { ...(deepLinkLoadMoreAttemptsRef.current || {}), [attemptKey]: attempts + 1 }
        setFeedPage(p => p + 1)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.search, feedTab, feedHasMore, feedIsLoading, isLoadingMore])

  const [connectionStatusByUserId, setConnectionStatusByUserId] = useState(() => ({}))
  const [incomingConnectionRequests, setIncomingConnectionRequests] = useState(() => ([]))

  const [publicUserById, setPublicUserById] = useState(() => ({}))
  const publicUserLoadingIdsRef = useRef(new Set())

  const connectedCount = useMemo(() => (
    Object.values(connectionStatusByUserId || {}).filter(v => v?.status === 'connected').length
  ), [connectionStatusByUserId])

  useEffect(() => {
    if (feedTab !== 'profissionais') return

    const ids = (Array.isArray(feedItemsRemote) ? feedItemsRemote : [])
      .filter(it => it?.type === 'pessoa' || it?.type === 'profissional')
      .map(it => it?.id)
      .filter(id => id !== undefined && id !== null)

    if (!ids.length) return

    let cancelled = false
    const uniqueIds = Array.from(new Set(ids.map(v => String(v))))
    const toFetch = uniqueIds.filter(id => !publicUserById[id] && !publicUserLoadingIdsRef.current.has(id))
    if (!toFetch.length) return

    toFetch.forEach(id => publicUserLoadingIdsRef.current.add(id))

    Promise.all(
      toFetch.map(async (id) => {
        try {
          const resp = await api.get(`/public/users/${encodeURIComponent(id)}`)
          return { id, data: resp?.data || null }
        } catch (e) {
          return { id, data: null }
        }
      })
    ).then((results) => {
      if (cancelled) return
      setPublicUserById(prev => {
        const next = { ...(prev || {}) }
        results.forEach(r => {
          next[String(r.id)] = r.data
        })
        return next
      })
    }).finally(() => {
      toFetch.forEach(id => publicUserLoadingIdsRef.current.delete(id))
    })

    return () => { cancelled = true }
  }, [feedTab, publicUserById, feedItemsRemote])

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

  const isFollowing = useCallback((targetId) => {
    try {
      if (targetId === undefined || targetId === null) return false
      const id = String(targetId)
      const list = Array.isArray(following) ? following : []
      return list.map(String).includes(id)
    } catch {
      return false
    }
  }, [following])

  const toggleFollow = useCallback((targetId) => {
    if (targetId === undefined || targetId === null) return
    const id = String(targetId)
    setFollowing(prev => {
      const list = Array.isArray(prev) ? prev.map(String) : []
      if (list.includes(id)) return list.filter(x => x !== id)
      return [...list, id]
    })
  }, [])
 
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

  const requestConnection = useCallback(async (targetId) => {
    if (!isAuthenticated) return
    if (targetId === undefined || targetId === null) return
    try {
      upsertConnectionStatus(targetId, { status: 'pending_outgoing' })
      const { data } = await api.post(`/connections/${encodeURIComponent(targetId)}`)
      upsertConnectionStatus(targetId, { status: 'pending_outgoing', requestId: data?.requestId })
      fetchIncomingRequests()
    } catch (err) {
      console.error('Erro ao solicitar conexão:', err)
      upsertConnectionStatus(targetId, { status: 'none', requestId: undefined })
    }
  }, [isAuthenticated])

  const removeConnection = useCallback(async (targetId) => {
    if (!isAuthenticated) return
    if (targetId === undefined || targetId === null) return
    try {
      upsertConnectionStatus(targetId, { status: 'none' })
      await api.delete(`/connections/${encodeURIComponent(targetId)}`)
      upsertConnectionStatus(targetId, { status: 'none', requestId: undefined })
      fetchIncomingRequests()
    } catch (err) {
      console.error('Erro ao remover conexão:', err)
      fetchConnectionStatus(targetId)
    }
  }, [isAuthenticated])

  const acceptConnection = useCallback(async (requestId, requesterId) => {
    if (!isAuthenticated) return
    if (!requestId) return
    try {
      await api.post(`/connections/${encodeURIComponent(requestId)}/accept`)
      if (requesterId !== undefined && requesterId !== null) {
        upsertConnectionStatus(requesterId, { status: 'connected', requestId: undefined })
      }
      fetchIncomingRequests()
    } catch (err) {
      console.error('Erro ao aceitar conexão:', err)
    }
  }, [isAuthenticated])

  const rejectConnection = useCallback(async (requestId, requesterId) => {
    if (!isAuthenticated) return
    if (!requestId) return
    try {
      await api.post(`/connections/${encodeURIComponent(requestId)}/reject`)
      if (requesterId !== undefined && requesterId !== null) {
        upsertConnectionStatus(requesterId, { status: 'none', requestId: undefined })
      }
      fetchIncomingRequests()
    } catch (err) {
      console.error('Erro ao rejeitar conexão:', err)
    }
  }, [isAuthenticated])

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

  const toggleLike = async (id, type = 'like') => {
    if (!isAuthenticated) return
    const postId = String(id)
    
    // Se for o mesmo tipo, remove (unlike), senão atualiza/adiciona
    const currentReaction = myReactionByPostId[postId]
    const isRemoving = currentReaction === type

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
      const { data } = await api.post(`/posts/${id}/like`, { type: isRemoving ? null : type })
      const nextLiked = !!data?.liked
      const nextType = data?.type || null
      const nextLikesCount = typeof data?.likes === 'number' ? data.likes : undefined

      setMyReactionByPostId(prev => ({ ...prev, [postId]: nextType }))
      
      // Se estivermos num modal, atualizar o post do modal também se necessário
      // (embora usemos visibleFeedItems, é bom garantir)

      setFeedItemsRemote(prev => prev.map(it => {
        if (it?.type !== 'post' || String(it.id) !== postId) return it
        const counts = { ...(it.counts || {}) }
        if (typeof nextLikesCount === 'number') {
          counts.likes = nextLikesCount
        }
        return { ...it, likedByMe: nextLiked, myReaction: nextType, counts }
      }))
    } catch (err) {
      console.error('Erro ao reagir:', err)
    }
  }

  const handleLikeMouseEnter = (postId) => {
    if (reactionPickerTimeoutRef.current) clearTimeout(reactionPickerTimeoutRef.current)
    reactionPickerTimeoutRef.current = setTimeout(() => {
      setOpenReactionPickerPostId(postId)
    }, 600) // 600ms de hover para abrir reações
  }

  const handleLikeMouseLeave = () => {
    if (reactionPickerTimeoutRef.current) clearTimeout(reactionPickerTimeoutRef.current)
    reactionPickerTimeoutRef.current = setTimeout(() => {
      setOpenReactionPickerPostId(null)
    }, 400)
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
    
    // Versão Facebook Desktop: abre modal em vez de inline
    setModalPostId(postId)
    setShowCommentModal(true)

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

    if (sendingCommentByPostId[id]) return
    setSendingCommentByPostId(prev => ({ ...(prev || {}), [id]: true }))

    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { texto: draft })
      setCommentDraftByPostId(prev => ({ ...prev, [id]: '' }))

      const created = data && typeof data === 'object' ? data : null
      if (created) {
        setCommentsByPostId(prev => {
          const current = Array.isArray(prev[id]) ? prev[id] : []
          if (current.some(c => String(c?.id) === String(created?.id))) return prev
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
    } finally {
      setSendingCommentByPostId(prev => ({ ...(prev || {}), [id]: false }))
    }
  }

  useEffect(() => {
    const onDocClick = () => setCommentMenuOpenById({})
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const toggleCommentMenu = useCallback((postId, commentId) => {
    if (postId === undefined || postId === null) return
    if (commentId === undefined || commentId === null) return
    const key = `${String(postId)}:${String(commentId)}`
    setCommentMenuOpenById(prev => ({ ...(prev || {}), [key]: !prev?.[key] }))
  }, [])

  const toggleCommentLike = useCallback(async (postId, commentId) => {
    if (!isAuthenticated) return
    if (!postId || !commentId) return
    try {
      const { data } = await api.post(`/posts/${postId}/comments/${commentId}/like`)
      const nextLiked = !!data?.liked
      const nextLikesCount = typeof data?.likes === 'number' ? data.likes : 0

      setCommentLikedByMeByCommentId(prev => ({ ...prev, [String(commentId)]: nextLiked }))
      setCommentLikesByCommentId(prev => ({ ...prev, [String(commentId)]: nextLikesCount }))

      // Update in the comments list too if needed
      setCommentsByPostId(prev => {
        const list = prev[String(postId)]
        if (!Array.isArray(list)) return prev
        const nextList = list.map(c => {
          if (String(c.id) === String(commentId)) {
            return {
              ...c,
              likedByMe: nextLiked,
              likesCount: nextLikesCount
            }
          }
          return c
        })
        return { ...prev, [String(postId)]: nextList }
      })
    } catch (err) {
      console.error('Erro ao curtir comentário:', err)
    }
  }, [isAuthenticated])

  const closeCommentMenu = useCallback((postId, commentId) => {
    if (postId === undefined || postId === null) return
    if (commentId === undefined || commentId === null) return
    const key = `${String(postId)}:${String(commentId)}`
    setCommentMenuOpenById(prev => {
      const next = { ...(prev || {}) }
      delete next[key]
      return next
    })
  }, [])

  const toggleVendaComments = async (vendaId) => {
    const id = String(vendaId)
    if (openCommentsVendaId && String(openCommentsVendaId) === id) {
      setOpenCommentsVendaId(null)
      return
    }
    setOpenCommentsVendaId(vendaId)

    if (commentsByVendaId[id]) return
    setCommentsLoadingByVendaId(prev => ({ ...prev, [id]: true }))
    try {
      const { data } = await api.get(`/produtos/${encodeURIComponent(vendaId)}/comments`)
      const list = Array.isArray(data?.comments) ? data.comments : []
      setCommentsByVendaId(prev => ({ ...prev, [id]: list }))
    } catch (err) {
      console.error('Erro ao carregar comentários do produto:', err)
      setCommentsByVendaId(prev => ({ ...prev, [id]: [] }))
    } finally {
      setCommentsLoadingByVendaId(prev => ({ ...prev, [id]: false }))
    }
  }

  const onPickVendaCommentFile = (vendaId, e) => {
    const file = e?.target?.files && e.target.files[0]
    if (!file) return

    const okImage = String(file.type || '').startsWith('image/')
    const okAudio = String(file.type || '').startsWith('audio/')
    if (!okImage && !okAudio) {
      setFeedError('Anexo inválido. Use imagem ou áudio.')
      try { e.target.value = '' } catch {}
      return
    }

    setCommentFileByVendaId(prev => ({ ...(prev || {}), [String(vendaId)]: file }))
  }

  const clearVendaCommentFile = (vendaId) => {
    setCommentFileByVendaId(prev => {
      const next = { ...(prev || {}) }
      delete next[String(vendaId)]
      return next
    })
  }

  const sendVendaComment = async (vendaId) => {
    if (!isAuthenticated) return
    const id = String(vendaId)
    const draft = (commentDraftByVendaId[id] || '').trim()
    if (!draft) return

    try {
      const fd = new FormData()
      fd.append('texto', draft)

      const file = commentFileByVendaId[id]
      if (file) fd.append('anexo', file)

      const { data } = await api.post(`/produtos/${encodeURIComponent(vendaId)}/comments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setCommentDraftByVendaId(prev => ({ ...(prev || {}), [id]: '' }))
      clearVendaCommentFile(vendaId)

      const created = data && typeof data === 'object' ? data : null
      if (created) {
        setCommentsByVendaId(prev => {
          const current = Array.isArray(prev[id]) ? prev[id] : []
          if (current.some(c => String(c?.id) === String(created?.id))) return prev
          return { ...(prev || {}), [id]: [...current, created] }
        })
      }

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it.id) !== id) return it
        const counts = { ...(it.counts || {}) }
        counts.comments = (typeof counts.comments === 'number' ? counts.comments : 0) + 1
        return { ...it, counts }
      }))
    } catch (err) {
      console.error('Erro ao comentar produto:', err)
      setFeedError('Não foi possível comentar agora.')
    }
  }

  const reactToVenda = async (vendaId, type) => {
    if (!isAuthenticated) return
    const id = String(vendaId)
    const nextType = String(type || 'like').toLowerCase()
    if (!REACTION_TYPES_PRODUTO.some(r => r.type === nextType)) return

    setOpenReactionPickerByVendaId(prev => ({ ...(prev || {}), [id]: false }))

    try {
      const { data } = await api.post(`/produtos/${encodeURIComponent(vendaId)}/reaction`, { type: nextType })

      const counts = data?.counts
      const total = typeof counts?.total === 'number' ? counts.total : undefined
      const byType = counts?.byType && typeof counts.byType === 'object' ? counts.byType : undefined
      const reacted = !!data?.reacted
      const reactionType = data?.type ?? null

      setFeedItemsRemote(prev => prev.map(it => {
        if ((it?.type !== 'venda' && it?.type !== 'produto') || String(it.id) !== id) return it
        const nextCounts = { ...(it.counts || {}) }
        if (typeof total === 'number') nextCounts.reactions = total
        if (byType) nextCounts.reactionsByType = byType
        return { ...it, myReactionType: reacted ? reactionType : null, counts: nextCounts }
      }))
    } catch (err) {
      console.error('Erro ao reagir ao produto:', err)
      setFeedError('Não foi possível reagir agora.')
    }
  }

  const toggleVendaReactionPicker = (vendaId) => {
    const id = String(vendaId)
    setOpenReactionPickerByVendaId(prev => ({ ...(prev || {}), [id]: !prev?.[id] }))
  }

  const recomendarVenda = async (item) => {
    try {
      const vendaId = item?.id
      if (vendaId === undefined || vendaId === null) return

      const base = window.location.origin
      const url = `${base}/?tab=vendas&venda=${encodeURIComponent(String(vendaId))}`
      const title = String(item?.titulo || item?.nome || 'Produto')

      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setFeedError('Link copiado.')
        return
      }

      setFeedError(url)
    } catch (e) {
      console.error('Erro ao recomendar produto:', e)
      setFeedError('Não foi possível partilhar agora.')
    }
  }

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = { ...(prev || {}), [id]: !(prev || {})[id] }
      try {
        localStorage.setItem('post_saved', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const togglePostMenu = useCallback((postId) => {
    if (postId === undefined || postId === null) return
    const key = String(postId)
    setPostMenuOpenById(prev => ({ ...(prev || {}), [key]: !prev?.[key] }))
  }, [])

  const closePostMenu = useCallback((postId) => {
    if (postId === undefined || postId === null) return
    const key = String(postId)
    setPostMenuOpenById(prev => {
      const next = { ...(prev || {}) }
      delete next[key]
      return next
    })
  }, [])

  const markPostInterest = useCallback((postId, interested) => {
    try {
      if (postId === undefined || postId === null) return
      const key = String(postId)
      closePostMenu(postId)
      setFeedError(interested ? 'Marcado como com interesse' : 'Marcado como sem interesse')
      window.setTimeout(() => setFeedError(''), 1500)
      api.post(`/posts/${encodeURIComponent(key)}/interest`, { interested: !!interested })
    } catch {}
  }, [closePostMenu])

  const hidePost = useCallback((postId) => {
    if (postId === undefined || postId === null) return
    const key = String(postId)
    closePostMenu(postId)
    setPostHiddenById(prev => ({ ...(prev || {}), [key]: true }))
  }, [closePostMenu])

  const snoozeAuthor30Days = useCallback((authorId) => {
    if (authorId === undefined || authorId === null) return
    const key = String(authorId)
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000
    setPostSnoozedUserUntilById(prev => ({ ...(prev || {}), [key]: until }))
  }, [])

  const hideAllFromAuthor = useCallback((authorId) => {
    if (authorId === undefined || authorId === null) return
    const key = String(authorId)
    setPostHiddenAuthorById(prev => ({ ...(prev || {}), [key]: true }))
  }, [])

  const togglePostNotifications = useCallback((postId) => {
    if (postId === undefined || postId === null) return
    const key = String(postId)
    closePostMenu(postId)
    setPostNotifyById(prev => ({ ...(prev || {}), [key]: !prev?.[key] }))
  }, [closePostMenu])

  const embedPost = useCallback(async (postId) => {
    if (postId === undefined || postId === null) return
    const key = String(postId)
    closePostMenu(postId)
    const url = `${window.location.origin}/posts/${encodeURIComponent(key)}`
    const iframe = `<iframe src="${url}" width="560" height="315" style="border:0;" loading="lazy" allowfullscreen></iframe>`
    try {
      await navigator.clipboard.writeText(iframe)
      setFeedError('Código de incorporação copiado')
      window.setTimeout(() => setFeedError(''), 1800)
    } catch {
      setFeedError('Não foi possível copiar. Permita acesso à área de transferência.')
      window.setTimeout(() => setFeedError(''), 2200)
    }
  }, [closePostMenu])

  const blockProfile = useCallback(async (authorId) => {
    if (authorId === undefined || authorId === null) return
    if (String(authorId) === String(user?.id)) return

    try {
      // 1. Obter ou criar conversa para ter o conversaId
      const { data: conv } = await api.post('/mensagens/get-or-create', { destinatarioId: authorId })
      const conversaId = conv?.conversaId
      
      if (!conversaId) {
        setFeedError('Não foi possível processar o bloqueio agora.')
        return
      }

      // 2. Bloquear via endpoint de conversa (Opção 2-A ajustada para proatividade)
      const { data: blockRes } = await api.put(`/mensagens/conversa/${conversaId}/bloquear`)
      
      if (blockRes?.success) {
        setPostHiddenAuthorById(prev => ({ ...(prev || {}), [String(authorId)]: true }))
        setFeedError(blockRes.bloqueada ? 'Perfil bloqueado com sucesso' : 'Perfil desbloqueado')
        window.setTimeout(() => setFeedError(''), 2000)
      }
    } catch (err) {
      console.error('Erro ao bloquear perfil:', err)
      setFeedError('Erro ao bloquear perfil. Tente novamente.')
    }
  }, [user?.id])

  const shouldHideFeedPost = useCallback((postId, authorId) => {
    try {
      if (postId !== undefined && postId !== null) {
        if (postHiddenById[String(postId)]) return true
      }
      if (authorId !== undefined && authorId !== null) {
        const aid = String(authorId)
        if (postHiddenAuthorById[aid]) return true
        const until = postSnoozedUserUntilById[aid]
        if (until && Number(until) > Date.now()) return true
      }
      return false
    } catch {
      return false
    }
  }, [postHiddenById, postHiddenAuthorById, postSnoozedUserUntilById])

  const handleFileChange = (e) => {
    if (!e || !e.target || !e.target.files) return
    const files = Array.from(e.target.files).slice(0, 5)
    if (!files.length) return

    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ]
    const allowedByExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'ogg', 'mov'])

    for (const f of files) {
      const ext = f.name.split('.').pop().toLowerCase()
      const fileType = f.type
      if (!fileType && !allowedByExt.has(ext)) {
        setFeedError('Formato inválido. Use JPG, PNG, WebP, MP4, WebM, OGG ou MOV.')
        try { e.target.value = '' } catch {}
        return
      }
      if (fileType && !allowedMimes.includes(fileType)) {
        setFeedError('Formato inválido. Use JPG, PNG, WebP, MP4, WebM, OGG ou MOV.')
        try { e.target.value = '' } catch {}
        return
      }
      const maxSize = 200 * 1024 * 1024
      if (f.size > maxSize) {
        setFeedError('Arquivo muito grande. Máximo 200MB.')
        try { e.target.value = '' } catch {}
        return
      }
    }

    const previews = []
    let pending = 0

    files.forEach((f, idx) => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (f.type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
        previews[idx] = { type: 'video', url: URL.createObjectURL(f), file: f }
      } else {
        pending++
        const reader = new FileReader()
        reader.onload = (ev) => {
          previews[idx] = { type: 'image', url: ev.target.result, file: f }
          pending--
          if (pending === 0) {
            setPostMediaFiles(files)
            setPostMediaPreviews(previews.filter(Boolean))
            const first = previews[0]
            if (first) {
              setPostMediaFile(first.file)
              setPostImageDataUrl(first.url)
              setPostImageMime(first.file.type || '')
              setPostImageName(first.file.name)
            }
          }
        }
        reader.readAsDataURL(f)
      }
    })

    if (pending === 0) {
      setPostMediaFiles(files)
      setPostMediaPreviews(previews.filter(Boolean))
      const first = previews[0]
      if (first) {
        setPostMediaFile(first.file)
        setPostImageDataUrl(first.url)
        setPostImageMime(first.file.type || '')
        setPostImageName(first.file.name)
      }
    }
  }

const isVideoAttachment = (maybeUrl) => {
  const raw = String(maybeUrl || '')
  if (!raw) return false
  if (raw.startsWith('data:video/')) return true
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(raw)
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
    if (t === 'empresa') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
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
    if (tab === 'vendas') return 'vendas'
    return 'todos'
  }

  const montarDraftProduto = (produto) => {
    try {
      const titulo = String(produto?.titulo || '').trim()
      const preco = String(produto?.preco || '').trim()
      const precoLabel = preco ? `Preço: ${preco}` : (produto?.precoSobConsulta ? 'Preço: Sob consulta' : '')

      const entrega = produto?.entregaDisponivel ? 'Sim' : 'Não'
      const retirada = produto?.retiradaDisponivel ? 'Sim' : 'Não'
      const zona = produto?.zonaEntrega || ''
      const custo = produto?.custoEntrega !== undefined && produto?.custoEntrega !== null ? String(produto.custoEntrega) : ''
      const local = produto?.localRetirada || ''

      const entregaLabel = entrega ? `Entrega: ${entrega}${zona ? ` (${zona})` : ''}${custo ? ` | Custo: ${custo}` : ''}` : null
      const retiradaLabel = retirada ? `Retirada: ${retirada}${local ? ` (${local})` : ''}` : null
      const zonaEntregaLabel = zona ? `Zona de entrega: ${zona}` : null

      const intro = titulo
        ? `Olá! Tenho interesse no produto "${titulo}".`
        : 'Olá! Tenho interesse no produto.'

      const ask = 'Pode me informar disponibilidade e como faço para comprar?'

      const details = [precoLabel, entregaLabel, retiradaLabel, zonaEntregaLabel].filter(Boolean)

      const lines = [
        intro,
        ask,
        details.length ? '' : null,
        ...(details.length ? ['Detalhes:', ...details.map(d => `- ${d}`)] : []),
      ].filter(Boolean)

      return lines.join('\n')
    } catch {
      return 'Olá! Tenho interesse nesse produto.'
    }
  }

  const fetchFeedPage = async (nextPage, { reset = false } = {}) => {
    const apiTab = apiTabFromUiTab(feedTab)
    const q = busca.trim()

    const requestSeq = ++feedRequestSeqRef.current
    try {
      if (feedAbortControllerRef.current) {
        feedAbortControllerRef.current.abort()
      }
    } catch {}
    const controller = new AbortController()
    feedAbortControllerRef.current = controller

    if (reset) {
      setFeedItemsRemote([])
      setFeedPage(1)
    }

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
        signal: controller.signal,
      })

      if (requestSeq !== feedRequestSeqRef.current) return

      const incoming = Array.isArray(data?.items) ? data.items : []
      const incomingReactions = {}
      incoming
        .filter(it => it?.type === 'post' && (it?.id !== undefined && it?.id !== null))
        .forEach(it => {
          if (it?.myReaction) incomingReactions[it.id] = it.myReaction
        })

      if (Object.keys(incomingReactions).length) {
        setMyReactionByPostId(prev => ({ ...prev, ...incomingReactions }))
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
      setFeedHasMore(incoming.length === FEED_PAGE_SIZE)
      setFeedPage(nextPage)
    } catch (err) {
      const aborted = err?.name === 'CanceledError' || err?.name === 'AbortError'
      if (aborted) return
      console.error('Erro ao carregar feed:', err)
      setFeedError('Erro ao carregar feed')
      if (reset) {
        setFeedItemsRemote([])
      }
      setFeedHasMore(false)
    } finally {
      if (requestSeq === feedRequestSeqRef.current) {
        setFeedIsLoading(false)
      }
    }
  }

  useEffect(() => {
    setIsLoadingMore(false)
    setFeedHasMore(true)
    fetchFeedPage(1, { reset: true })
  }, [feedTab, busca, categoria, provincia, distrito])

  useEffect(() => {
    const sentinel = feedSentinelRef.current
    if (!sentinel) return
    if (feedObserverRef.current) {
      try { feedObserverRef.current.disconnect() } catch {}
      feedObserverRef.current = null
    }

    const observer = new IntersectionObserver((entries) => {
      try {
        const entry = Array.isArray(entries) ? entries[0] : null
        if (!entry?.isIntersecting) return
        if (!feedHasMore) return
        if (feedIsLoading || isLoadingMore) return

        setIsLoadingMore(true)
        // Pequeno atraso para garantir suavidade
        setTimeout(() => {
          fetchFeedPage((Number(feedPage) || 1) + 1)
            .finally(() => {
              setIsLoadingMore(false)
            })
        }, 100)
      } catch {}
    }, { root: null, rootMargin: '1200px 0px', threshold: 0.01 })

    feedObserverRef.current = observer
    observer.observe(sentinel)

    return () => {
      try { observer.disconnect() } catch {}
      if (feedObserverRef.current === observer) {
        feedObserverRef.current = null
      }
    }
  }, [feedPage, feedHasMore, feedIsLoading, isLoadingMore, feedTab])

  const publishPost = async () => {
    if (!user) {
      setFeedError('Faça login para publicar')
      return
    }

    const text = postText.trim()
    if (!text && !postImageDataUrl && !postMediaFile && !postMediaFiles.length) return

    if (isPublishing) return
    setIsPublishing(true)
    setPublishProgress(0)
    setPublishProgressText('')
    setFeedError('')

    const mediaFilesToUpload = postMediaFiles.length ? postMediaFiles : (postMediaFile ? [postMediaFile] : [])
    const imageDataUrlToUpload = postImageDataUrl

    const optimisticId = `optimistic:${Date.now()}:${Math.round(Math.random() * 1e9)}`
    const optimisticImagens = mediaFilesToUpload.length ? mediaFilesToUpload.map(f => URL.createObjectURL(f)) : (imageDataUrlToUpload ? [imageDataUrlToUpload] : [])
    const optimistic = {
      type: 'post',
      id: optimisticId,
      createdAt: new Date().toISOString(),
      nome: user?.nome || 'Usuário',
      texto: text,
      imageUrl: optimisticImagens[0] || null,
      imagens: optimisticImagens,
      _textBgKey: (!imageDataUrlToUpload && !mediaFilesToUpload.length) ? (composerTextBgKey || '') : '',
      avatarUrl: user?.tipo === 'empresa' ? (user?.logo || '') : (user?.foto || ''),
      author: user ? {
        id: user.id,
        nome: user.nome,
        tipo: user.tipo,
        foto: user.foto,
        logo: user.logo,
      } : null,
      counts: { likes: 0, comments: 0 },
      _optimistic: true,
    }
    setFeedItemsRemote(prev => [optimistic, ...(Array.isArray(prev) ? prev : [])])

    setPostText('')
    setPostImageDataUrl('')
    setPostImageMime('')
    setPostImageName('')
    setPostMediaFile(null)
    setPostMediaFiles([])
    setPostMediaPreviews([])
    setComposerTextBgKey('')
    setComposerOpen(false)
    setComposerHeight(null)
    setComposerOverflowY('hidden')
    try {
      if (postImageInputRef.current) postImageInputRef.current.value = ''
    } catch {}

    try {
      const isMultiFileUpload = mediaFilesToUpload.length > 0
      const payload = isMultiFileUpload
        ? (() => {
            const fd = new FormData()
            fd.append('texto', text)
            mediaFilesToUpload.forEach(f => fd.append('media', f))
            return fd
          })()
        : { texto: text, imageUrl: imageDataUrlToUpload || null }

      const resp = await api.post('/posts', payload, isMultiFileUpload ? {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          try {
            const loaded = Number(evt?.loaded || 0)
            const total = Number(evt?.total || 0)
            if (total > 0) {
              const pct = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)))
              setPublishProgress(pct)
              setPublishProgressText(`Enviando... ${pct}%`)
            } else {
              setPublishProgress(0)
              setPublishProgressText('Enviando...')
            }
          } catch {}
        },
      } : {
        onUploadProgress: () => {
          setPublishProgress(0)
          setPublishProgressText('Publicando...')
        },
      })

      const created = {
        type: 'post',
        id: resp.data?.id,
        createdAt: resp.data?.createdAt,
        nome: resp.data?.author?.nome || user?.nome || 'Usuário',
        texto: resp.data?.texto || text,
        imageUrl: resp.data?.imageUrl || imageDataUrlToUpload || null,
        _textBgKey: (!resp.data?.imageUrl && !imageDataUrlToUpload && !mediaFileToUpload) ? (composerTextBgKey || '') : '',
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

      setFeedItemsRemote(prev => {
        const list = Array.isArray(prev) ? prev : []
        const next = list.map(it => (String(it?.id) === String(optimisticId) ? created : it))
        const exists = next.some(it => it?.type === 'post' && String(it?.id) === String(created?.id))
        return exists ? next.filter(it => String(it?.id) !== String(optimisticId)) : next
      })

      try {
        const newId = created?.id
        if (newId !== undefined && newId !== null) {
          const shouldPersist = created?._textBgKey && !created?.imageUrl
          if (shouldPersist) {
            setTextPostBgById(prev => {
              const base = (prev && typeof prev === 'object') ? prev : {}
              const next = { ...base, [String(newId)]: String(created._textBgKey) }
              persistTextPostBgById(next)
              return next
            })
          }
        }
      } catch {}
      fetchFeedPage(1, { reset: true })

      try {
        if (postMediaObjectUrlRef.current) {
          URL.revokeObjectURL(postMediaObjectUrlRef.current)
          postMediaObjectUrlRef.current = ''
        }
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
      setFeedItemsRemote(prev => (Array.isArray(prev) ? prev.filter(it => String(it?.id) !== String(optimisticId)) : prev))
    } finally {
      setIsPublishing(false)
      setPublishProgress(0)
      setPublishProgressText('')
    }
  }

  return (
    <div className="bg-[#f4f2ee] min-h-screen">
      {isPublishing ? (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="w-full px-0 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>{publishProgressText || 'Publicando...'}</span>
              {publishProgress > 0 ? <span>{publishProgress}%</span> : <span />}
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              <div
                className="h-full bg-blue-600 rounded-full transition-[width] duration-200"
                style={{ width: `${publishProgress || 8}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <WelcomeNevuModal />
      {confirmDeletePostId ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="font-extrabold text-gray-900 text-lg">Eliminar publicação</div>
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
        <div className="w-full px-0 sm:px-6 lg:px-8 py-3">
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
              { id: 'vendas', label: 'Vendas' },
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

      <div className="w-full px-0 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="hidden xl:block xl:col-span-3">
            <div className="sticky top-32 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="p-4 -mt-8">
                  <div className="flex items-end justify-between">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-800 shadow-sm overflow-hidden">
                      {(() => {
                        const raw = user?.foto || user?.logo || user?.perfil?.foto || user?.perfil?.logo || ''
                        const val = String(raw || '').trim()
                        const url = val ? absoluteAssetUrl(val) : ''
                        if (!url || url.includes('via.placeholder.com')) {
                          return initials(user?.nome || user?.razaoSocial || 'Visitante')
                        }
                        return (
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              try {
                                const img = e?.currentTarget
                                if (!img) return
                                img.style.display = 'none'
                              } catch {}
                            }}
                          />
                        )
                      })()}
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

          <main className="xl:col-span-6 space-y-4">
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
                                    <img
                                      src={defaultAvatarUrl}
                                      alt={s.nome}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        try {
                                          const img = e?.currentTarget
                                          if (!img) return
                                          const src = String(img.src || '')
                                          if (src.includes(fallbackAvatarUrl)) return
                                          img.src = fallbackAvatarUrl
                                        } catch {}
                                      }}
                                    />
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
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${isFollowing(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                      {user?.perfil?.foto || user?.foto || user?.perfil?.logo || user?.logo ? (
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <img src={absoluteAssetUrl(user?.perfil?.foto || user?.foto || user?.perfil?.logo || user?.logo)} alt={user?.nome || 'Usuário'} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        initials(user?.nome || 'Você')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {(() => {
                        const composerTextGradient = !postImageDataUrl && !postMediaFile && !!composerTextBgKey
                        const gradientStyle = composerTextGradient ? getTextBgStyleForKey(composerTextBgKey) : {}
                        const expandedBox = composerOpen || String(postText || '').trim() || postImageDataUrl || postMediaFile
                        return (
                      <textarea
                        ref={composerTextareaRef}
                        value={postText}
                        onChange={(e) => {
                          const next = e.target.value
                          setPostText(next)
                          try {
                            const el = composerTextareaRef.current
                            if (!el) return
                            const MAX_H = 220
                            const BUFFER = 4
                            const minH = composerTextGradient || composerOpen || String(next || '').trim() || postImageDataUrl || postMediaFile ? 72 : 64
                            el.style.height = 'auto'
                            const desired = el.scrollHeight + BUFFER
                            const nextH = Math.min(Math.max(desired, minH), MAX_H)
                            setComposerHeight(nextH)
                            setComposerOverflowY(desired > MAX_H ? 'auto' : 'hidden')
                          } catch {}
                        }}
                        onFocus={() => {
                          setComposerOpen(true)
                          try {
                            const el = composerTextareaRef.current
                            if (!el) return
                            const MAX_H = 220
                            const BUFFER = 4
                            el.style.height = 'auto'
                            const desired = el.scrollHeight + BUFFER
                            const nextH = Math.min(Math.max(desired, 72), MAX_H)
                            setComposerHeight(nextH)
                            setComposerOverflowY(desired > MAX_H ? 'auto' : 'hidden')
                          } catch {}
                        }}
                        onBlur={() => {
                          if (!String(postText || '').trim() && !postImageDataUrl && !postMediaFile) {
                            setComposerOpen(false)
                            setComposerHeight(null)
                            setComposerOverflowY('hidden')
                          }
                        }}
                        rows={composerTextGradient || expandedBox ? 3 : 1}
                        className={
                          composerTextGradient
                            ? 'w-full px-4 py-3 rounded-xl border border-white/30 text-white placeholder:text-white/75 caret-white focus:outline-none focus:ring-2 focus:ring-white/50 resize-none font-semibold leading-snug shadow-sm'
                            : expandedBox
                              ? 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none'
                              : 'w-full px-4 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-600 resize-none focus:outline-none leading-6'
                        }
                        style={{
                          ...gradientStyle,
                          height: composerHeight ? `${composerHeight}px` : undefined,
                          overflowY: composerOverflowY,
                          minHeight: composerTextGradient || expandedBox ? '72px' : '64px',
                          lineHeight: composerTextGradient || expandedBox ? '1.45' : '1.5',
                          boxSizing: 'border-box',
                          textShadow: composerTextGradient ? '0 1px 8px rgba(0,0,0,0.35)' : undefined,
                        }}
                        placeholder={user?.nome ? `No que você está a pensar, ${String(user.nome).split(' ')[0]}?` : 'No que você está a pensar?'}
                      />
                        )
                      })()}
                    </div>
                  </div>

                  {postMediaPreviews.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      {postMediaPreviews.length === 1 ? (
                        <div>
                          {postMediaPreviews[0].type === 'video' || isVideoAttachment(postMediaPreviews[0].url) ? (
                            <video
                              src={postMediaPreviews[0].url}
                              className="w-full max-h-[420px] object-contain bg-black"
                              controls
                              playsInline
                            />
                          ) : (
                            <img
                              src={postMediaPreviews[0].url}
                              alt=""
                              className="w-full max-h-[420px] object-cover cursor-zoom-in"
                              onClick={() => openImageViewer(postMediaPreviews[0].url, null, 0)}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-1 p-1" style={{
                          gridTemplateColumns: postMediaPreviews.length === 2 ? '1fr 1fr' : postMediaPreviews.length === 3 ? '1fr 1fr' : postMediaPreviews.length === 4 ? '1fr 1fr' : 'repeat(3, 1fr)',
                        }}>
                          {postMediaPreviews.map((preview, idx) => (
                            <div key={idx} className={`relative ${postMediaPreviews.length === 3 && idx === 2 ? 'col-span-2' : ''}`}>
                              {preview.type === 'video' || isVideoAttachment(preview.url) ? (
                                <video
                                  src={preview.url}
                                  className="w-full h-40 sm:h-48 object-cover bg-black"
                                  controls
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={preview.url}
                                  alt=""
                                  className="w-full h-40 sm:h-48 object-cover cursor-zoom-in"
                                  onClick={() => openImageViewer(preview.url, null, idx)}
                                />
                              )}
                              {postMediaPreviews.length > 1 && (
                                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                  {idx + 1}/{postMediaPreviews.length}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {(!postImageDataUrl && !postMediaFile && postMediaPreviews.length === 0) ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-gray-600">Fundo do texto</div>
                      <p className="mt-0.5 text-[11px] text-gray-500">Padrão: sem gradiente. Escolha um estilo para aplicar.</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setComposerTextBgKey('')}
                          className={
                            `w-10 h-10 rounded-xl border transition bg-gray-100 ${composerTextBgKey === '' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'}`
                          }
                          aria-label="Fundo padrão (sem gradiente)"
                          title="Padrão"
                        />
                        {TEXT_POST_BACKGROUNDS.map(bg => (
                          <button
                            key={bg.key}
                            type="button"
                            onClick={() => setComposerTextBgKey(bg.key)}
                            className={
                              `w-10 h-10 rounded-xl border transition ${composerTextBgKey === bg.key ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'}`
                            }
                            style={bg.style}
                            aria-label={`Gradiente ${bg.key}`}
                            title={bg.key}
                          />
                        ))}
                      </div>
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
                          multiple
                          accept="image/*,video/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {(postText || postImageDataUrl || postMediaFile || postMediaPreviews.length) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPostText('')
                            setPostImageDataUrl('')
                            setPostImageMime('')
                            setPostImageName('')
                            setPostMediaFile(null)
                            setPostMediaFiles([])
                            setPostMediaPreviews([])
                            try {
                              if (postMediaObjectUrlRef.current) {
                                URL.revokeObjectURL(postMediaObjectUrlRef.current)
                                postMediaObjectUrlRef.current = ''
                              }
                            } catch {}
                            setComposerOpen(false)
                            setComposerHeight(null)
                            setComposerOverflowY('hidden')
                            setComposerTextBgKey('')
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
                      disabled={isPublishing || (!postText.trim() && !postImageDataUrl && !postMediaFile && !postMediaPreviews.length)}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 transition"
                    >
                      {isPublishing ? 'Publicando...' : 'Publicar'}
                    </button>
                  </div>

                  {showCommentModal && modalPostId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCommentModal(false)}>
                      <div 
                        className="bg-white w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex-1 bg-black flex items-center justify-center relative border-r border-gray-100 min-h-[300px] sm:min-h-0">
                          {(() => {
                            const post = visibleFeedItems.find(it => String(it.id) === String(modalPostId))
                            if (!post) return <div className="text-white">Publicação não encontrada</div>
                            return (
                              <>
                                {post.imageUrl ? (
                                  isVideoAttachment(post.imageUrl) ? (
                                    <video src={absoluteAssetUrl(post.imageUrl)} controls className="max-w-full max-h-full" />
                                  ) : (
                                    <img src={absoluteAssetUrl(post.imageUrl)} alt="" className="max-w-full max-h-full object-contain" />
                                  )
                                ) : (
                                  <div className="p-8 text-white text-center italic">
                                    {post.texto || 'Sem média'}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                          <button 
                            onClick={() => setShowCommentModal(false)}
                            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center sm:hidden"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="w-full sm:w-[380px] md:w-[420px] bg-white flex flex-col h-full">
                          {(() => {
                            const post = visibleFeedItems.find(it => String(it.id) === String(modalPostId))
                            if (!post) return null
                            const authorId = post?.userId ?? post?.author?.id ?? null
                            const authorName = post?.nome || 'Usuário'
                            const authorAvatar = post?.avatarUrl || null
                            
                            const isLikedC_post = typeof post?.likedByMe === 'boolean' ? post.likedByMe : !!myReactionByPostId[String(modalPostId)]
                            const myReactionTypeC_post = post?.myReaction || myReactionByPostId[String(modalPostId)] || null
                            const reactionInfoC_post = getReactionInfo(myReactionTypeC_post)

                            return (
                              <>
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                                  <div className="flex items-center gap-3">
                                    <img src={authorAvatar ? absoluteAssetUrl(authorAvatar) : defaultAvatarUrl} className="w-10 h-10 rounded-full border border-gray-100" alt="" />
                                    <div>
                                      <div className="font-extrabold text-gray-900 text-sm leading-tight">{authorName}</div>
                                      <div className="text-[11px] text-gray-500">{new Date(post?.createdAt).toLocaleString()}</div>
                                    </div>
                                  </div>
                                  <button onClick={() => setShowCommentModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition">
                                    ✕
                                  </button>
                                </div>

                                {post.texto && (
                                  <div className="p-4 text-sm text-gray-800 border-b border-gray-50 max-h-[120px] overflow-y-auto">
                                    {post.texto}
                                  </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
                                  {commentsLoadingByPostId[String(modalPostId)] ? (
                                    <div className="flex flex-col items-center justify-center h-20 space-y-2">
                                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      <div className="text-xs text-gray-500 font-medium">Carregando comentários...</div>
                                    </div>
                                  ) : (
                                    <>
                                      {(Array.isArray(commentsByPostId[String(modalPostId)]) ? commentsByPostId[String(modalPostId)] : []).length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm">Nenhum comentário ainda. Seja o primeiro!</div>
                                      ) : (
                                        (commentsByPostId[String(modalPostId)] || []).map((c, idx) => {
                                          const commentId = c?.id
                                          const authorNameC = c?.author?.nome || c?.autor?.nome || 'Usuário'
                                          const cAuthorId = c?.userId ?? c?.author?.id ?? null
                                          const authorAvatarC = c?.author?.foto || c?.author?.logo || null
                                          const canManage = isAuthenticated && user?.id && String(user.id) === String(cAuthorId)
                                          const menuKey = `${String(modalPostId)}:${String(commentId)}`
                                          const isLikedC = typeof c?.likedByMe === 'boolean' ? c.likedByMe : !!commentLikedByMeByCommentId[String(commentId)]
                                          const likesCountC = typeof c?.likesCount === 'number' ? c.likesCount : (commentLikesByCommentId[String(commentId)] || 0)

                                          return (
                                            <div key={`${modalPostId}-${commentId || idx}`} className="flex items-start gap-2 group">
                                              <img src={authorAvatarC ? absoluteAssetUrl(authorAvatarC) : defaultAvatarUrl} className="w-8 h-8 rounded-full shrink-0 mt-0.5 border border-gray-50" alt="" />
                                              <div className="flex-1 min-w-0">
                                                <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full relative">
                                                  <div className="font-bold text-[13px] text-gray-900">{authorNameC}</div>
                                                  <div className="text-[13px] text-gray-800 break-words leading-snug">{c?.texto}</div>
                                                  
                                                  {likesCountC > 0 && (
                                                    <div className="absolute -right-2 -bottom-2 bg-white shadow-sm border border-gray-100 rounded-full px-1 py-0.5 flex items-center gap-0.5 scale-90">
                                                      <span className="bg-blue-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px]">👍</span>
                                                      <span className="text-[10px] font-bold text-gray-600">{likesCountC}</span>
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                                  <button onClick={() => toggleCommentLike(modalPostId, commentId)} className={`hover:underline ${isLikedC ? 'text-blue-600' : ''}`}>Gostar</button>
                                                  <button className="hover:underline">Responder</button>
                                                  <span className="font-normal text-gray-400">{new Date(c?.createdAt).toLocaleDateString()}</span>
                                                </div>
                                              </div>
                                              {canManage && (
                                                <div className="relative shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={(e) => { e.stopPropagation(); toggleCommentMenu(modalPostId, commentId); }} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">⋯</button>
                                                  {commentMenuOpenById[menuKey] && (
                                                    <div className="absolute right-0 top-8 w-28 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
                                                      <button onClick={() => { closeCommentMenu(modalPostId, commentId); beginEditComment(modalPostId, c); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50">Editar</button>
                                                      <button onClick={() => { closeCommentMenu(modalPostId, commentId); requestDeleteComment(modalPostId, commentId); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-red-50 text-red-600">Apagar</button>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })
                                      )}
                                    </>
                                  )}
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500 font-bold border-b border-gray-50 pb-2">
                                    <div className="flex items-center gap-1">
                                      <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">👍</span>
                                      <span>{post.counts?.likes || 0} reações</span>
                                    </div>
                                    <div>{post.counts?.comments || 0} comentários</div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 border-b border-gray-50 pb-3 mb-3">
                                    <div 
                                      className="flex-1 relative"
                                      onMouseEnter={() => handleLikeMouseEnter(modalPostId)}
                                      onMouseLeave={handleLikeMouseLeave}
                                    >
                                      <button 
                                        onClick={() => toggleLike(modalPostId, 'like')}
                                        className={`w-full h-9 flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 transition-colors font-bold text-sm ${isLikedC_post ? reactionInfoC_post.color : 'text-gray-600'}`}
                                      >
                                        {isLikedC_post ? (
                                          <span className="text-lg leading-none">{reactionInfoC_post.emoji}</span>
                                        ) : (
                                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 10a2 2 0 012-2h3.586l1.707-1.707A1 1 0 0110.414 6H14a2 2 0 012 2v1.5a2 2 0 01-.586 1.414l-3.5 3.5A2 2 0 0110.5 15H7a2 2 0 01-2-2v-3H4a2 2 0 01-2-2z" />
                                          </svg>
                                        )}
                                        {isLikedC_post ? reactionInfoC_post.label : 'Gosto'}
                                      </button>

                                      {openReactionPickerPostId === modalPostId && (
                                        <div 
                                          className="absolute bottom-full left-0 mb-2 p-1 bg-white border border-gray-200 rounded-full shadow-2xl flex items-center gap-1 z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                          onMouseEnter={() => { if (reactionPickerTimeoutRef.current) clearTimeout(reactionPickerTimeoutRef.current) }}
                                        >
                                          {REACTION_TYPES.map((r) => (
                                            <button
                                              key={r.type}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                toggleLike(modalPostId, r.type)
                                                setOpenReactionPickerPostId(null)
                                              }}
                                              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-125 transition-all duration-200 group"
                                              title={r.label}
                                            >
                                              <span className="text-2xl leading-none">{r.emoji}</span>
                                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold">
                                                {r.label}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <button className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-sm">
                                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a9.61 9.61 0 01-3.545-.668L2 17l1.314-3.286A6.56 6.56 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                                      </svg>
                                      Comentar
                                    </button>
                                    <button className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-sm">
                                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M15 8a3 3 0 10-2.83-4H7.83a3 3 0 100 2h4.34A3 3 0 0015 8zm-7 9a3 3 0 10-2.83-4H4a1 1 0 100 2h1.17A3 3 0 008 17zm9-4a3 3 0 10-2.83-4H11a1 1 0 100 2h3.17A3 3 0 0017 13z" />
                                      </svg>
                                      Partilhar
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <img src={user?.avatarUrl ? absoluteAssetUrl(user.avatarUrl) : defaultAvatarUrl} className="w-8 h-8 rounded-full border border-gray-100 hidden sm:block" alt="" />
                                    <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 border border-transparent focus-within:border-gray-200 transition">
                                      <input 
                                        value={commentDraftByPostId[String(modalPostId)] || ''}
                                        onChange={(e) => setCommentDraftByPostId(prev => ({ ...prev, [String(modalPostId)]: e.target.value }))}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(modalPostId); } }}
                                        placeholder="Escreva um comentário..."
                                        className="flex-1 bg-transparent text-sm focus:outline-none py-1"
                                      />
                                      <button 
                                        onClick={() => sendComment(modalPostId)}
                                        disabled={!!sendingCommentByPostId[String(modalPostId)] || !(commentDraftByPostId[String(modalPostId)] || '').trim()}
                                        className="text-blue-600 font-bold text-sm hover:text-blue-700 disabled:opacity-40 disabled:hover:text-blue-600 transition"
                                      >
                                        {sendingCommentByPostId[String(modalPostId)] ? '...' : 'Enviar'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {isPublishing ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                        <span>{publishProgressText || 'Publicando...'}</span>
                        {publishProgress > 0 ? <span>{publishProgress}%</span> : <span />}
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-[width] duration-200"
                          style={{ width: `${publishProgress || 8}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
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

                    if (item?.type === 'venda' || item?.type === 'produto') {
                      const titulo = item?.titulo || item?.nome || 'Produto'
                      const descricao = item?.descricao || item?.texto || ''
                      const preco = item?.preco !== undefined && item?.preco !== null
                        ? String(item.preco)
                        : (item?.precoSobConsulta ? 'Sob consulta' : '')

                      const entrega = item?.entregaDisponivel ? 'Entrega disponível' : 'Sem entrega'
                      const retirada = item?.retiradaDisponivel ? 'Retirada disponível' : 'Sem retirada'
                      const empresaId = item?.empresaId ?? item?.author?.id ?? item?.userId
                      const empresaObj = item?.empresa && typeof item.empresa === 'object' ? item.empresa : null
                      const empresaNome = (
                        item?.empresaNome
                        || empresaObj?.nome
                        || item?.author?.nome
                        || item?.empresa
                        || item?.nome
                        || 'Empresa'
                      )
                      const empresaLogo = (
                        empresaObj?.logo
                        || item?.empresaLogo
                        || item?.author?.logo
                        || item?.author?.foto
                        || null
                      )

                      const imagens = Array.isArray(item?.imagens) ? item.imagens.filter(Boolean) : []
                      const fallbackImagem = item?.imageUrl || item?.imagem || null
                      const imagensToShow = imagens.length ? imagens : (fallbackImagem ? [fallbackImagem] : [])

                      const isOwnProduto = (() => {
                        try {
                          const myId = user?.id ?? user?._id
                          if (myId === undefined || myId === null) return false
                          if (empresaId === undefined || empresaId === null) return false
                          return String(myId) === String(empresaId)
                        } catch {
                          return false
                        }
                      })()

                      const vendaId = item?.id
                      const counts = item?.counts && typeof item.counts === 'object' ? item.counts : {}
                      const reactionsTotal = typeof counts?.reactions === 'number' ? counts.reactions : 0
                      const commentsTotal = typeof counts?.comments === 'number' ? counts.comments : 0
                      const myReactionType = item?.myReactionType || null

                      return (
                        <div
                          key={itemKey}
                          ref={(el) => {
                            try {
                              if (!vendaId) return
                              if (el) vendaCardRefs.current[String(vendaId)] = el
                            } catch {}
                          }}
                          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                                  {empresaLogo ? (
                                    <img src={absoluteAssetUrl(empresaLogo)} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    String(empresaNome || 'E').trim().slice(0, 1).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-gray-900 truncate">{titulo}</div>
                                  <div className="text-xs text-gray-600 truncate">{empresaNome}</div>
                                </div>
                              </div>
                              <div className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-100">Vendas</div>
                            </div>

                            {imagensToShow.length ? (
                              <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                <div className="relative">
                                  <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth">
                                    {imagensToShow.map((src, idx) => (
                                      <div key={`${src}-${idx}`} className="w-full shrink-0 snap-center">
                                        <img
                                          src={absoluteAssetUrl(src)}
                                          alt=""
                                          className="w-full h-[260px] sm:h-[360px] max-h-[520px] object-cover cursor-zoom-in"
                                          onClick={() => openImageViewer(absoluteAssetUrl(src), null, idx)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {imagensToShow.length > 1 ? (
                                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-black/60 text-white">
                                      {imagensToShow.length} fotos
                                    </div>
                                  ) : null}
                                  {imagensToShow.length > 1 ? (
                                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
                                      {imagensToShow.slice(0, 6).map((_, i) => (
                                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
                                      ))}
                                      {imagensToShow.length > 6 ? (
                                        <span className="text-[10px] font-extrabold text-white/90 ml-1">+{imagensToShow.length - 6}</span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {preco ? (
                              <div className="mt-3 text-lg font-extrabold text-gray-900">{preco}</div>
                            ) : null}

                            {descricao
                              ? renderFeedExpandableParagraph(`venda-desc-${vendaId}`, descricao, {
                                textClassName: 'text-sm text-gray-800 leading-relaxed',
                                lineClamp: 'line-clamp-4',
                                outerClassName: 'mt-2',
                              })
                              : null}

                            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                              <span className={`px-2.5 py-1 rounded-full border ${item?.entregaDisponivel ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                {entrega}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full border ${item?.retiradaDisponivel ? 'bg-indigo-50 text-indigo-800 border-indigo-100' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                {retirada}
                              </span>
                            </div>

                            <div className="mt-4">
                              {!isOwnProduto ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!empresaId) return
                                    if (!isAuthenticated) {
                                      navigate('/login', { state: { from: '/home' } })
                                      return
                                    }

                                    try {
                                      const conversa = await mensagemService.iniciarConversa(empresaId, null)
                                      const conversaId = conversa?.id || conversa?.conversaId
                                      if (!conversaId) return

                                      const draftMessage = montarDraftProduto(item)
                                      navigate(`/mensagens?chat=${encodeURIComponent(conversaId)}`, {
                                        state: { draftMessage }
                                      })
                                    } catch (e) {
                                      console.error('Erro ao iniciar conversa de vendas', e)
                                      setFeedError('Não foi possível abrir o chat agora.')
                                    }
                                  }}
                                  className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-extrabold bg-gray-900 text-white hover:bg-black transition"
                                >
                                  Falar no chat
                                </button>
                              ) : null}
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => toggleVendaReactionPicker(vendaId)}
                                  disabled={!isAuthenticated}
                                  className={`h-10 w-full rounded-lg text-sm font-extrabold transition flex items-center justify-center ${isAuthenticated ? 'hover:bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                                >
                                  {reactionEmojiProduto(myReactionType || 'reagir')} {reactionLabelProduto(myReactionType || 'reagir')} {reactionsTotal ? `(${reactionsTotal})` : ''}
                                </button>
                                {openReactionPickerByVendaId[String(vendaId)] ? (
                                  <div className="absolute z-50 mt-2 w-full">
                                    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-3">
                                      <div className="flex items-center justify-between gap-2 sm:hidden">
                                        {REACTION_TYPES_PRODUTO.map((r) => (
                                          <button
                                            key={r.type}
                                            type="button"
                                            onClick={() => reactToVenda(vendaId, r.type)}
                                            className={`w-12 h-12 rounded-full border transition flex items-center justify-center ${String(myReactionType || '').toLowerCase() === r.type ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                                          >
                                            <span className="text-2xl leading-none">{r.emoji}</span>
                                          </button>
                                        ))}
                                      </div>

                                      <div className="hidden sm:grid sm:grid-cols-1 gap-2">
                                        {REACTION_TYPES_PRODUTO.map((r) => (
                                          <button
                                            key={r.type}
                                            type="button"
                                            onClick={() => reactToVenda(vendaId, r.type)}
                                            className={`h-9 w-full px-3 rounded-xl text-sm font-extrabold transition flex items-center justify-start gap-2 ${String(myReactionType || '').toLowerCase() === r.type ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                                          >
                                            <span className="text-xl leading-none">{r.emoji}</span>
                                            <span>{r.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleVendaComments(vendaId)}
                                className="h-10 rounded-lg text-sm font-extrabold transition hover:bg-gray-100 text-gray-700 flex items-center justify-center"
                              >
                                Comentar {commentsTotal ? `(${commentsTotal})` : ''}
                              </button>
                              <button
                                type="button"
                                onClick={() => recomendarVenda(item)}
                                className="h-10 rounded-lg text-sm font-extrabold transition hover:bg-gray-100 text-gray-700 flex items-center justify-center"
                              >
                                Recomendar
                              </button>
                            </div>

                            {openCommentsVendaId && String(openCommentsVendaId) === String(vendaId) ? (
                              <div className="mt-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                                {commentsLoadingByVendaId[String(vendaId)] ? (
                                  <div className="text-sm text-gray-500">Carregando comentários...</div>
                                ) : (
                                  <div className="space-y-3">
                                    {(Array.isArray(commentsByVendaId[String(vendaId)]) ? commentsByVendaId[String(vendaId)] : []).map((c) => (
                                      <div key={c?.id} className="text-sm">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="font-bold text-gray-900">{c?.author?.nome || c?.autor?.nome || c?.nome || 'Usuário'}</div>
                                          {isAuthenticated ? (
                                            <div className="flex items-center gap-2 text-[11px]">
                                              {isVendaCommentAuthor(c) ? (
                                                <button
                                                  type="button"
                                                  onClick={() => beginEditVendaComment(vendaId, c)}
                                                  className="font-extrabold text-gray-700 hover:underline"
                                                >
                                                  Editar
                                                </button>
                                              ) : null}
                                              {(isVendaCommentAuthor(c) || isOwnProduto) ? (
                                                <button
                                                  type="button"
                                                  onClick={() => requestDeleteVendaComment(vendaId, c?.id)}
                                                  className="font-extrabold text-gray-700 hover:underline"
                                                >
                                                  Apagar
                                                </button>
                                              ) : null}
                                            </div>
                                          ) : null}
                                        </div>

                                        {editingVendaComment && String(editingVendaComment.vendaId) === String(vendaId) && String(editingVendaComment.commentId) === String(c?.id) ? (
                                          <div className="mt-2">
                                            <textarea
                                              value={editingVendaCommentText}
                                              onChange={(e) => setEditingVendaCommentText(e.target.value)}
                                              className="w-full min-h-[72px] resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                            />
                                            <div className="mt-2 flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                onClick={cancelEditVendaComment}
                                                className="h-9 px-3 rounded-lg text-xs font-extrabold border border-gray-200 text-gray-700 hover:bg-white transition"
                                              >
                                                Cancelar
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => saveEditVendaComment(vendaId, c?.id)}
                                                className="h-9 px-3 rounded-lg text-xs font-extrabold bg-gray-900 text-white hover:bg-black transition"
                                              >
                                                Guardar
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-gray-700 whitespace-pre-line">{c?.texto || ''}</div>
                                        )}

                                        {c?.anexoUrl && String(c?.anexoTipo || '').startsWith('image/') ? (
                                          <img src={absoluteAssetUrl(c.anexoUrl)} alt="" className="mt-2 w-full max-h-[260px] object-cover rounded-lg border border-gray-200" />
                                        ) : null}
                                        {c?.anexoUrl && String(c?.anexoTipo || '').startsWith('audio/') ? (
                                          <audio controls className="mt-2 w-full">
                                            <source src={absoluteAssetUrl(c.anexoUrl)} type={c.anexoTipo || 'audio/mpeg'} />
                                          </audio>
                                        ) : null}
                                      </div>
                                    ))}

                                    {isAuthenticated ? (
                                      <div className="pt-2 border-t border-gray-200">
                                        <textarea
                                          value={commentDraftByVendaId[String(vendaId)] || ''}
                                          onChange={(e) => setCommentDraftByVendaId(prev => ({ ...(prev || {}), [String(vendaId)]: e.target.value }))}
                                          placeholder="Escreva um comentário"
                                          className="w-full min-h-[72px] resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        />

                                        {commentFileByVendaId[String(vendaId)] ? (
                                          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                                            <div className="text-gray-700 truncate">{commentFileByVendaId[String(vendaId)]?.name || 'Anexo'}</div>
                                            <button type="button" onClick={() => clearVendaCommentFile(vendaId)} className="font-extrabold text-gray-700 hover:underline">Remover</button>
                                          </div>
                                        ) : null}

                                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                          <input
                                            type="file"
                                            accept="image/*,audio/*"
                                            onChange={(e) => onPickVendaCommentFile(vendaId, e)}
                                            className="text-xs w-full sm:w-auto"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => sendVendaComment(vendaId)}
                                            className="h-10 sm:h-9 w-full sm:w-auto px-4 rounded-lg text-xs font-extrabold bg-gray-900 text-white hover:bg-black transition"
                                          >
                                            Enviar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="pt-2 border-t border-gray-200">
                                        <button
                                          type="button"
                                          onClick={() => navigate('/login', { state: { from: '/home' } })}
                                          className="h-9 w-full rounded-lg text-xs font-extrabold bg-gray-900 text-white hover:bg-black transition"
                                        >
                                          Entrar para comentar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {confirmDeleteVendaComment ? (
                              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                                <div className="text-sm font-extrabold text-gray-900">Apagar comentário?</div>
                                <div className="mt-2 flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteVendaComment(null)}
                                    className="h-9 px-3 rounded-lg text-xs font-extrabold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={confirmDeleteVendaCommentNow}
                                    className="h-9 px-3 rounded-lg text-xs font-extrabold bg-gray-900 text-white hover:bg-black transition"
                                  >
                                    Apagar
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }

                    if (item?.type === 'pessoa' || item?.type === 'profissional') {
                      const publicUser = publicUserById[String(item?.id ?? '')] || null

                      const nestedUser = item?.usuario || item?.user || item?.account || item?.owner || null
                      const nestedPerfil = item?.perfil || item?.profile || null

                      const publicNestedUser = publicUser?.usuario || publicUser?.user || publicUser?.account || publicUser?.owner || null
                      const publicNestedPerfil = publicUser?.perfil || publicUser?.profile || null

                      const authorName = item?.nome || publicUser?.nome || nestedUser?.nome || publicNestedUser?.nome || nestedPerfil?.nome || publicNestedPerfil?.nome || 'Pessoa'
                      const email = item?.email || publicUser?.email || nestedUser?.email || publicNestedUser?.email || nestedPerfil?.email || publicNestedPerfil?.email || item?.contato?.email || item?.contact?.email || ''
                      const headline = item?.titulo || item?.profissao || item?.ocupacao || item?.area || item?.cargo || publicUser?.titulo || publicUser?.profissao || publicUser?.ocupacao || publicUser?.area || nestedPerfil?.titulo || nestedPerfil?.profissao || nestedPerfil?.ocupacao || publicNestedPerfil?.titulo || publicNestedPerfil?.profissao || publicNestedPerfil?.ocupacao || ''
                      const loc = item?.localizacao || item?.local || publicUser?.localizacao || publicUser?.local || nestedPerfil?.localizacao || nestedPerfil?.local || publicNestedPerfil?.localizacao || publicNestedPerfil?.local || ''
                      const provinciaLabel = item?.provincia || publicUser?.provincia || nestedPerfil?.provincia || publicNestedPerfil?.provincia || ''
                      const distritoLabel = item?.distrito || publicUser?.distrito || nestedPerfil?.distrito || publicNestedPerfil?.distrito || ''
                      const locationParts = [loc, distritoLabel, provinciaLabel].filter(Boolean)
                      const locationLabel = locationParts.length ? locationParts.join(' · ') : ''

                      const skillsRaw = Array.isArray(item?.habilidades)
                        ? item.habilidades
                        : Array.isArray(nestedPerfil?.habilidades)
                          ? nestedPerfil.habilidades
                          : Array.isArray(publicUser?.habilidades)
                            ? publicUser.habilidades
                            : Array.isArray(publicNestedPerfil?.habilidades)
                              ? publicNestedPerfil.habilidades
                          : Array.isArray(item?.skills)
                            ? item.skills
                            : Array.isArray(nestedPerfil?.skills)
                              ? nestedPerfil.skills
                              : Array.isArray(publicUser?.skills)
                                ? publicUser.skills
                                : Array.isArray(publicNestedPerfil?.skills)
                                  ? publicNestedPerfil.skills
                              : []

                      const tagsRaw = Array.isArray(item?.tags)
                        ? item.tags
                        : Array.isArray(nestedPerfil?.tags)
                          ? nestedPerfil.tags
                          : Array.isArray(publicUser?.tags)
                            ? publicUser.tags
                            : Array.isArray(publicNestedPerfil?.tags)
                              ? publicNestedPerfil.tags
                          : []

                      const skills = skillsRaw.filter(Boolean).map(s => String(s)).slice(0, 6)
                      const tags = tagsRaw.filter(Boolean).map(t => String(t)).slice(0, 6)
                      const chips = [...skills, ...tags].filter(Boolean).slice(0, 6)

                      const avatarRaw = (
                        item?.avatarUrl
                        || item?.foto
                        || publicUser?.avatarUrl
                        || publicUser?.foto
                        || nestedUser?.foto
                        || publicNestedUser?.foto
                        || nestedPerfil?.foto
                        || publicNestedPerfil?.foto
                        || ''
                      )
                      const avatarUrl = String(avatarRaw || '').trim()

                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="h-12 bg-gradient-to-r from-slate-100 via-white to-blue-50 border-b border-gray-200" />

                          <div className="relative p-4 pt-9">
                            <button
                              type="button"
                              onClick={() => {
                                if (!avatarUrl) return
                                openImageViewer(absoluteAssetUrl(avatarUrl))
                              }}
                              className="absolute -top-7 left-4 w-14 h-14 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm flex items-center justify-center font-extrabold text-gray-800"
                              aria-label="Ver foto do usuário"
                              title="Ver foto"
                            >
                              {avatarUrl ? (
                                <img src={absoluteAssetUrl(avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
                              ) : (
                                <img
                                  src={defaultAvatarUrl}
                                  alt={authorName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    try {
                                      const img = e?.currentTarget
                                      if (!img) return
                                      const src = String(img.src || '')
                                      if (src.includes(fallbackAvatarUrl)) return
                                      img.src = fallbackAvatarUrl
                                    } catch {}
                                  }}
                                />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 pr-2">
                                  <Link
                                    to={`/perfil/${encodeURIComponent(item.id)}`}
                                    className="font-extrabold text-gray-900 truncate leading-tight text-[15px] hover:underline"
                                  >
                                    {authorName}
                                  </Link>
                                  {headline || locationLabel ? (
                                    <div className="mt-0.5 text-[13px] text-gray-600 truncate">
                                      {headline || ''}{headline && locationLabel ? ' · ' : ''}{locationLabel || ''}
                                    </div>
                                  ) : null}
                                  {email ? (
                                    <div className="mt-0.5 text-xs text-gray-500 truncate">{email}</div>
                                  ) : null}
                                </div>

                                <Link
                                  to={`/perfil/${encodeURIComponent(item.id)}`}
                                  className="mt-0.5 px-4 h-9 inline-flex items-center justify-center rounded-full text-xs font-extrabold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition shrink-0"
                                >
                                  Ver perfil
                                </Link>
                              </div>

                              {chips.length ? (
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                  {chips.map(c => (
                                    <span key={c} className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">{c}</span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (item?.type === 'post') {
                      const postId = item?.id
                      const authorName = item?.nome || 'Usuário'
                      const authorId = item?.userId ?? item?.author?.id ?? item?.authorId ?? item?.usuarioId ?? item?.idUsuario ?? null
                      if (shouldHideFeedPost(postId, authorId)) return null
                      const authorProfileTo = authorId !== undefined && authorId !== null
                        ? `/perfil/${encodeURIComponent(authorId)}`
                        : ''
                      const likesCount = typeof item?.counts?.likes === 'number' ? item.counts.likes : 0
                      const commentsCount = typeof item?.counts?.comments === 'number' ? item.counts.comments : 0
                      const isLiked = typeof item?.likedByMe === 'boolean' ? item.likedByMe : !!myReactionByPostId[String(postId)]
                      const myReactionType = item?.myReaction || myReactionByPostId[String(postId)] || null
                      const reactionInfo = getReactionInfo(myReactionType)
                      const likeFxOn = !!likeFx[String(postId)]
                      const postType = String(item?.postType || 'normal').toLowerCase()

                      const hasMedia = !!item?.imageUrl
                      const hasText = !!String(item?.texto || '').trim()
                      const isTextOnly = hasText && !hasMedia
                      const bgKey = (item?._textBgKey && typeof item._textBgKey === 'string' && item._textBgKey)
                        ? item._textBgKey
                        : getTextBgKeyForPostId(postId)
                      const hasGradientTextBg = isTextOnly && TEXT_POST_BACKGROUNDS.some(b => b.key === bgKey)
                      const textBgStyle = hasGradientTextBg ? getTextBgStyleForKey(bgKey) : {}

                      const serviceCategory = item?.serviceCategory || ''
                      const serviceLocation = item?.serviceLocation || ''
                      const servicePrice = item?.servicePrice || ''
                      const serviceWhatsapp = item?.serviceWhatsapp || ''

                      const ctaText = item?.ctaText || ''
                      const ctaUrl = item?.ctaUrl || ''

                      const whatsappHref = (() => {
                        const raw = String(serviceWhatsapp || '').trim()
                        if (!raw) return ''
                        const digits = raw.replace(/[^0-9+]/g, '')
                        if (!digits) return ''
                        const phone = digits.startsWith('+') ? digits.slice(1) : digits
                        return `https://wa.me/${encodeURIComponent(phone)}`
                      })()

                      return (
                        <div
                          key={itemKey}
                          ref={(el) => {
                            if (postId !== undefined && postId !== null) postCardRefs.current[String(postId)] = el
                          }}
                          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!item?.avatarUrl) return
                                  openImageViewer(absoluteAssetUrl(item.avatarUrl), postId)
                                }}
                                className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0"
                                aria-label="Ver foto do usuário"
                                title="Ver foto"
                              >
                                {item.avatarUrl ? (
                                  <div className="w-full h-full rounded-full overflow-hidden">
                                    <img src={absoluteAssetUrl(item.avatarUrl)} alt={authorName} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <img
                                    src={defaultAvatarUrl}
                                    alt={authorName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      try {
                                        const img = e?.currentTarget
                                        if (!img) return
                                        const src = String(img.src || '')
                                        if (src.includes(fallbackAvatarUrl)) return
                                        img.src = fallbackAvatarUrl
                                      } catch {}
                                    }}
                                  />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                {authorProfileTo ? (
                                  <Link
                                    to={authorProfileTo}
                                    className="font-extrabold text-gray-900 truncate leading-tight hover:underline"
                                  >
                                    {authorName}
                                  </Link>
                                ) : (
                                  <div className="font-extrabold text-gray-900 truncate leading-tight">{authorName}</div>
                                )}
                                <div className="text-xs text-gray-500 truncate leading-tight">
                                  {new Date(item?.createdAt || Date.now()).toLocaleString()}
                                </div>
                              </div>
                              <div className="relative shrink-0 flex items-center gap-2">
                                {postId !== undefined && postId !== null ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      togglePostMenu(postId)
                                    }}
                                    className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 transition"
                                    aria-label="Mais opções"
                                    title="Mais opções"
                                  >
                                    <span className="text-xl leading-none text-gray-700">⋯</span>
                                  </button>
                                ) : null}

                                {postId !== undefined && postId !== null && postMenuOpenById[String(postId)] ? (
                                  <div
                                    className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => markPostInterest(postId, true)}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                    >
                                      Com interesse
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => markPostInterest(postId, false)}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                    >
                                      Sem interesse
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        toggleSave(String(postId))
                                        closePostMenu(postId)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                    >
                                      {saved[String(postId)] ? 'Remover dos guardados' : 'Guardar publicação'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => togglePostNotifications(postId)}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                    >
                                      {postNotifyById[String(postId)] ? 'Desativar notificação' : 'Ativar notificação para esta publicação'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => embedPost(postId)}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                    >
                                      Incorporar
                                    </button>
                                    <div className="h-px bg-gray-200" />
                                    <button
                                      type="button"
                                      onClick={() => hidePost(postId)}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                    >
                                      Ocultar publicação
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closePostMenu(postId)
                                        snoozeAuthor30Days(authorId)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                      disabled={authorId === undefined || authorId === null}
                                    >
                                      Suspender durante 30 dias
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closePostMenu(postId)
                                        hideAllFromAuthor(authorId)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50"
                                      disabled={authorId === undefined || authorId === null}
                                    >
                                      Ocultar tudo de {authorName}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        closePostMenu(postId)
                                        blockProfile(authorId)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-red-50 text-red-700"
                                      disabled={authorId === undefined || authorId === null}
                                    >
                                      Bloquear perfil
                                    </button>
                                    <div className="h-px bg-gray-200" />
                                    <Link
                                      to={`/denuncias?tipo=post&refId=${encodeURIComponent(postId)}`}
                                      onClick={() => closePostMenu(postId)}
                                      className="block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50 text-red-700"
                                    >
                                      Denunciar
                                    </Link>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {postType === 'servico' ? (
                              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                {serviceCategory ? (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">{serviceCategory}</span>
                                ) : null}
                                {serviceLocation ? (
                                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">{serviceLocation}</span>
                                ) : null}
                                {servicePrice ? (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">{servicePrice}</span>
                                ) : null}
                              </div>
                            ) : null}

                            {isTextOnly ? (
                              hasGradientTextBg ? (
                                <div
                                  className="mt-3 rounded-2xl border border-gray-200 overflow-hidden"
                                  style={textBgStyle}
                                >
                                  <div className="min-h-[180px] px-6 py-8 flex flex-col items-center justify-center text-center">
                                    {renderFeedExpandableParagraph(`post-txt-${postId}`, item.texto, {
                                      textClassName: 'text-white font-extrabold leading-snug text-[18px] sm:text-[20px] w-full max-w-xl',
                                      lineClamp: 'line-clamp-6',
                                      buttonClassName: 'mt-3 text-sm font-semibold text-white/90 hover:text-white underline decoration-white/40',
                                      outerClassName: 'w-full max-w-xl',
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                                  <div className="px-4 py-4">
                                    {renderFeedExpandableParagraph(`post-txt-${postId}`, item.texto, {
                                      textClassName: 'text-[15px] text-gray-900 leading-relaxed',
                                      lineClamp: 'line-clamp-6',
                                      buttonClassName: 'mt-3 text-sm font-semibold text-gray-700 hover:text-gray-900 underline',
                                      outerClassName: 'w-full',
                                    })}
                                  </div>
                                </div>
                              )
                            ) : item?.texto ? (
                              renderFeedExpandableParagraph(`post-cap-${postId}`, item.texto, {
                                textClassName: 'text-[15px] text-gray-900 leading-relaxed',
                                lineClamp: 'line-clamp-4',
                              })
                            ) : null}

                            {(() => {
                            const imagens = Array.isArray(item?.imagens) ? item.imagens.filter(Boolean) : []
                            const hasImagens = imagens.length > 0
                            const fallbackImageUrl = item?.imageUrl
                            const showImagens = hasImagens || fallbackImageUrl
                            const imagesToRender = hasImagens ? imagens : (fallbackImageUrl ? [fallbackImageUrl] : [])
                            if (!showImagens) return null
                            return (
                              <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                {imagesToRender.length === 1 ? (
                                  isVideoAttachment(imagesToRender[0]) ? (
                                    <video
                                      src={absoluteAssetUrl(imagesToRender[0])}
                                      className="w-full h-[260px] sm:h-[360px] max-h-[520px] object-contain bg-black"
                                      controls
                                      onPlay={() => registerPostView(item?.id)}
                                    />
                                  ) : (
                                    <img
                                      src={absoluteAssetUrl(imagesToRender[0])}
                                      alt=""
                                      className="w-full max-h-[520px] object-cover cursor-zoom-in"
                                      onClick={() => openImageViewer(absoluteAssetUrl(imagesToRender[0]), postId, 0)}
                                    />
                                  )
                                ) : (
                                  <div className="relative">
                                    <div className="grid gap-1 p-1" style={{
                                      gridTemplateColumns: imagesToRender.length === 2 ? '1fr 1fr' : imagesToRender.length === 3 ? '1fr 1fr' : imagesToRender.length === 4 ? '1fr 1fr' : 'repeat(3, 1fr)',
                                    }}>
                                      {imagesToRender.map((src, idx) => (
                                        <div key={idx} className={`relative ${imagesToRender.length === 3 && idx === 2 ? 'col-span-2' : ''}`}>
                                          {isVideoAttachment(src) ? (
                                            <video
                                              src={absoluteAssetUrl(src)}
                                              className="w-full h-40 sm:h-48 object-cover bg-black"
                                              controls
                                              onPlay={() => registerPostView(item?.id)}
                                            />
                                          ) : (
                                            <img
                                              src={absoluteAssetUrl(src)}
                                              alt=""
                                              className="w-full h-40 sm:h-48 object-cover cursor-zoom-in"
                                              onClick={() => openImageViewer(absoluteAssetUrl(src), postId, idx)}
                                            />
                                          )}
                                          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                            {idx + 1}/{imagesToRender.length}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                            {postType === 'servico' && (whatsappHref || (ctaText && ctaUrl)) ? (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {whatsappHref ? (
                                  <a
                                    href={whatsappHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-10 rounded-lg text-sm font-extrabold transition flex items-center justify-center bg-green-600 text-white hover:bg-green-700"
                                  >
                                    WhatsApp
                                  </a>
                                ) : null}
                                {ctaText && ctaUrl ? (
                                  <a
                                    href={normalizeExternalUrl(ctaUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-10 rounded-lg text-sm font-extrabold transition flex items-center justify-center bg-gray-900 text-white hover:bg-black"
                                  >
                                    {ctaText}
                                  </a>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px]">👍</span>
                                <span className="font-semibold">{likesCount}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleComments(postId)}
                                className="hover:underline hover:text-gray-900 transition"
                              >
                                <span className="font-semibold">{commentsCount}</span> comentários
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 px-3 py-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div 
                                className="relative"
                                onMouseEnter={() => handleLikeMouseEnter(postId)}
                                onMouseLeave={handleLikeMouseLeave}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleLike(postId, 'like')}
                                  className={`h-10 w-full rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2 ${
                                    isLiked ? reactionInfo.color + ' bg-gray-50' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {isLiked ? (
                                    <span className="text-xl leading-none">{reactionInfo.emoji}</span>
                                  ) : (
                                    <svg className={likeFxOn ? 'w-5 h-5 transition-transform scale-110' : 'w-5 h-5 transition-transform'} viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M2 10a2 2 0 012-2h3.586l1.707-1.707A1 1 0 0110.414 6H14a2 2 0 012 2v1.5a2 2 0 01-.586 1.414l-3.5 3.5A2 2 0 0110.5 15H7a2 2 0 01-2-2v-3H4a2 2 0 01-2-2z" />
                                    </svg>
                                  )}
                                  {isLiked ? reactionInfo.label : 'Gostei'}
                                </button>

                                {openReactionPickerPostId === postId && (
                                  <div 
                                    className="absolute bottom-full left-0 mb-2 p-1 bg-white border border-gray-200 rounded-full shadow-xl flex items-center gap-1 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                    onMouseEnter={() => { if (reactionPickerTimeoutRef.current) clearTimeout(reactionPickerTimeoutRef.current) }}
                                  >
                                    {REACTION_TYPES.map((r) => (
                                      <button
                                        key={r.type}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleLike(postId, r.type)
                                          setOpenReactionPickerPostId(null)
                                        }}
                                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-125 transition-all duration-200 group"
                                        title={r.label}
                                      >
                                        <span className="text-2xl leading-none">{r.emoji}</span>
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold">
                                          {r.label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleComments(postId)}
                                className="h-10 rounded-xl text-sm font-extrabold transition hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a9.61 9.61 0 01-3.545-.668L2 17l1.314-3.286A6.56 6.56 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                                </svg>
                                Comentar
                              </button>
                              <button
                                type="button"
                                className="h-10 rounded-xl text-sm font-extrabold transition hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-2"
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
                                  {(Array.isArray(commentsByPostId[String(postId)]) ? commentsByPostId[String(postId)] : []).map((c, idx) => {
                                    const commentId = c?.id
                                    const commentKey = `${String(postId)}:${String(commentId ?? 'noid')}:${idx}`
                                    const authorNameC = c?.author?.nome || c?.autor?.nome || c?.nome || 'Usuário'
                                    const cAuthorId = c?.userId ?? c?.author?.id ?? c?.autor?.id ?? null
                                    const authorAvatar = c?.author?.foto || c?.author?.logo || c?.autor?.foto || c?.autor?.logo || null
                                    const authorProfileToC = cAuthorId ? `/perfil/${encodeURIComponent(cAuthorId)}` : null
                                    const canManage = isAuthenticated && (user?.id !== undefined && user?.id !== null) && cAuthorId !== undefined && cAuthorId !== null && String(user.id) === String(cAuthorId)
                                    const menuKey = `${String(postId)}:${String(commentId)}`

                                    const likesCountC = typeof c?.likesCount === 'number' ? c.likesCount : (commentLikesByCommentId[String(commentId)] || 0)
                                    const isLikedC = typeof c?.likedByMe === 'boolean' ? c.likedByMe : !!commentLikedByMeByCommentId[String(commentId)]

                                    return (
                                      <div key={commentKey} className="text-sm">
                                        <div className="flex items-start gap-2 group">
                                          {authorProfileToC ? (
                                            <Link to={authorProfileToC} className="shrink-0 mt-0.5">
                                              <img 
                                                src={authorAvatar ? absoluteAssetUrl(authorAvatar) : defaultAvatarUrl} 
                                                alt={authorNameC}
                                                className="w-8 h-8 rounded-full object-cover border border-gray-100 hover:opacity-90 transition"
                                              />
                                            </Link>
                                          ) : (
                                            <div className="shrink-0 mt-0.5">
                                              <img 
                                                src={defaultAvatarUrl} 
                                                alt={authorNameC}
                                                className="w-8 h-8 rounded-full object-cover border border-gray-100"
                                              />
                                            </div>
                                          )}

                                          <div className="flex-1 min-w-0">
                                            <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full">
                                              {authorProfileToC ? (
                                                <Link to={authorProfileToC} className="font-bold text-gray-900 hover:underline">
                                                  {authorNameC}
                                                </Link>
                                              ) : (
                                                <div className="font-bold text-gray-900">{authorNameC}</div>
                                              )}
                                              
                                              {editingComment && String(editingComment?.postId) === String(postId) && String(editingComment?.commentId) === String(commentId) ? (
                                                <div className="mt-1">
                                                  <textarea
                                                    value={editingCommentText}
                                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                                    className="w-full min-h-[64px] resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                  />
                                                  <div className="mt-2 flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => saveEditComment(postId, commentId)}
                                                      className="h-9 px-3 rounded-lg text-xs font-extrabold bg-gray-900 text-white hover:bg-black transition"
                                                    >
                                                      Guardar
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={cancelEditComment}
                                                      className="h-9 px-3 rounded-lg text-xs font-extrabold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                                                    >
                                                      Cancelar
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-gray-700 whitespace-pre-line break-words">{c?.texto || ''}</div>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                              <button 
                                                type="button" 
                                                onClick={() => toggleCommentLike(postId, commentId)}
                                                className={`hover:underline transition ${isLikedC ? 'text-blue-600' : ''}`}
                                              >
                                                Gostar
                                              </button>
                                              <button type="button" className="hover:underline transition">Responder</button>
                                              <span>{new Date(c?.createdAt || Date.now()).toLocaleDateString()}</span>
                                              
                                              {likesCountC > 0 && (
                                                <div className="flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-full px-1 py-0.5 ml-1">
                                                  <span className="bg-blue-600 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">👍</span>
                                                  <span className="text-gray-600">{likesCountC}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {canManage && commentId !== undefined && commentId !== null ? (
                                            <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  toggleCommentMenu(postId, commentId)
                                                }}
                                                className="w-7 h-7 rounded-full inline-flex items-center justify-center hover:bg-gray-100 transition"
                                                aria-label="Opções do comentário"
                                              >
                                                <span className="text-lg leading-none text-gray-600">⋯</span>
                                              </button>

                                              {commentMenuOpenById[menuKey] ? (
                                                <div
                                                  className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      closeCommentMenu(postId, commentId)
                                                      beginEditComment(postId, c)
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-gray-50"
                                                  >
                                                    Editar
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      closeCommentMenu(postId, commentId)
                                                      requestDeleteComment(postId, commentId)
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-red-50 text-red-700"
                                                  >
                                                    Apagar
                                                  </button>
                                                </div>
                                              ) : null}
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    )
                                  })}
                                  <div className="flex items-center gap-2 mt-4">
                                    <input
                                      value={commentDraftByPostId[String(postId)] || ''}
                                      onChange={(e) => setCommentDraftByPostId(prev => ({ ...(prev || {}), [String(postId)]: e.target.value }))}
                                      placeholder="Escreva um comentário..."
                                      className="flex-1 px-3 py-2 rounded-full border border-gray-200 text-sm bg-gray-50 focus:bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => sendComment(postId)}
                                      disabled={!!sendingCommentByPostId[String(postId)] || !(commentDraftByPostId[String(postId)] || '').trim()}
                                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 transition"
                                    >
                                      {sendingCommentByPostId[String(postId)] ? 'Enviando...' : 'Enviar'}
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

                      const logoRaw = item?.avatarUrl || ''
                      const logoUrl = String(logoRaw || '').trim()

                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          <div className="h-12 bg-gradient-to-r from-slate-100 via-white to-blue-50 border-b border-gray-200" />

                          <div className="relative p-4 pt-9">
                            <button
                              type="button"
                              onClick={() => {
                                if (!logoUrl) return
                                openImageViewer(absoluteAssetUrl(logoUrl), item?.id)
                              }}
                              className="absolute -top-7 left-4 w-14 h-14 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm flex items-center justify-center font-extrabold text-gray-800"
                              aria-label="Ver logo da empresa"
                              title="Ver logo"
                            >
                              {item.avatarUrl ? (
                                <img src={absoluteAssetUrl(item.avatarUrl)} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                initials(name)
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 pr-2">
                                  {companyTo ? (
                                    <Link
                                      to={companyTo}
                                      className="font-extrabold text-gray-900 truncate leading-tight text-[15px] hover:underline"
                                    >
                                      {name}
                                    </Link>
                                  ) : (
                                    <div className="font-extrabold text-gray-900 truncate leading-tight text-[15px]">{name}</div>
                                  )}
                                  <div className="mt-0.5 text-[13px] text-gray-600 truncate">{subtitle}</div>
                                </div>
                                {companyTo ? (
                                  <Link
                                    to={companyTo}
                                    className="mt-0.5 px-4 h-9 inline-flex items-center justify-center rounded-full text-xs font-extrabold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition shrink-0"
                                  >
                                    {companyLabel}
                                  </Link>
                                ) : null}
                              </div>

                              {item?.texto
                                ? renderFeedExpandableParagraph(`empresa-txt-${companyId ?? itemKey}`, item.texto, {
                                  textClassName: 'text-sm text-gray-800 leading-relaxed',
                                  lineClamp: 'line-clamp-4',
                                })
                                : null}
                            </div>

                            {item?.imageUrl ? (
                              <div className="mt-4 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                {isVideoAttachment(item.imageUrl) ? (
                                  <video
                                    src={absoluteAssetUrl(item.imageUrl)}
                                    className="w-full h-[260px] sm:h-[360px] max-h-[520px] object-contain bg-black"
                                    controls
                                    playsInline
                                    preload="none"
                                    onPlay={() => registerPostView(item?.id)}
                                  />
                                ) : (
                                  <img src={absoluteAssetUrl(item.imageUrl)} alt="" className="w-full max-h-[520px] object-cover" />
                                )}
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

                      const vagaImagemUrl = (
                        item?.imageUrl
                        || item?.imagem
                        || (Array.isArray(item?.imagens) && item.imagens.length > 0 ? item.imagens[0] : '')
                      )

                      const vagaTitulo = item?.titulo || item?.cargo || item?.posicao || 'Vaga'
                      const vagaEmpresa = item?.empresa || item?.nomeEmpresa || item?.company || 'Empresa'
                      const vagaLocal = item?.localizacao || item?.local || ''
                      const vagaProvincia = item?.provincia || ''
                      const vagaDistrito = item?.distrito || ''
                      const vagaResumo = item?.descricao || item?.resumo || item?.texto || item?.sobre || ''
                      const vagaNivel = item?.nivel || item?.senioridade || ''
                      const vagaTipo = item?.tipo || item?.regime || ''
                      const vagaSalario = item?.salario || item?.faixaSalarial || ''
                      const vagaModelo = item?.modelo || item?.modalidade || ''

                      const locationParts = [vagaLocal, vagaDistrito, vagaProvincia].filter(Boolean)
                      const locationLabel = locationParts.length ? locationParts.join(' · ') : ''
                      const tags = (Array.isArray(item?.tags) ? item.tags : [])
                        .filter(Boolean)
                        .map(t => String(t))
                        .slice(0, 6)

                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          {vagaImagemUrl ? (
                            <div className="h-32 sm:h-40 bg-gray-100 overflow-hidden">
                              <img
                                src={absoluteAssetUrl(vagaImagemUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="relative h-28 sm:h-32 px-4 flex items-end pb-4 overflow-hidden"
                              style={{ backgroundImage: 'linear-gradient(135deg, #0b1220 0%, #312e81 55%, #0ea5e9 120%)' }}
                            >
                              <div className="absolute inset-0 bg-black/25" />
                              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                              <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-sky-400/20 blur-2xl" />

                              <div className="relative flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20">
                                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M10 2a2 2 0 00-2 2v2H6a2 2 0 00-2 2v10a4 4 0 004 4h8a4 4 0 004-4V8a2 2 0 00-2-2h-2V4a2 2 0 00-2-2h-2zm0 4V4h4v2h-4z" />
                                  </svg>
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-black/30 text-white text-sm font-extrabold tracking-wide shadow-sm">
                                  Vaga
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">{vagaTitulo}</div>
                                <div className="text-sm text-gray-600 truncate">
                                  {vagaEmpresa}
                                  {locationLabel ? ` · ${locationLabel}` : ''}
                                </div>
                              </div>
                              <div className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">Vaga</div>
                            </div>

                            {vagaResumo
                              ? renderFeedExpandableParagraph(`vaga-${item?.id ?? itemKey}-resumo`, vagaResumo, {
                                textClassName: 'text-sm text-gray-800 leading-relaxed',
                                lineClamp: 'line-clamp-3',
                                charThreshold: 160,
                                lineThreshold: 3,
                              })
                              : null}

                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              {vagaSalario ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{vagaSalario}</span>
                              ) : null}
                              {vagaModelo ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{vagaModelo}</span>
                              ) : null}
                              {vagaTipo ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{vagaTipo}</span>
                              ) : null}
                              {vagaNivel ? (
                                <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{vagaNivel}</span>
                              ) : null}
                              {tags.map(t => (
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
                      const servicoImagens = Array.isArray(item?.imagens) ? item.imagens.filter(Boolean) : []
                      const servicoImagemUrl = servicoImagens.length > 0 ? servicoImagens[0] : null
                      return (
                        <div key={itemKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                          {servicoImagens.length ? (
                            <div className="relative">
                              <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth">
                                {servicoImagens.map((src, idx) => (
                                  <div key={`${src}-${idx}`} className="w-full shrink-0 snap-center">
                                    <img
                                      src={absoluteAssetUrl(src)}
                                      alt=""
                                      className="w-full h-[220px] sm:h-[320px] max-h-[520px] object-cover cursor-zoom-in"
                                      onClick={() => openImageViewer(absoluteAssetUrl(src))}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                              <div className="absolute left-4 bottom-3 inline-flex items-center gap-2">
                                <span className="px-3 py-1.5 rounded-full bg-black/55 text-white text-xs font-extrabold">Serviço</span>
                                {servicoImagens.length > 1 ? (
                                  <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-extrabold">
                                    {servicoImagens.length} fotos
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <div className="relative h-24 sm:h-28 px-4 flex items-end pb-4 overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, #0b1220 0%, #0f172a 55%, #1d4ed8 120%)' }}>
                              <div className="absolute inset-0 bg-black/25" />
                              <div className="relative inline-flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20">
                                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v6h5v2h-7V7h2z" />
                                  </svg>
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-black/30 text-white text-sm font-extrabold tracking-wide shadow-sm">Serviço</span>
                              </div>
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">{item?.titulo || 'Serviço'}</div>
                                <div className="text-sm text-gray-600 truncate">{item?.empresa || item?.nome || ''} {item?.localizacao ? `· ${item.localizacao}` : ''}</div>
                              </div>
                              <div className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">Serviço</div>
                            </div>
                            {item?.texto
                              ? renderFeedExpandableParagraph(`servico-${item?.id ?? itemKey}-txt`, item.texto, {
                                textClassName: 'text-sm text-gray-800 leading-relaxed',
                                lineClamp: 'line-clamp-4',
                              })
                              : null}
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

                  {(isLoadingMore || (feedIsLoading && visibleFeedItems.length > 0)) ? (
                    <div className="py-5 flex items-center justify-center">
                      <svg className="w-5 h-5 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <div className="ml-2 text-sm text-gray-600">Carregando...</div>
                    </div>
                  ) : null}
                  <div ref={feedSentinelRef} className="h-8" />

                  {(!feedIsLoading && !isLoadingMore && !feedHasMore && visibleFeedItems.length > 0) ? (
                    <div className="pt-10 pb-10">
                      <div className="relative h-14">
                        <div className="absolute inset-x-0 top-6 h-2 bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent blur-sm" />
                        <div className="absolute inset-x-0 top-6 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent" />
                      </div>

                      <div className="mt-3 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v6h5v2h-7V7h2z" />
                          </svg>
                        </div>
                        <div className="mt-3 font-extrabold text-gray-900">Você chegou ao fim</div>
                        <div className="mt-1 text-sm text-gray-700">Sem mais conteúdo para carregar por agora.</div>
                        <div className="mt-4 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              } catch {
                                try { window.scrollTo(0, 0) } catch {}
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-extrabold hover:bg-black transition"
                          >
                            Voltar ao topo
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </main>

          {showImageViewer && viewerUrl && (
            <div className="fixed inset-0 z-[120] flex flex-col sm:flex-row bg-black/95 backdrop-blur-md" onClick={closeImageViewer}>
              {/* Lado Esquerdo: Imagem/Média em destaque */}
              <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4">
                <img 
                  src={viewerUrl} 
                  alt="" 
                  className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300" 
                  onClick={(e) => e.stopPropagation()}
                />
                <button 
                  onClick={closeImageViewer}
                  className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-all z-10 sm:hidden"
                >
                  ✕
                </button>
              </div>

              {/* Lado Direito: Info e Interações (Estilo Facebook) */}
              {viewerPostId && (
                <div 
                  className="w-full sm:w-[360px] md:w-[400px] bg-white flex flex-col h-[45vh] sm:h-full shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const post = visibleFeedItems.find(it => String(it.id) === String(viewerPostId))
                    if (!post) return (
                      <div className="flex-1 flex items-center justify-center flex-col p-8 text-center">
                        <div className="text-gray-400 mb-2">📸</div>
                        <div className="text-gray-500 text-sm font-medium">Informação da publicação indisponível</div>
                        <button onClick={closeImageViewer} className="mt-4 text-blue-600 font-bold text-sm">Fechar</button>
                      </div>
                    )
                    
                    const authorName = post?.nome || 'Usuário'
                    const authorAvatar = post?.avatarUrl || null
                    const isLiked = typeof post?.likedByMe === 'boolean' ? post.likedByMe : !!myReactionByPostId[String(viewerPostId)]
                    const myReactionType = post?.myReaction || myReactionByPostId[String(viewerPostId)] || null
                    const reactionInfo = getReactionInfo(myReactionType)

                    return (
                      <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <img 
                              src={authorAvatar ? absoluteAssetUrl(authorAvatar) : defaultAvatarUrl} 
                              className="w-10 h-10 rounded-full border border-gray-100 object-cover" 
                              alt="" 
                            />
                            <div>
                              <div className="font-extrabold text-gray-900 text-sm leading-tight">{authorName}</div>
                              <div className="text-[11px] text-gray-500">{new Date(post?.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <button onClick={closeImageViewer} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition">✕</button>
                        </div>

                        {/* Conteúdo scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                          {post.texto && (
                            <div className="p-4 text-sm text-gray-800 leading-relaxed border-b border-gray-50">
                              {post.texto}
                            </div>
                          )}

                          {/* Contador de interações */}
                          <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500 font-bold border-b border-gray-50">
                            <div className="flex items-center gap-1">
                              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">👍</span>
                              <span>{post.counts?.likes || 0} reações</span>
                            </div>
                            <div>{post.counts?.comments || 0} comentários</div>
                          </div>

                          {/* Lista resumida de comentários no Lightbox */}
                          <div className="p-4 space-y-4">
                            {commentsLoadingByPostId[String(viewerPostId)] ? (
                              <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : (
                              <>
                                {(commentsByPostId[String(viewerPostId)] || []).slice(0, 15).map((c, idx) => {
                                  const cAvatar = c?.author?.foto || c?.author?.logo || null
                                  return (
                                    <div key={idx} className="flex items-start gap-2">
                                      <img src={cAvatar ? absoluteAssetUrl(cAvatar) : defaultAvatarUrl} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" alt="" />
                                      <div className="bg-gray-100 rounded-2xl px-3 py-1.5 min-w-0">
                                        <div className="font-bold text-[12px] text-gray-900 leading-none mb-1">{c?.author?.nome || 'Usuário'}</div>
                                        <div className="text-[12px] text-gray-800 leading-tight break-words">{c?.texto}</div>
                                      </div>
                                    </div>
                                  )
                                })}
                                {(commentsByPostId[String(viewerPostId)] || []).length > 15 && (
                                  <button onClick={() => { closeImageViewer(); toggleComments(viewerPostId); }} className="text-blue-600 text-xs font-bold hover:underline w-full text-left pl-9">Ver mais comentários</button>
                                )}
                                {(commentsByPostId[String(viewerPostId)] || []).length === 0 && (
                                  <div className="text-center text-gray-400 text-xs py-4">Sem comentários ainda</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Ações e Input fixos */}
                        <div className="p-4 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-1 mb-4">
                            <div 
                              className="flex-1 relative"
                              onMouseEnter={() => handleLikeMouseEnter(viewerPostId)}
                              onMouseLeave={handleLikeMouseLeave}
                            >
                              <button 
                                onClick={() => toggleLike(viewerPostId, 'like')}
                                className={`w-full h-10 flex items-center justify-center gap-2 rounded-xl transition-all font-bold text-sm ${isLiked ? reactionInfo.color + ' bg-gray-50' : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                {isLiked ? <span className="text-lg leading-none">{reactionInfo.emoji}</span> : '👍'}
                                {isLiked ? reactionInfo.label : 'Gosto'}
                              </button>

                              {openReactionPickerPostId === viewerPostId && (
                                <div className="absolute bottom-full left-0 mb-2 p-1 bg-white border border-gray-200 rounded-full shadow-2xl flex items-center gap-1 z-[130] animate-in fade-in slide-in-from-bottom-2">
                                  {REACTION_TYPES.map((r) => (
                                    <button
                                      key={r.type}
                                      onClick={() => { toggleLike(viewerPostId, r.type); setOpenReactionPickerPostId(null); }}
                                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-125 transition-all"
                                    >
                                      <span className="text-2xl">{r.emoji}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => { closeImageViewer(); toggleComments(viewerPostId); }}
                              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl hover:bg-gray-100 text-gray-600 font-bold text-sm transition-all"
                            >
                              💬 Comentar
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <img src={user?.avatarUrl ? absoluteAssetUrl(user.avatarUrl) : defaultAvatarUrl} className="w-8 h-8 rounded-full border border-gray-100 object-cover" alt="" />
                            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
                              <input 
                                value={commentDraftByPostId[String(viewerPostId)] || ''}
                                onChange={(e) => setCommentDraftByPostId(prev => ({ ...prev, [String(viewerPostId)]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') sendComment(viewerPostId); }}
                                placeholder="Escreva um comentário..."
                                className="flex-1 bg-transparent text-sm focus:outline-none py-0.5"
                              />
                              <button 
                                onClick={() => sendComment(viewerPostId)}
                                disabled={!!sendingCommentByPostId[String(viewerPostId)] || !(commentDraftByPostId[String(viewerPostId)] || '').trim()}
                                className="text-blue-600 font-bold text-sm disabled:opacity-40"
                              >
                                {sendingCommentByPostId[String(viewerPostId)] ? '...' : 'Enviar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <aside className="hidden xl:block xl:col-span-3">
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
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${isFollowing(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
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

