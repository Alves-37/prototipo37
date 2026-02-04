import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal';
import api from '../services/api'
import { uploadsUrl } from '../services/url'
import { io as ioClient } from 'socket.io-client'

export default function PerfilEmpresa() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const { id } = useParams()
  const [editando, setEditando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  const [activePhotoUrl, setActivePhotoUrl] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  const [profilePosts, setProfilePosts] = useState([])
  const [profilePostsLoading, setProfilePostsLoading] = useState(false)
  const [profilePostsError, setProfilePostsError] = useState('')

  const [publicProfileUser, setPublicProfileUser] = useState(null)
  const [publicProfileLoading, setPublicProfileLoading] = useState(false)
  const [publicProfileError, setPublicProfileError] = useState('')
  const isOwnProfile = !id || (user && String(user.id ?? user._id ?? '') === String(id))
  const canEdit = !!user && user.tipo === 'empresa' && isOwnProfile

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

  // Upload de logo
  const fileInputRef = useRef();
  const [logoFileName, setLogoFileName] = useState('');

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData({ ...formData, logo: ev.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [followStatus, setFollowStatus] = useState('none')
  const [followRequestId, setFollowRequestId] = useState(null)
  const [followBusy, setFollowBusy] = useState(false)

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

  const resolveMaybeUploadUrl = (maybePath) => {
    if (!maybePath) return ''
    const raw = String(maybePath)
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
    return uploadsUrl(raw)
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
    setProfilePostsLoading(true)
    setProfilePostsError('')

    api.get('/posts', { params: { userId: profileUserId, page: 1, limit: 20 } })
      .then((resp) => {
        if (cancelled) return
        const posts = Array.isArray(resp.data?.posts) ? resp.data.posts : []
        setProfilePosts(posts)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar posts da empresa:', err)
        setProfilePostsError('Não foi possível carregar as publicações.')
        setProfilePosts([])
      })
      .finally(() => {
        if (cancelled) return
        setProfilePostsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canEdit, id, user?.id, user?._id])

  useEffect(() => {
    if (!id || String(id) === 'undefined' || String(id) === 'null') return
    if (!user || !user?.id) {
      setFollowStatus('none')
      setFollowRequestId(null)
      return
    }

    let cancelled = false
    api.get(`/connections/status/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (cancelled) return
        setFollowStatus(data?.status || 'none')
        setFollowRequestId(data?.requestId || null)
      })
      .catch(() => {
        if (cancelled) return
        setFollowStatus('none')
        setFollowRequestId(null)
      })

    return () => {
      cancelled = true
    }
  }, [id, user?.id])

  useEffect(() => {
    const targetId = id
    if (!targetId) return

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

    socket.on('connection:update', (evt) => {
      const evtTargetId = evt?.targetId
      const status = evt?.status
      if (!evtTargetId || !status) return
      if (String(evtTargetId) !== String(targetId)) return
      setFollowStatus(status)
      setFollowRequestId(evt?.requestId || null)
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
    }
  }, [id])

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

  useEffect(() => {
    const targetId = id || (canEdit ? (user?.id ?? user?._id ?? '') : '')
    if (!targetId || String(targetId) === 'undefined' || String(targetId) === 'null') return

    let cancelled = false
    setPublicProfileLoading(true)
    setPublicProfileError('')
    setPublicProfileUser(null)

    api.get(`/public/users/${targetId}`)
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
    setFormData(prev => ({
      ...prev,
      nome: profile.nome || prev.nome,
      descricao: profile.descricao || prev.descricao,
      setor: profile.setor || prev.setor,
      endereco: profile.endereco || prev.endereco,
      website: profile.website || prev.website,
      logo: profile.logo || prev.logo,
    }))
  }, [canEdit, id, profile])

  // Card de perfil da empresa
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
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-fuchsia-500 via-rose-500 to-amber-400"
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
                        onClick={() => setEditando(true)}
                        className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gray-900 text-white shadow-lg hover:bg-black transition flex items-center justify-center"
                        title="Editar perfil"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" /></svg>
                      </button>
                    ) : null}

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
                          href={`https://${formData.website || profile.website}`}
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

              <div className="mt-4 flex items-center gap-6 text-sm text-gray-800">
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
                            href={`https://${formData.website || profile.website}`}
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
            <div className="grid grid-cols-3 py-3 text-xs font-semibold text-gray-600">
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
              <div className="space-y-4">
                {profilePosts.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4">
                      {p.texto ? (
                        <div className="text-sm text-gray-800 leading-relaxed">{p.texto}</div>
                      ) : null}
                      {p.imageUrl ? (
                        <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden bg-white">
                          <img src={resolveMaybeUploadUrl(p.imageUrl)} alt="" className="w-full max-h-96 object-cover" />
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <div>{p?.counts?.likes ?? 0} reações</div>
                        <div>{p?.counts?.comments ?? 0} comentários</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
                Sem publicações por enquanto.
              </div>
            )
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
              Sem publicações por enquanto.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Formulário de edição
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