import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal';
import api from '../services/api'
import { normalizeExternalUrl, uploadsUrl } from '../services/url'
import { io as ioClient } from 'socket.io-client'
import { mensagemService } from '../services/mensagemService'

export default function PerfilEmpresa() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const { id } = useParams()
  const [editando, setEditando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [activePhotoUrl, setActivePhotoUrl] = useState('')
  const [activePostModal, setActivePostModal] = useState(null)
  const [activeProdutoModal, setActiveProdutoModal] = useState(null)
  const [editingPost, setEditingPost] = useState(false)
  const [editingPostText, setEditingPostText] = useState('')
  const [editingPostMediaDataUrl, setEditingPostMediaDataUrl] = useState('')
  const [savingPost, setSavingPost] = useState(false)
  const [savingPostError, setSavingPostError] = useState('')
  const [confirmDeletePostId, setConfirmDeletePostId] = useState(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [produtos, setProdutos] = useState([])
  const [produtosLoading, setProdutosLoading] = useState(false)
  const [produtosError, setProdutosError] = useState('')
  const [profilePosts, setProfilePosts] = useState([])
  const [profilePostsLoading, setProfilePostsLoading] = useState(false)
  const [profilePostsError, setProfilePostsError] = useState('')
  const [publicProfileUser, setPublicProfileUser] = useState(null)
  const [publicProfileLoading, setPublicProfileLoading] = useState(false)
  const [publicProfileError, setPublicProfileError] = useState('')
  const isOwnProfile = !id || (user && String(user.id ?? user._id ?? '') === String(id))
  const canEdit = !!user && user.tipo === 'empresa' && isOwnProfile
  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [creatingPost, setCreatingPost] = useState(false)
  const [createPostError, setCreatePostError] = useState('')
  const [newPostType, setNewPostType] = useState('normal')
  const [newPostText, setNewPostText] = useState('')
  const [newPostImageDataUrl, setNewPostImageDataUrl] = useState('')
  const [newPostServicePrice, setNewPostServicePrice] = useState('')
  const [newPostServiceCategory, setNewPostServiceCategory] = useState('')
  const [newPostServiceLocation, setNewPostServiceLocation] = useState('')
  const [newPostServiceWhatsapp, setNewPostServiceWhatsapp] = useState('')
  const [newPostCtaText, setNewPostCtaText] = useState('')
  const [newPostCtaUrl, setNewPostCtaUrl] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    nuit: '',
    email: '',
    telefone: '',
    endereco: '',
    descricao: '',
    setor: '',
    tamanho: '',
    website: '',
    alvara: '',
    registroComercial: '',
    inscricaoFiscal: '',
    anoFundacao: '',
    capitalSocial: '',
    moedaCapital: 'MT',
    logo: '',
  })
  const [followStatus, setFollowStatus] = useState('none')
  const [followRequestId, setFollowRequestId] = useState(null)
  const [followBusy, setFollowBusy] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const fileInputRef = useRef();
  const [logoFileName, setLogoFileName] = useState('');

  const handleLogoChange = (e) => {
    try {
      const file = e?.target?.files?.[0]
      if (!file) return

      setLogoFileName(file.name || '')

      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = String(ev?.target?.result || '')
        setFormData(prev => ({
          ...(prev || {}),
          logo: dataUrl,
        }))
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Erro ao carregar logo:', err)
    }
  }

  const montarDraftProduto = (produto) => {
    try {
      const titulo = produto?.titulo || 'Produto'
      const preco = produto?.preco !== undefined && produto?.preco !== null
        ? String(produto.preco)
        : (produto?.precoSobConsulta ? 'Sob consulta' : '')

      const tipoVenda = produto?.tipoVenda || ''
      const tipoLinha = tipoVenda ? (tipoVenda === 'estoque' ? 'Em estoque' : (tipoVenda === 'sob_encomenda' ? 'Sob encomenda' : tipoVenda)) : ''

      const entrega = produto?.entregaDisponivel ? 'Sim' : 'Não'
      const retirada = produto?.retiradaDisponivel ? 'Sim' : 'Não'
      const zona = produto?.zonaEntrega || ''
      const custo = produto?.custoEntrega !== undefined && produto?.custoEntrega !== null ? String(produto.custoEntrega) : ''
      const local = produto?.localRetirada || ''

      const link = produto?.id ? `/produto/${encodeURIComponent(produto.id)}` : ''

      const linhas = [
        `Olá! Tenho interesse no produto: ${titulo}`,
        preco ? `Preço: ${preco}` : null,
        tipoLinha ? `Tipo: ${tipoLinha}` : null,
        `Entrega: ${entrega}${zona ? ` (${zona})` : ''}${custo ? ` | Custo: ${custo}` : ''}`,
        `Retirada: ${retirada}${local ? ` (${local})` : ''}`,
        link ? `Link: ${link}` : null,
        'Quantidade: 1',
      ].filter(Boolean)

      return linhas.join('\n')
    } catch {
      return 'Olá! Tenho interesse nesse produto.'
    }
  }

  const openChatWithProduto = async (produto) => {
    try {
      const targetId = id || profile?.id
      if (!targetId) return
      if (!user || !user?.id) {
        navigate('/login')
        return
      }
      const conversa = await mensagemService.iniciarConversa(targetId, null)
      const conversaId = conversa?.id || conversa?.conversaId
      if (!conversaId) return
      navigate(`/mensagens?chat=${encodeURIComponent(conversaId)}`, {
        state: { draftMessage: montarDraftProduto(produto) }
      })
    } catch (e) {
      console.error('Erro ao abrir chat com produto:', e)
    }
  }

  const toggleFollow = async () => {
    if (!id) return
    if (!user || !user?.id) {
      navigate('/login')
      return
    }

    if (followBusy) return
    setFollowBusy(true)
    try {
      if (followStatus === 'connected' || followStatus === 'pending_outgoing') {
        await api.delete(`/connections/${encodeURIComponent(id)}`)
        setFollowStatus('none')
        setFollowRequestId(null)
      } else {
        const { data } = await api.post(`/connections/${encodeURIComponent(id)}`)
        setFollowStatus(data?.status || 'pending_outgoing')
        setFollowRequestId(data?.requestId || null)
      }
    } catch (e) {
      console.error('Erro ao seguir/remover conexão:', e)
    } finally {
      setFollowBusy(false)
    }
  }

  const profile = canEdit
    ? user
    : (publicProfileUser
        ? {
            ...publicProfileUser,
            ...(publicProfileUser.perfil || {}),
            logo: publicProfileUser?.perfil?.logo || publicProfileUser?.logo || '',
            capa: publicProfileUser?.perfil?.capa || publicProfileUser?.capa || '',
            descricao: publicProfileUser?.perfil?.descricao || publicProfileUser?.descricao || '',
            setor: publicProfileUser?.perfil?.setor || publicProfileUser?.setor || '',
            tamanho: publicProfileUser?.perfil?.tamanho || publicProfileUser?.tamanho || '',
            website: publicProfileUser?.perfil?.website || publicProfileUser?.website || '',
            endereco: publicProfileUser?.perfil?.endereco || publicProfileUser?.endereco || '',
          }
        : { nome: 'Empresa', descricao: 'Perfil público da empresa.', endereco: 'Moçambique' })

  const isVideoAttachment = (maybeUrl) => {
    const raw = String(maybeUrl || '')
    if (!raw) return false
    if (raw.startsWith('data:video/')) return true
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(raw)
  }

  const resolveMaybeUploadUrl = (maybePath) => {
    if (!maybePath) return ''
    const raw = String(maybePath)
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
    return uploadsUrl(raw)
  }

  const reelsPosts = Array.isArray(profilePosts)
    ? profilePosts.filter(p => p?.imageUrl && isVideoAttachment(p.imageUrl))
    : []

  const startEditPost = (post) => {
    if (!post) return
    setEditingPost(true)
    setSavingPostError('')
    setEditingPostText(String(post?.texto || ''))
    setEditingPostMediaDataUrl('')
  }

  const onPickEditPostMedia = (e) => {
    try {
      const file = e?.target?.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = String(ev?.target?.result || '')
        setEditingPostMediaDataUrl(dataUrl)
      }
      reader.readAsDataURL(file)
    } catch {}
  }

  const saveEditingPost = async () => {
    const postId = activePostModal?.id
    if (!canEdit) return
    if (!postId) return

    setSavingPost(true)
    setSavingPostError('')
    try {
      const payload = {
        texto: String(editingPostText || '').trim(),
      }
      if (editingPostMediaDataUrl) {
        payload.imageUrl = String(editingPostMediaDataUrl).trim() || null
      }

      const { data } = await api.put(`/posts/${encodeURIComponent(postId)}`, payload)

      const pickNextImageUrl = (prevImageUrl) => {
        const hasPayloadImageUrl = Object.prototype.hasOwnProperty.call(payload, 'imageUrl')
        if (hasPayloadImageUrl) return payload.imageUrl

        const respImageUrl = data?.imageUrl
        if (respImageUrl === undefined || respImageUrl === null) return prevImageUrl
        const respStr = String(respImageUrl)
        if (!respStr.trim()) return prevImageUrl
        return respImageUrl
      }

      setProfilePosts(prev => (Array.isArray(prev)
        ? prev.map(it => (String(it.id) === String(postId)
          ? { ...it, ...(data || {}), texto: data?.texto ?? payload.texto ?? it.texto, imageUrl: pickNextImageUrl(it.imageUrl) }
          : it))
        : prev
      ))

      setActivePostModal(prev => (prev && String(prev.id) === String(postId)
        ? { ...prev, ...(data || {}), texto: data?.texto ?? payload.texto ?? prev.texto, imageUrl: pickNextImageUrl(prev.imageUrl) }
        : prev))
      setEditingPost(false)
      setEditingPostMediaDataUrl('')
    } catch (e) {
      const msg = e?.response?.data?.error || 'Não foi possível salvar a publicação agora.'
      setSavingPostError(msg)
    } finally {
      setSavingPost(false)
    }
  }

  const deletePost = async (postId) => {
    if (!canEdit) return
    if (!postId) return
    try {
      await api.delete(`/posts/${encodeURIComponent(postId)}`)
      setProfilePosts(prev => (Array.isArray(prev) ? prev.filter(it => String(it.id) !== String(postId)) : prev))
      if (activePostModal && String(activePostModal.id) === String(postId)) {
        setActivePostModal(null)
      }
    } catch (e) {
      const msg = e?.response?.data?.error || 'Não foi possível apagar a publicação agora.'
      setSavingPostError(msg)
    }
  }

  const postsCount = (typeof publicProfileUser?.stats?.posts === 'number')
    ? publicProfileUser.stats.posts
    : (Array.isArray(profilePosts) ? profilePosts.length : 0)

  const followersCount = (typeof publicProfileUser?.stats?.followers === 'number')
    ? publicProfileUser.stats.followers
    : 0

  const followingCount = (typeof publicProfileUser?.stats?.following === 'number')
    ? publicProfileUser.stats.following
    : 0

  useEffect(() => {
    const profileUserId = canEdit ? (user?.id ?? user?._id ?? '') : (id ?? '')
    if (!profileUserId || String(profileUserId) === 'undefined' || String(profileUserId) === 'null') return

    let cancelled = false
    setPublicProfileLoading(true)
    setPublicProfileError('')

    api.get(`/public/users/${profileUserId}`)
      .then((resp) => {
        if (cancelled) return
        setPublicProfileUser(resp.data || null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar perfil público da empresa:', err)
        setPublicProfileError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (cancelled) return
        setPublicProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canEdit, id, user?.id, user?._id])

  useEffect(() => {
    if (canEdit) {
      setFormData({
        nome: user.nome || '',
        razaoSocial: user.razaoSocial || user.perfil?.razaoSocial || '',
        nuit: user.nuit || user.perfil?.nuit || '',
        email: user.email || '',
        telefone: user.telefone || user.perfil?.telefone || '',
        endereco: user.endereco || user.perfil?.endereco || '',
        descricao: user.descricao || user.perfil?.descricao || '',
        setor: user.setor || user.perfil?.setor || '',
        tamanho: user.tamanho || user.perfil?.tamanho || '',
        website: user.website || user.perfil?.website || '',
        alvara: user.alvara || user.perfil?.alvara || '',
        registroComercial: user.registroComercial || user.perfil?.registroComercial || '',
        inscricaoFiscal: user.inscricaoFiscal || user.perfil?.inscricaoFiscal || '',
        anoFundacao: user.anoFundacao || user.perfil?.anoFundacao || '',
        capitalSocial: user.capitalSocial || user.perfil?.capitalSocial || '',
        moedaCapital: user.moedaCapital || user.perfil?.moedaCapital || 'MT',
        logo: user.logo || user.perfil?.logo || '',
      })
    }
  }, [user, canEdit])

  useEffect(() => {
    if (canEdit) return
    if (!profile) return
    setFormData(prev => {
      const next = {
        ...prev,
        nome: profile.nome || prev.nome,
        descricao: profile.descricao || prev.descricao,
        setor: profile.setor || prev.setor,
        endereco: profile.endereco || prev.endereco,
        website: profile.website || prev.website,
        logo: profile.logo || prev.logo,
      }

      if (
        next.nome === prev.nome &&
        next.descricao === prev.descricao &&
        next.setor === prev.setor &&
        next.endereco === prev.endereco &&
        next.website === prev.website &&
        next.logo === prev.logo
      ) {
        return prev
      }

      return next
    })
  }, [canEdit, id, profile])

  // Socket for real-time updates
  useEffect(() => {
    if (!user?.id) return
    
    const socket = ioClient(api.defaults.baseURL, {
      auth: { token: user.token || localStorage.getItem('token') },
      transports: ['websocket']
    })
    
    socket.on('connect', () => {
      console.log('Socket conectado (PerfilEmpresa)')
    })
    
    socket.on('post:new', (evt) => {
      const item = evt?.item
      if (!item || item.type !== 'post') return
      const userId = item?.userId || item?.author?.id
      if (!userId) return
      
      const profileUserId = canEdit ? (user?.id ?? user?._id ?? '') : (id ?? '')
      if (String(userId) === String(profileUserId)) {
        setProfilePosts(prev => [item, ...(Array.isArray(prev) ? prev : [])])
      }
    })
    
    socket.on('post:update', (evt) => {
      const postId = evt?.postId
      const item = evt?.item
      if (!postId) return
      
      const updateList = (list) => {
        if (!Array.isArray(list)) return list
        return list.map(p => (String(p.id) === String(postId) ? { ...p, ...(item || {}) } : p))
      }
      setProfilePosts(updateList)
    })
    
    return () => {
      try {
        socket.disconnect()
      } catch {}
    }
  }, [user?.id, user?.token, canEdit, id])
  
  // Fetch posts for the profile
  useEffect(() => {
    if (activeTab !== 'posts' && activeTab !== 'reels') return
    const profileUserId = canEdit ? (user?.id ?? user?._id ?? '') : (id ?? '')
    console.log('PerfilEmpresa: Carregando posts para profileUserId:', profileUserId)
    if (!profileUserId || String(profileUserId) === 'undefined' || String(profileUserId) === 'null') return
    
    let cancelled = false
    setProfilePostsLoading(true)
    setProfilePostsError('')
    
    api.get(`/posts?userId=${profileUserId}&page=1&limit=24`)
      .then((resp) => {
        if (cancelled) return
        console.log('PerfilEmpresa: Posts recebidos:', resp.data)
        // A API retorna {posts: [...], total, page, totalPages}
        const posts = resp.data?.posts || resp.data || []
        setProfilePosts(posts)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar posts do perfil:', err)
        setProfilePostsError('Não foi possível carregar as publicações.')
      })
      .finally(() => {
        if (cancelled) return
        setProfilePostsLoading(false)
      })
    
    return () => {
      cancelled = true
    }
  }, [activeTab, canEdit, id, user?.id, user?._id])

  // Fetch products for the company
  useEffect(() => {
    if (activeTab !== 'produtos') return
    const profileUserId = canEdit ? (user?.id ?? user?._id ?? '') : (id ?? '')
    if (!profileUserId || String(profileUserId) === 'undefined' || String(profileUserId) === 'null') return
    
    let cancelled = false
    setProdutosLoading(true)
    setProdutosError('')
    
    api.get(`/produtos?empresaId=${profileUserId}&page=1&limit=24`)
      .then((resp) => {
        if (cancelled) return
        setProdutos(resp.data || [])
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar produtos:', err)
        setProdutosError('Não foi possível carregar os produtos.')
      })
      .finally(() => {
        if (cancelled) return
        setProdutosLoading(false)
      })
    
    return () => {
      cancelled = true
    }
  }, [activeTab, canEdit, id, user?.id, user?._id])

  const resetNewPostForm = () => {
    setNewPostType('normal')
    setNewPostText('')
    setNewPostImageDataUrl('')
    setNewPostServicePrice('')
    setNewPostServiceCategory('')
    setNewPostServiceLocation('')
    setNewPostServiceWhatsapp('')
    setNewPostCtaText('')
    setNewPostCtaUrl('')
    setCreatePostError('')
  }

  const onPickNewPostImage = (e) => {
    try {
      const file = e?.target?.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = String(ev?.target?.result || '')
        setNewPostImageDataUrl(dataUrl)
      }
      reader.readAsDataURL(file)
    } catch {}
  }

  const submitNewPost = async () => {
    if (!canEdit) return

    const type = String(newPostType || 'normal').toLowerCase()
    const payload = {
      postType: type,
      texto: String(newPostText || '').trim(),
      imageUrl: String(newPostImageDataUrl || '').trim() || null,
    }

    if (type === 'servico') {
      payload.servicePrice = String(newPostServicePrice || '').trim() || null
      payload.serviceCategory = String(newPostServiceCategory || '').trim()
      payload.serviceLocation = String(newPostServiceLocation || '').trim()
      payload.serviceWhatsapp = String(newPostServiceWhatsapp || '').trim() || null
      payload.ctaText = String(newPostCtaText || '').trim() || null
      payload.ctaUrl = normalizeExternalUrl(String(newPostCtaUrl || '').trim() || null)
    }

    setCreatingPost(true)
    setCreatePostError('')
    try {
      const { data } = await api.post('/posts', payload)
      setProfilePosts(prev => [data, ...(Array.isArray(prev) ? prev : [])])
      setShowCreatePostModal(false)
      resetNewPostForm()
    } catch (e) {
      const msg = e?.response?.data?.error || 'Não foi possível publicar agora.'
      setCreatePostError(msg)
    } finally {
      setCreatingPost(false)
    }
  }

  const renderCard = () => (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative">
          <div className="h-40 sm:h-52 md:h-64 bg-gray-200" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />

          <div className="max-w-4xl mx-auto px-4">
            <div className="relative -mt-6 sm:-mt-14 md:-mt-16 pt-4 sm:pt-0 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex items-start sm:items-end gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = formData.logo || profile.logo
                        const resolved = resolveMaybeUploadUrl(url)
                        if (resolved) setActivePhotoUrl(resolved)
                      }}
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600"
                      aria-label="Ver foto do perfil"
                    >
                      <div className="w-full h-full rounded-full bg-white p-[3px]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          {formData.logo || profile.logo ? (
                            <img
                              src={resolveMaybeUploadUrl(formData.logo || profile.logo)}
                              alt="Logo da empresa"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl md:text-5xl text-gray-700 font-extrabold select-none">
                              {(formData.nome || profile.nome || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="absolute -bottom-1 -left-1 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
                        title="Carregar logo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4l2-2h6l2 2h4v12H3V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100 6 3 3 0 000-6z" /></svg>
                      </button>
                    ) : null}

                  </div>

                  <div className="pb-2 sm:pb-1 mt-1 sm:mt-0">
                    <div className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {formData.nome || profile.nome || 'Empresa'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {(formData.setor || profile.setor) ? (
                        <span className="font-semibold text-gray-800">{formData.setor || profile.setor}</span>
                      ) : null}
                      {(formData.setor || profile.setor) && (formData.endereco || profile.endereco) ? (
                        <span className="mx-2 text-gray-300">|</span>
                      ) : null}
                      {(formData.endereco || profile.endereco) ? (
                        <span>{formData.endereco || profile.endereco}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-2">
                  {canEdit ? (
                    <button
                      onClick={() => setEditando(true)}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
                    >
                      Editar perfil
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={toggleFollow}
                        disabled={followBusy}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${followStatus === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' : followStatus === 'pending_outgoing' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {followBusy
                          ? 'Aguarde...'
                          : (followStatus === 'connected'
                              ? 'Seguindo'
                              : followStatus === 'pending_outgoing'
                                ? 'Pendente'
                                : 'Seguir')}
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition">
                        Mensagem
                      </button>
                      {(formData.website || profile.website) ? (
                        <a
                          href={normalizeExternalUrl(formData.website || profile.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition"
                        >
                          Website
                        </a>
                      ) : null}
                    </>
                  )}

                  {canEdit ? (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div>
                  <span className="font-semibold">{postsCount}</span> publicações
                </div>
                <div>
                  <span className="font-semibold">{followersCount.toLocaleString('pt-PT')}</span> seguidores
                </div>
                <div>
                  <span className="font-semibold">{followingCount.toLocaleString('pt-PT')}</span> seguindo
                </div>
              </div>

              {canEdit && user.plano ? (
                <div className="mt-3 inline-flex">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border
                    ${user.plano === 'empresarial' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                      user.plano === 'premium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      user.plano === 'basico' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      'bg-gray-100 text-gray-500 border-gray-300'}`}
                  >
                    {user.plano === 'empresarial' ? 'Empresa Empresarial' :
                      user.plano === 'premium' ? 'Empresa Premium' :
                      user.plano === 'basico' ? 'Empresa em Destaque' :
                      'Empresa Básica'}
                    <span className="ml-2 text-green-600 font-bold">• Ativo</span>
                  </span>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="font-bold text-gray-900">Sobre</div>
                    <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                      {formData.descricao || profile.descricao || 'Perfil público da empresa.'}
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      {(formData.endereco || profile.endereco) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📍</span>
                          <span>{formData.endereco || profile.endereco}</span>
                        </div>
                      ) : null}
                      {(formData.website || profile.website) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🌐</span>
                          <a
                            href={normalizeExternalUrl(formData.website || profile.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 font-semibold hover:text-blue-900 transition break-all"
                          >
                            {formData.website || profile.website}
                          </a>
                        </div>
                      ) : null}
                      {(formData.setor || profile.setor) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🏢</span>
                          <span>{formData.setor || profile.setor}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-900">Destaques</div>
                      <div className="text-xs text-gray-500">Highlights</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">Sem destaques.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-4 py-3 text-xs font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`text-center py-2 rounded-lg transition ${activeTab === 'posts' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                PUBLICAÇÕES
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reels')}
                className={`text-center py-2 rounded-lg transition ${activeTab === 'reels' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                REELS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mentions')}
                className={`text-center py-2 rounded-lg transition ${activeTab === 'mentions' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                MENÇÕES
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('produtos')}
                className={`text-center py-2 rounded-lg transition ${activeTab === 'produtos' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                PRODUTOS
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-1 sm:px-4 pb-6">
          {activeTab === 'posts' ? (
            profilePostsLoading ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-600 shadow-sm">
                Carregando publicações...
              </div>
            ) : profilePostsError ? (
              <div className="bg-white border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-sm">
                {profilePostsError}
              </div>
            ) : (Array.isArray(profilePosts) && profilePosts.length > 0) ? (
              <div className="space-y-3">
                {canEdit ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900">Publicações</div>
                      <div className="text-sm text-gray-600">Crie posts e divulgue seus serviços.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { resetNewPostForm(); setShowCreatePostModal(true) }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 transition"
                    >
                      Nova publicação
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {profilePosts.map(p => {
                    const mediaUrl = p?.imageUrl ? resolveMaybeUploadUrl(p.imageUrl) : ''
                    const isVideo = !!p?.imageUrl && isVideoAttachment(p.imageUrl)

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePostModal(p)}
                        className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                        title="Abrir publicação"
                      >
                        {mediaUrl ? (
                          isVideo ? (
                            <>
                              <video
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="none"
                              />
                              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-extrabold bg-black/60 text-white">
                                Vídeo
                              </div>
                            </>
                          ) : (
                            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                          )
                        ) : (
                          <div className="w-full h-full p-2 flex items-end justify-start">
                            <div className="text-[11px] text-gray-700 text-left line-clamp-4">
                              {String(p?.texto || '').trim() || 'Publicação'}
                            </div>
                          </div>
                        )}

                        {String(p?.postType || 'normal').toLowerCase() === 'servico' ? (
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500/90 text-white">
                            Serviço
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <Modal
                  isOpen={!!activePostModal}
                  onClose={() => setActivePostModal(null)}
                  title={String(activePostModal?.postType || 'post').toLowerCase() === 'servico' ? 'Serviço' : 'Publicação'}
                >
                  {activePostModal ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-extrabold text-gray-900 truncate">{formData.nome || profile.nome || 'Empresa'}</div>
                        <div className="flex items-center gap-2">
                          {canEdit ? (
                            <>
                              {!editingPost ? (
                                <button
                                  type="button"
                                  onClick={() => startEditPost(activePostModal)}
                                  className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition"
                                >
                                  Editar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPost(false)
                                    setEditingPostMediaDataUrl('')
                                    setSavingPostError('')
                                  }}
                                  className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePostId(activePostModal?.id || null)}
                                className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-red-700 border border-red-200 hover:bg-red-50 transition"
                              >
                                Apagar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const pid = activePostModal?.id
                                if (!pid) return
                                navigate(`/denuncias?tipo=post&refId=${encodeURIComponent(pid)}`)
                                setActivePostModal(null)
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-red-700 border border-red-200 hover:bg-red-50 transition"
                            >
                              Denunciar
                            </button>
                          )}
                        </div>
                      </div>

                      {savingPostError ? (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{savingPostError}</div>
                      ) : null}

                      {editingPost ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingPostText}
                            onChange={(e) => setEditingPostText(e.target.value)}
                            className="w-full min-h-24 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white"
                            placeholder="Escreva algo..."
                          />

                          <div className="flex items-center justify-between gap-2">
                            <label className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                              Trocar mídia
                              <input type="file" accept="image/*,video/*" className="hidden" onChange={onPickEditPostMedia} />
                            </label>
                            <button
                              type="button"
                              disabled={savingPost}
                              onClick={saveEditingPost}
                              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                            >
                              {savingPost ? 'Salvando...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      ) : (activePostModal?.texto ? (
                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{activePostModal.texto}</div>
                      ) : null)}

                      {(editingPost && editingPostMediaDataUrl) || activePostModal?.imageUrl ? (
                        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                          {isVideoAttachment(editingPostMediaDataUrl || activePostModal.imageUrl) ? (
                            <video
                              src={resolveMaybeUploadUrl(editingPostMediaDataUrl || activePostModal.imageUrl)}
                              className="w-full max-h-[70vh] object-contain bg-black"
                              controls
                              playsInline
                            />
                          ) : (
                            <img
                              src={resolveMaybeUploadUrl(editingPostMediaDataUrl || activePostModal.imageUrl)}
                              alt=""
                              className="w-full max-h-[70vh] object-contain bg-black"
                              onClick={() => setActivePhotoUrl(resolveMaybeUploadUrl(editingPostMediaDataUrl || activePostModal.imageUrl))}
                            />
                          )}
                        </div>
                      ) : null}

                      {String(activePostModal?.postType || 'normal').toLowerCase() === 'servico' && (activePostModal?.serviceWhatsapp || (activePostModal?.ctaText && activePostModal?.ctaUrl)) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activePostModal?.serviceWhatsapp ? (
                            <a
                              href={`https://wa.me/${encodeURIComponent(String(activePostModal.serviceWhatsapp).replace(/[^0-9+]/g, '').replace(/^\+/, ''))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-10 rounded-lg text-sm font-extrabold transition flex items-center justify-center bg-green-600 text-white hover:bg-green-700"
                            >
                              WhatsApp
                            </a>
                          ) : null}
                          {activePostModal?.ctaText && activePostModal?.ctaUrl ? (
                            <a
                              href={normalizeExternalUrl(activePostModal.ctaUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-10 rounded-lg text-sm font-extrabold transition flex items-center justify-center bg-gray-900 text-white hover:bg-black"
                            >
                              {activePostModal.ctaText}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </Modal>

                <Modal
                  isOpen={!!confirmDeletePostId}
                  onClose={() => setConfirmDeletePostId(null)}
                  title="Apagar publicação"
                >
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">Tem certeza que deseja apagar esta publicação? Esta ação não pode ser desfeita.</div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePostId(null)}
                        className="px-4 py-2 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 text-sm font-extrabold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const pid = confirmDeletePostId
                          setConfirmDeletePostId(null)
                          await deletePost(pid)
                        }}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-extrabold"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                </Modal>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
                Sem publicações por enquanto.
              </div>
            )
          ) : activeTab === 'reels' ? (
            reelsPosts.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {reelsPosts.map(p => {
                    const mediaUrl = p?.imageUrl ? resolveMaybeUploadUrl(p.imageUrl) : ''
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePostModal(p)}
                        className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                        title="Abrir reel"
                      >
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="none"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-extrabold bg-black/60 text-white">
                          Reel
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
                Sem reels por enquanto.
              </div>
            )
          ) : activeTab === 'produtos' ? (
            <div className="space-y-3">
              {produtosLoading ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-600 shadow-sm">
                  Carregando produtos...
                </div>
              ) : produtosError ? (
                <div className="bg-white border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-sm">
                  {produtosError}
                </div>
              ) : (Array.isArray(produtos) && produtos.length > 0) ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {produtos.map(p => {
                      const firstMedia = Array.isArray(p?.imagens) && p.imagens.length > 0 ? String(p.imagens[0] || '') : ''
                      const mediaUrl = firstMedia ? resolveMaybeUploadUrl(firstMedia) : ''
                      const isVideo = !!firstMedia && isVideoAttachment(firstMedia)

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActiveProdutoModal(p)}
                          className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                          title="Abrir produto"
                        >
                          {mediaUrl ? (
                            isVideo ? (
                              <>
                                <video
                                  src={mediaUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="none"
                                />
                                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-extrabold bg-black/60 text-white">
                                  Vídeo
                                </div>
                              </>
                            ) : (
                              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="w-full h-full p-2 flex items-end justify-start">
                              <div className="text-[11px] text-gray-700 text-left line-clamp-3">
                                {String(p?.titulo || '').trim() || 'Produto'}
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="px-2 py-1 rounded-lg bg-white/90 border border-white text-[11px] font-extrabold text-gray-900 truncate">
                              {p.titulo || 'Produto'}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <Modal
                    isOpen={!!activeProdutoModal}
                    onClose={() => setActiveProdutoModal(null)}
                    title="Produto"
                  >
                    {activeProdutoModal ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900 truncate">{activeProdutoModal.titulo}</div>
                            <div className="text-sm text-gray-600">{activeProdutoModal.preco || (activeProdutoModal.precoSobConsulta ? 'Sob consulta' : '')}</div>
                          </div>
                          <div className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-100">Produto</div>
                        </div>

                        {activeProdutoModal.descricao ? (
                          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{activeProdutoModal.descricao}</div>
                        ) : null}

                        {Array.isArray(activeProdutoModal.imagens) && activeProdutoModal.imagens.length > 0 ? (
                          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                            {isVideoAttachment(activeProdutoModal.imagens[0]) ? (
                              <video
                                src={resolveMaybeUploadUrl(activeProdutoModal.imagens[0])}
                                className="w-full max-h-[70vh] object-contain bg-black"
                                controls
                                playsInline
                              />
                            ) : (
                              <img
                                src={resolveMaybeUploadUrl(activeProdutoModal.imagens[0])}
                                alt=""
                                className="w-full max-h-[70vh] object-contain bg-black"
                                onClick={() => setActivePhotoUrl(resolveMaybeUploadUrl(activeProdutoModal.imagens[0]))}
                              />
                            )}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">Entrega: {activeProdutoModal.entregaDisponivel ? 'Sim' : 'Não'}</span>
                          <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">Retirada: {activeProdutoModal.retiradaDisponivel ? 'Sim' : 'Não'}</span>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => openChatWithProduto(activeProdutoModal)}
                            className="w-full h-10 rounded-lg text-sm font-extrabold transition flex items-center justify-center bg-gray-900 text-white hover:bg-black"
                          >
                            Mensagem
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </Modal>
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
                  Sem produtos por enquanto.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
              Sem publicações por enquanto.
            </div>
          )}
        </div>

      </div>
    </div>
  )

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-4 md:p-8 space-y-6 md:space-y-8 max-w-3xl mx-auto w-full border border-blue-100">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-3 flex flex-col items-center gap-2">
          {formData.logo ? (
            <img
              src={formData.logo}
              alt="Logo da empresa"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-5xl text-blue-700 font-extrabold select-none">
                {(formData.nome || user.nome || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleLogoChange}
            className="hidden"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition text-sm"
            >
              {formData.logo ? 'Trocar logo' : 'Carregar logo'}
            </button>
            {formData.logo && (
              <button
                type="button"
                onClick={() => { setFormData({ ...formData, logo: '' }); setLogoFileName(''); }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-red-700 transition text-sm"
              >
                Remover
              </button>
            )}
          </div>
          {logoFileName && (
            <div className="text-xs text-gray-500 mt-1">{logoFileName}</div>
          )}
        </div>
      </div>
      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Nome Fantasia *</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Razão Social</label>
              <input type="text" name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">NUIT</label>
              <input type="text" name="nuit" value={formData.nuit} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">E-mail *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Telefone</label>
              <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Endereço</label>
              <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-base font-semibold text-gray-700 mb-2">Descrição</label>
          <textarea name="descricao" value={formData.descricao} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg resize-none" rows={3} placeholder="Descreva sua empresa..." />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Setor</label>
          <input type="text" name="setor" value={formData.setor} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="Ex: Tecnologia, Saúde, Educação..." />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Número de Funcionários</label>
          <input type="text" name="tamanho" value={formData.tamanho} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="Ex: 10-50, 50-100..." />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Website</label>
          <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="www.suaempresa.co.mz" />
        </div>
        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Alvará</label>
          <input type="text" name="alvara" value={formData.alvara} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Registro Comercial</label>
              <input type="text" name="registroComercial" value={formData.registroComercial} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Inscrição Fiscal</label>
              <input type="text" name="inscricaoFiscal" value={formData.inscricaoFiscal} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Ano de Fundação</label>
          <input type="text" name="anoFundacao" value={formData.anoFundacao} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="Ex: 2020" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Capital Social</label>
              <input type="text" name="capitalSocial" value={formData.capitalSocial} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Moeda do Capital</label>
          <select name="moedaCapital" value={formData.moedaCapital} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg">
            <option value="MT">Meticais (MT)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition text-lg disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-400 transition text-lg"
        >
          Cancelar
        </button>
      </div>
    </form>
  )

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value ?? '',
    })
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setIsLoading(true);
    
    console.log('=== DEBUG: PerfilEmpresa - Enviando dados ===');
    console.log('Dados do formulário:', JSON.stringify(formData, null, 2));
    console.log('Usuário atual:', user);
    
    try {
      // Usar a função updateProfile do contexto de autenticação
      console.log('Chamando updateProfile...');
      const result = await updateProfile(formData);
      console.log('Resultado da atualização:', result);
      
      setSucesso('Perfil da empresa atualizado com sucesso!');
      setEditando(false);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      console.error('Erro na atualização:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      if (error.response && error.response.data && error.response.data.error) {
        setErro(error.response.data.error);
      } else {
        setErro('Erro ao atualizar perfil. Tente novamente.');
      }
      setTimeout(() => setErro(''), 4000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
      {/* Notificações */}
      {sucesso && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">✅ {sucesso}</p>
            </div>
            <div className="ml-auto pl-3">
              <button onClick={() => setSucesso('')} className="text-green-100 hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {erro && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">❌ {erro}</p>
            </div>
            <div className="ml-auto pl-3">
              <button onClick={() => setErro('')} className="text-red-100 hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {activePhotoUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black"
          onClick={() => setActivePhotoUrl('')}
        >
          <div
            className="relative w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full bg-black">
              <img
                src={activePhotoUrl}
                alt=""
                className="w-full h-full object-contain bg-black"
              />
              <button
                onClick={() => setActivePhotoUrl('')}
                className="fixed top-4 right-4 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/10"
                aria-label="Fechar foto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Conteúdo principal */}
      {(!canEdit && id && publicProfileLoading) ? (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-40 sm:h-52 md:h-64 bg-gray-200" />
            <div className="p-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-64 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-6">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 bg-gray-100 border border-gray-200 rounded-2xl p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="md:col-span-7 bg-gray-100 border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                  <div className="mt-3 h-3 w-2/3 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500 text-lg text-center px-4">Carregando...</div>
        </div>
      ) : !editando ? (
        <>
          <div className="mb-8">
            {renderCard()}
          </div>

          <Modal
            isOpen={showCreatePostModal}
            onClose={() => setShowCreatePostModal(false)}
            title="Nova publicação"
            size="md"
          >
            <div className="space-y-4">
              {createPostError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold">
                  {createPostError}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                <select
                  value={newPostType}
                  onChange={(e) => setNewPostType(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="normal">Post normal</option>
                  <option value="servico">Post de serviço</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Texto</label>
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  rows={4}
                  className="w-full p-3 border rounded-xl"
                  placeholder="Conte o que a sua empresa está a oferecer..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Imagem (opcional)</label>
                <input type="file" accept="image/*" onChange={onPickNewPostImage} className="w-full" />
                {newPostImageDataUrl ? (
                  <div className="mt-2 rounded-2xl border border-gray-200 overflow-hidden">
                    <img src={newPostImageDataUrl} alt="" className="w-full max-h-72 object-cover" />
                  </div>
                ) : null}
              </div>

              {String(newPostType).toLowerCase() === 'servico' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria *</label>
                      <input value={newPostServiceCategory} onChange={(e) => setNewPostServiceCategory(e.target.value)} className="w-full p-3 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Localização *</label>
                      <input value={newPostServiceLocation} onChange={(e) => setNewPostServiceLocation(e.target.value)} className="w-full p-3 border rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Preço (opcional)</label>
                      <input value={newPostServicePrice} onChange={(e) => setNewPostServicePrice(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Ex: 5.000 MT" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp (opcional)</label>
                      <input value={newPostServiceWhatsapp} onChange={(e) => setNewPostServiceWhatsapp(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Ex: +258841234567" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Texto do botão (opcional)</label>
                      <input value={newPostCtaText} onChange={(e) => setNewPostCtaText(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Ex: Ver portfólio" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Link do botão (opcional)</label>
                      <input value={newPostCtaUrl} onChange={(e) => setNewPostCtaUrl(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-extrabold hover:bg-gray-50 transition"
                  disabled={creatingPost}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitNewPost}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 transition disabled:opacity-60"
                  disabled={creatingPost}
                >
                  {creatingPost ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </Modal>
          
          {/* Modal de confirmação de exclusão */}
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir Conta">
            <div className="space-y-4">
              {!deleting ? (
                <>
                  <p className="text-red-700 font-semibold">Tem certeza que deseja excluir sua conta? Esta ação é irreversível.</p>
                  <div className="flex gap-4 justify-end">
                    <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button
                      onClick={async () => {
                        setDeleting(true);
                        setProgress(0);
                        
                        try {
                          // Simular progresso
                        let pct = 0;
                        const interval = setInterval(() => {
                            pct += 10;
                          setProgress(pct);
                            if (pct >= 90) {
                            clearInterval(interval);
                            }
                          }, 100);
                          
                          // Chamar função real de exclusão
                          await deleteAccount();
                          
                          // Completar progresso
                          setProgress(100);
                          
                          // Aguardar um pouco e redirecionar
                          setTimeout(() => {
                            navigate('/');
                            window.location.reload();
                          }, 1000);
                          
                        } catch (error) {
                          console.error('Erro ao excluir conta:', error);
                          setErro(error.response?.data?.error || 'Erro ao excluir conta');
                          setDeleting(false);
                          setProgress(0);
                          setTimeout(() => setErro(''), 5000);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <span className="text-6xl animate-bounce">😭</span>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-red-500 h-4 rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-gray-700 font-semibold">
                    Excluindo sua conta... ({progress}%)<br/>
                    Sentiremos sua falta!
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </>
      ) : renderForm()}
    </div>
  )
} 