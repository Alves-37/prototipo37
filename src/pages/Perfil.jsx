import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Modal from '../components/Modal'
import { useMonetizacao } from '../context/MonetizacaoContext';
import NotificacoesSwitch from '../components/NotificacoesSwitch';
import api from '../services/api'
import { uploadsUrl } from '../services/url'
import { io as ioClient } from 'socket.io-client'

export default function Perfil() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const { assinatura, planosCandidato } = useMonetizacao();
  const { id } = useParams()
  const navigate = useNavigate();
  const location = useLocation();
  const [publicActivePhotoUrl, setPublicActivePhotoUrl] = useState('')
  const [publicActiveTab, setPublicActiveTab] = useState('posts')
  const [publicProfilePosts, setPublicProfilePosts] = useState([])
  const [publicProfilePostsLoading, setPublicProfilePostsLoading] = useState(false)
  const [publicProfilePostsError, setPublicProfilePostsError] = useState('')
  const [ownProfilePosts, setOwnProfilePosts] = useState([])
  const [ownProfilePostsLoading, setOwnProfilePostsLoading] = useState(false)
  const [ownProfilePostsError, setOwnProfilePostsError] = useState('')
  const [editingOwnPostId, setEditingOwnPostId] = useState(null)
  const [editingOwnPostText, setEditingOwnPostText] = useState('')
  const [confirmDeleteOwnPostId, setConfirmDeleteOwnPostId] = useState(null)
  const [publicProfileUser, setPublicProfileUser] = useState(null)
  const [publicProfileLoading, setPublicProfileLoading] = useState(false)
  const [publicProfileError, setPublicProfileError] = useState('')

  const [publicConnectionStatus, setPublicConnectionStatus] = useState('none')
  const [publicConnectionRequestId, setPublicConnectionRequestId] = useState(null)

  const initialSecao = (() => {
    try {
      const params = new URLSearchParams(location.search);
      const fromQuery = params.get('secao');
      if (fromQuery) return fromQuery;
      const fromStorage = localStorage.getItem('perfil_secao');
      return fromStorage || 'pessoal';
    } catch {
      return 'pessoal';
    }
  })();
  const [secaoAtiva, setSecaoAtiva] = useState(initialSecao)
  const [editando, setEditando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const carregouDadosRef = useRef(false)
  const [formData, setFormData] = useState({
    // Informações pessoais
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.perfil?.telefone || '',
    dataNascimento: user?.perfil?.dataNascimento || '',
    endereco: user?.perfil?.endereco || '',
    bio: user?.perfil?.bio || '',
    
    // Informações profissionais
    formacao: user?.perfil?.formacao || '',
    instituicao: user?.perfil?.instituicao || '',
    experiencia: user?.perfil?.experiencia || '',
    habilidades: Array.isArray(user?.perfil?.habilidades) ? user?.perfil?.habilidades?.join(', ') : '',
    resumo: user?.perfil?.resumo || '',
    
    // Redes sociais
    linkedin: user?.perfil?.linkedin || '',
    github: user?.perfil?.github || '',
    portfolio: user?.perfil?.portfolio || '',
    behance: user?.perfil?.behance || '',
    instagram: user?.perfil?.instagram || '',
    twitter: user?.perfil?.twitter || '',
    
    // Preferências
    tipoTrabalho: user?.perfil?.tipoTrabalho || 'remoto',
    faixaSalarial: user?.perfil?.faixaSalarial || '15000-25000',
    localizacaoPreferida: user?.perfil?.localizacaoPreferida || 'Maputo',
    disponibilidade: user?.perfil?.disponibilidade || 'imediata',
    
    // CV
    cv: user?.perfil?.cv || user?.perfil?.curriculo || '',
    cvData: user?.perfil?.cvData || '',
    
    // Privacidade
    perfilPublico: user?.perfil?.perfilPublico !== undefined ? user?.perfil?.perfilPublico : true,
    mostrarTelefone: user?.perfil?.mostrarTelefone !== undefined ? user?.perfil?.mostrarTelefone : false,
    mostrarEndereco: user?.perfil?.mostrarEndereco !== undefined ? user?.perfil?.mostrarEndereco : false,
    
    // Notificações
    alertasVagas: user?.perfil?.alertasVagas !== undefined ? user?.perfil?.alertasVagas : true,
    frequenciaAlertas: user?.perfil?.frequenciaAlertas || 'diario',
    vagasInteresse: user?.perfil?.vagasInteresse || ['desenvolvedor', 'frontend', 'react'],
    foto: user?.perfil?.foto || '',
    capa: user?.perfil?.capa || '',
  })

  // Atualizar formData e idiomas quando user mudar
  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        nome: user.nome || '',
        email: user.email || '',
        telefone: user?.perfil?.telefone || '',
        dataNascimento: user?.perfil?.dataNascimento || '',
        endereco: user?.perfil?.endereco || '',
        bio: user?.perfil?.bio || '',
        formacao: user?.perfil?.formacao || '',
        instituicao: user?.perfil?.instituicao || '',
        experiencia: user?.perfil?.experiencia || '',
        habilidades: Array.isArray(user?.perfil?.habilidades) ? (user?.perfil?.habilidades || []).join(', ') : '',
        resumo: user?.perfil?.resumo || '',
        linkedin: user?.perfil?.linkedin || '',
        github: user?.perfil?.github || '',
        portfolio: user?.perfil?.portfolio || '',
        behance: user?.perfil?.behance || '',
        instagram: user?.perfil?.instagram || '',
        twitter: user?.perfil?.twitter || '',
        tipoTrabalho: user?.perfil?.tipoTrabalho || 'remoto',
        faixaSalarial: user?.perfil?.faixaSalarial || '15000-25000',
        localizacaoPreferida: user?.perfil?.localizacaoPreferida || 'Maputo',
        disponibilidade: user?.perfil?.disponibilidade || 'imediata',
        cv: user?.perfil?.cv || user?.perfil?.curriculo || '',
        cvData: user?.perfil?.cvData || '',
        perfilPublico: user?.perfil?.perfilPublico !== undefined ? user?.perfil?.perfilPublico : true,
        mostrarTelefone: user?.perfil?.mostrarTelefone !== undefined ? user?.perfil?.mostrarTelefone : false,
        mostrarEndereco: user?.perfil?.mostrarEndereco !== undefined ? user?.perfil?.mostrarEndereco : false,
        alertasVagas: user?.perfil?.alertasVagas !== undefined ? user?.perfil?.alertasVagas : true,
        frequenciaAlertas: user?.perfil?.frequenciaAlertas || 'diario',
        vagasInteresse: user?.perfil?.vagasInteresse || ['desenvolvedor', 'frontend', 'react'],
        foto: user?.perfil?.foto || '',
        capa: user?.perfil?.capa || '',
      });
      setIdiomas(Array.isArray(user?.perfil?.idiomas) ? (user?.perfil?.idiomas || []) : []);
      setCvDirty(false);
    }
  }, [user]);

  // Certificações reais do usuário
  const [certificacoes, setCertificacoes] = useState([])
  const [carregandoCertificacoes, setCarregandoCertificacoes] = useState(false)

  // Dados mockados para idiomas
  const [idiomas, setIdiomas] = useState(Array.isArray(user?.perfil?.idiomas) ? user?.perfil?.idiomas : []);
  const [novoIdioma, setNovoIdioma] = useState({ idioma: '', nivel: 'básico' });

  // Projetos reais do usuário
  const [projetos, setProjetos] = useState([])
  const [carregandoProjetos, setCarregandoProjetos] = useState(false)

  const isOwnProfile = !id || (user && String(user.id ?? user._id ?? '') === String(id))

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    } catch {
      try { window.scrollTo(0, 0) } catch {}
    }
  }, [id])

  useEffect(() => {
    if (!id || String(id) === 'undefined' || String(id) === 'null') return
    if (isOwnProfile) {
      setPublicProfileUser(null)
      setPublicProfileError('')
      setPublicProfileLoading(false)
      setPublicConnectionStatus('none')
      setPublicConnectionRequestId(null)
      return
    }

    let cancelled = false
    setPublicProfileLoading(true)
    setPublicProfileError('')
    setPublicProfileUser(null)

    api.get(`/public/users/${id}`)
      .then((resp) => {
        if (cancelled) return
        setPublicProfileUser(resp.data || null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar perfil público:', err)
        setPublicProfileError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (cancelled) return
        setPublicProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isOwnProfile])

  useEffect(() => {
    if (!id || String(id) === 'undefined' || String(id) === 'null') return
    if (!user?.id) return
    if (isOwnProfile) return

    let cancelled = false
    api.get(`/connections/status/${encodeURIComponent(id)}`)
      .then((resp) => {
        if (cancelled) return
        const status = resp?.data?.status || 'none'
        setPublicConnectionStatus(status)
        setPublicConnectionRequestId(resp?.data?.requestId || null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao buscar status de conexão (perfil):', err)
        setPublicConnectionStatus('none')
        setPublicConnectionRequestId(null)
      })

    return () => { cancelled = true }
  }, [id, isOwnProfile, user?.id])

  useEffect(() => {
    if (!user?.id) return

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
      const targetId = evt?.targetId
      const status = evt?.status
      const requestId = evt?.requestId
      if (!targetId || !status) return
      if (id && String(targetId) === String(id)) {
        setPublicConnectionStatus(status)
        if (requestId !== undefined) setPublicConnectionRequestId(requestId)
      }
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
    }
  }, [user?.id, id])

  const requestPublicConnection = async () => {
    if (!user?.id) return
    if (!id) return
    try {
      const { data } = await api.post(`/connections/${encodeURIComponent(id)}`)
      setPublicConnectionStatus(data?.status || 'pending_outgoing')
      setPublicConnectionRequestId(data?.requestId || null)
    } catch (err) {
      console.error('Erro ao solicitar conexão (perfil):', err)
    }
  }

  const removePublicConnection = async () => {
    if (!user?.id) return
    if (!id) return
    try {
      await api.delete(`/connections/${encodeURIComponent(id)}`)
      setPublicConnectionStatus('none')
      setPublicConnectionRequestId(null)
    } catch (err) {
      console.error('Erro ao remover/cancelar conexão (perfil):', err)
    }
  }

  useEffect(() => {
    if (!id || String(id) === 'undefined' || String(id) === 'null') return
    if (isOwnProfile) {
      setPublicProfilePosts([])
      setPublicProfilePostsError('')
      setPublicProfilePostsLoading(false)
      return
    }

    let cancelled = false
    setPublicProfilePostsLoading(true)
    setPublicProfilePostsError('')

    api.get('/posts', { params: { userId: id, page: 1, limit: 20 } })
      .then((resp) => {
        if (cancelled) return
        const posts = Array.isArray(resp.data?.posts) ? resp.data.posts : []
        setPublicProfilePosts(posts)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar posts do perfil:', err)
        setPublicProfilePostsError('Não foi possível carregar as publicações.')
        setPublicProfilePosts([])
      })
      .finally(() => {
        if (cancelled) return
        setPublicProfilePostsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile) return
    if (!user?.id) return

    let cancelled = false
    setOwnProfilePostsLoading(true)
    setOwnProfilePostsError('')

    api.get('/posts', { params: { userId: user.id, page: 1, limit: 20 } })
      .then((resp) => {
        if (cancelled) return
        const posts = Array.isArray(resp.data?.posts) ? resp.data.posts : []
        setOwnProfilePosts(posts)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Erro ao carregar posts do próprio perfil:', err)
        setOwnProfilePostsError('Não foi possível carregar as publicações.')
        setOwnProfilePosts([])
      })
      .finally(() => {
        if (cancelled) return
        setOwnProfilePostsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOwnProfile, user?.id])

  // Funções para carregar dados reais do backend
  const carregarCertificacoes = async () => {
    if (!user?.id) return;
    setCarregandoCertificacoes(true);
    try {
      const response = await api.get(`/users/${user.id}/certificacoes`);
      setCertificacoes(response.data || []);
    } catch (error) {
      // Se a rota não existir (404), usar array vazio sem mostrar erro
      if (error.response?.status === 404) {
        console.debug('Rota de certificações não implementada ainda, usando dados padrão');
      } else {
        console.error('Erro ao carregar certificações:', error);
      }
      setCertificacoes([]);
    } finally {
      setCarregandoCertificacoes(false);
    }
  };

  // Verificar certificação (abre link ou arquivo, se disponível)
  const verificarCert = (cert) => {
    try {
      const raw = (cert?.link || '').trim();
      let href = null;
      if (raw) {
        href = (raw.startsWith('http://') || raw.startsWith('https://')) ? raw : `https://${raw}`;
      } else if (cert?.arquivo) {
        const a = String(cert.arquivo);
        if (a.startsWith('data:') || a.startsWith('blob:') || a.startsWith('http://') || a.startsWith('https://')) {
          href = a; // usar diretamente
        } else {
          href = uploadsUrl(a); // caminho relativo salvo no backend
        }
      }
      if (!href) {
        setErro('Esta certificação não possui link ou arquivo para verificação.');
        setTimeout(() => setErro(''), 3000);
        return;
      }
      window.open(href, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setErro('Não foi possível abrir a certificação.');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const carregarProjetos = async () => {
    if (!user?.id) return;
    setCarregandoProjetos(true);
    try {
      const response = await api.get(`/users/${user.id}/projetos`);
      setProjetos(response.data || []);
    } catch (error) {
      // Se a rota não existir (404), usar array vazio sem mostrar erro
      if (error.response?.status === 404) {
        console.debug('Rota de projetos não implementada ainda, usando dados padrão');
      } else {
        console.error('Erro ao carregar projetos:', error);
      }
      setProjetos([]);
    } finally {
      setCarregandoProjetos(false);
    }
  };

  // Carregar dados quando o usuário estiver disponível (evitar chamadas duplicadas no StrictMode)
  useEffect(() => {
    if (!user?.id) return;
    if (carregouDadosRef.current) return;
    carregouDadosRef.current = true;

    carregarCertificacoes();
    carregarProjetos();
  }, [user?.id]);

  // Gerar Blob URL para o CV quando cvData mudar
  useEffect(() => {
    // Limpar URL anterior
    if (cvObjectUrlRef.current) {
      URL.revokeObjectURL(cvObjectUrlRef.current);
      cvObjectUrlRef.current = '';
    }
    setCvPreviewUrl('');
    const dataUrl = formData.cvData;
    if (!dataUrl) return;
    try {
      // Converter dataURL -> Blob de forma segura
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          cvObjectUrlRef.current = url;
          setCvPreviewUrl(url);
        })
        .catch(() => {});
    } catch {}
    return () => {
      if (cvObjectUrlRef.current) {
        URL.revokeObjectURL(cvObjectUrlRef.current);
        cvObjectUrlRef.current = '';
      }
    };
  }, [formData.cvData]);

  // Persistir seção ativa em URL e localStorage
  useEffect(() => {
    try {
      localStorage.setItem('perfil_secao', secaoAtiva);
      const params = new URLSearchParams(location.search);
      if (params.get('secao') !== secaoAtiva) {
        params.set('secao', secaoAtiva);
        navigate({ search: `?${params.toString()}` }, { replace: true });
      }
    } catch {}
  }, [secaoAtiva]);

  // Estados para modais de adição
  const [modalCert, setModalCert] = useState(false)
  const [modalIdioma, setModalIdioma] = useState(false)
  const [modalProjeto, setModalProjeto] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return user?.perfil?.somNotificacoes !== undefined ? !!user.perfil.somNotificacoes : localStorage.getItem('notificationSoundEnabled') === 'true'; } catch { return false; }
  });
  const [soundToast, setSoundToast] = useState('');
  const cvObjectUrlRef = useRef('');
  const [cvPreviewUrl, setCvPreviewUrl] = useState('');
  const [cvDirty, setCvDirty] = useState(false);

  // Salvar somente o CV, sem depender do modo de edição
  const salvarCv = async () => {
    if (!user?.id) return;
    if (!formData.cv || !formData.cvData) {
      setErro('Selecione um arquivo de CV antes de salvar.');
      setTimeout(() => setErro(''), 3000);
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        perfil: {
          cv: formData.cv,
          cvData: formData.cvData,
        },
      };
      const resp = await api.put(`/users/${user.id}`, payload);
      updateProfile(resp.data);
      setSucesso('CV salvo com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
      setCvDirty(false);
    } catch (e) {
      console.error('Erro ao salvar CV:', e);
      setErro(e?.response?.data?.error || 'Erro ao salvar CV. Tente novamente.');
      setTimeout(() => setErro(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  // Estados dos formulários
  const [novaCert, setNovaCert] = useState({ nome: '', instituicao: '', data: '', link: '', arquivo: null, arquivoDataUrl: '' })
  const [novoProjeto, setNovoProjeto] = useState({ nome: '', descricao: '', tecnologias: '', link: '', imagem: '', imagemFile: null, imagemUrl: '' })

  // Funções para adicionar
  const adicionarCertificacao = async () => {
    if (!novaCert.nome || !novaCert.instituicao) {
      setErro('Nome e instituição são obrigatórios');
      setTimeout(() => setErro(''), 3000);
      return;
    }
    
    try {
      const response = await api.post(`/users/${user.id}/certificacoes`, {
        nome: novaCert.nome,
        instituicao: novaCert.instituicao,
        data: novaCert.data,
        link: novaCert.link,
        arquivo: novaCert.arquivoDataUrl || ''
      });
      
      setCertificacoes(prev => [...prev, response.data]);
      setNovaCert({ nome: '', instituicao: '', data: '', link: '', arquivo: null, arquivoDataUrl: '' });
      setModalCert(false);
      setSucesso('Certificação adicionada com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      if (error.response?.status === 404) {
        // Rota não implementada, adicionar localmente
        const novaCertificacao = {
          id: Date.now(),
          nome: novaCert.nome,
          instituicao: novaCert.instituicao,
          data: novaCert.data,
          link: novaCert.link,
          arquivo: novaCert.arquivoDataUrl || ''
        };
        setCertificacoes(prev => [...prev, novaCertificacao]);
        setNovaCert({ nome: '', instituicao: '', data: '', link: '', arquivo: null, arquivoDataUrl: '' });
        setModalCert(false);
        setSucesso('Certificação adicionada localmente (backend não implementado)!');
        setTimeout(() => setSucesso(''), 3000);
      } else {
        console.error('Erro ao adicionar certificação:', error);
        setErro('Erro ao adicionar certificação. Tente novamente.');
        setTimeout(() => setErro(''), 3000);
      }
    }
  }
  const adicionarIdioma = () => {
    if (!novoIdioma.idioma) return;
    const novos = [...idiomas, { ...novoIdioma, id: Date.now() }];
    setIdiomas(novos);
    setNovoIdioma({ idioma: '', nivel: 'básico' });
    setModalIdioma(false);
  }
  const adicionarProjeto = async () => {
    if (!novoProjeto.nome || !novoProjeto.descricao) {
      setErro('Nome e descrição são obrigatórios');
      setTimeout(() => setErro(''), 3000);
      return;
    }
    
    try {
      const response = await api.post(`/users/${user.id}/projetos`, {
        nome: novoProjeto.nome,
        descricao: novoProjeto.descricao,
        tecnologias: novoProjeto.tecnologias.split(',').map(t => t.trim()),
        link: novoProjeto.link,
        imagem: novoProjeto.imagemUrl || novoProjeto.imagem
      });
      
      setProjetos(prev => [...prev, response.data]);
      setNovoProjeto({ nome: '', descricao: '', tecnologias: '', link: '', imagem: '', imagemFile: null, imagemUrl: '' });
      setModalProjeto(false);
      setSucesso('Projeto adicionado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      if (error.response?.status === 404) {
        // Rota não implementada, adicionar localmente
        const novoProjeto_ = {
          id: Date.now(),
          nome: novoProjeto.nome,
          descricao: novoProjeto.descricao,
          tecnologias: novoProjeto.tecnologias.split(',').map(t => t.trim()),
          link: novoProjeto.link,
          imagem: novoProjeto.imagemUrl || novoProjeto.imagem || '/nevu.png'
        };
        setProjetos(prev => [...prev, novoProjeto_]);
        setNovoProjeto({ nome: '', descricao: '', tecnologias: '', link: '', imagem: '', imagemFile: null, imagemUrl: '' });
        setModalProjeto(false);
        setSucesso('Projeto adicionado localmente (backend não implementado)!');
        setTimeout(() => setSucesso(''), 3000);
      } else {
        console.error('Erro ao adicionar projeto:', error);
        setErro('Erro ao adicionar projeto. Tente novamente.');
        setTimeout(() => setErro(''), 3000);
      }
    }
  }

  // Remover idioma
  function removerIdioma(id) {
    setIdiomas(idiomas.filter(i => i.id !== id));
  }

  // Remover foto
  function removerFoto() {
    setFormData({ ...formData, foto: '' });
  }

  function removerCapa() {
    setFormData({ ...formData, capa: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setIsLoading(true);
    try {
      // Estruturar dados para o backend
      const dadosParaEnviar = {
        nome: formData.nome,
        email: formData.email,
        perfil: {
          telefone: formData.telefone,
          dataNascimento: formData.dataNascimento,
          endereco: formData.endereco,
          bio: formData.bio,
          formacao: formData.formacao,
          instituicao: formData.instituicao,
          experiencia: formData.experiencia,
          habilidades: formData.habilidades ? formData.habilidades.split(',').map(h => h.trim()) : [],
          linkedin: formData.linkedin,
          github: formData.github,
          portfolio: formData.portfolio,
          behance: formData.behance,
          instagram: formData.instagram,
          twitter: formData.twitter,
          tipoTrabalho: formData.tipoTrabalho,
          faixaSalarial: formData.faixaSalarial,
          localizacaoPreferida: formData.localizacaoPreferida,
          disponibilidade: formData.disponibilidade,
          cv: formData.cv,
          cvData: formData.cvData,
          perfilPublico: formData.perfilPublico,
          mostrarTelefone: formData.mostrarTelefone,
          mostrarEndereco: formData.mostrarEndereco,
          alertasVagas: formData.alertasVagas,
          frequenciaAlertas: formData.frequenciaAlertas,
          vagasInteresse: Array.isArray(formData.vagasInteresse) ? formData.vagasInteresse : formData.vagasInteresse.split(',').map(v => v.trim()),
          foto: formData.foto,
          capa: formData.capa,
          idiomas: idiomas,
          // Campos adicionais para garantir que tudo seja salvo
          resumo: formData.resumo,
          certificacoes: certificacoes,
          projetos: projetos
        }
      };

      const response = await api.put(`/users/${user.id}`, dadosParaEnviar);
      const userAtualizado = response.data;
      
      // Atualizar o contexto de autenticação
      updateProfile(userAtualizado);
      
      setSucesso('Perfil atualizado com sucesso!');
      setEditando(false);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0]
    setErro('')
    setSucesso('')
    if (!file) return

    try {
      const allowed = ['application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowed.includes(file.type)) {
        setErro('Formato inválido. Envie um arquivo PDF, DOC ou DOCX.')
        setTimeout(() => setErro(''), 4000)
        e.target.value = ''
        return
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setErro('Arquivo muito grande. Tamanho máximo: 10MB.')
        setTimeout(() => setErro(''), 4000)
        e.target.value = ''
        return
      }

      const toBase64 = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(f)
      })

      const base64 = await toBase64(file)
      setFormData(prev => ({ ...prev, cv: file.name, cvData: base64 }))
      setSucesso('CV anexado! Clique em "Salvar Alterações" para confirmar.')
      setTimeout(() => setSucesso(''), 4000)
      setCvDirty(true)
    } catch (err) {
      console.error('Erro ao processar CV:', err)
      setErro('Falha ao processar o arquivo. Tente novamente.')
      setTimeout(() => setErro(''), 4000)
    } finally {
      // Não limpar automaticamente, permite re-upload se necessário
    }
  }

  function handleFotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      // Verificar se os campos obrigatórios estão preenchidos antes de permitir upload de foto
      if (!formData.nome || !formData.email) {
        setErro('Preencha nome e email antes de adicionar uma foto de perfil.');
        setTimeout(() => setErro(''), 4000);
        // Limpar o input
        e.target.value = '';
        return;
      }

      // Verificar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErro('Formato não suportado. Use apenas JPG, PNG ou WebP.');
        setTimeout(() => setErro(''), 4000);
        // Limpar o input
        e.target.value = '';
        return;
      }

      // Limite aumentado para 200MB como solicitado
      const maxSize = 200 * 1024 * 1024; // 200MB
      if (file.size > maxSize) {
        setErro('A foto é muito grande. Escolha uma imagem de até 200MB.');
        setTimeout(() => setErro(''), 4000);
        // Limpar o input
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        // Comprimir a imagem antes de salvar
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Definir tamanho máximo (400x400px para perfil)
          const maxWidth = 400;
          const maxHeight = 400;
          let { width, height } = img;

          // Calcular proporções
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para base64 com qualidade 0.8
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8);

          setFormData({ ...formData, foto: compressedImage });
          setSucesso('Foto de perfil adicionada com sucesso! Clique em "Salvar Alterações" para confirmar.');
          setTimeout(() => setSucesso(''), 4000);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  function handleCapaChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (!formData.nome || !formData.email) {
        setErro('Preencha nome e email antes de adicionar uma foto de capa.');
        setTimeout(() => setErro(''), 4000);
        e.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErro('Formato não suportado. Use apenas JPG, PNG ou WebP.');
        setTimeout(() => setErro(''), 4000);
        e.target.value = '';
        return;
      }

      const maxSize = 200 * 1024 * 1024; // 200MB
      if (file.size > maxSize) {
        setErro('A capa é muito grande. Escolha uma imagem de até 200MB.');
        setTimeout(() => setErro(''), 4000);
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const maxWidth = 1500;
          const maxHeight = 500;
          let { width, height } = img;

          const scale = Math.min(maxWidth / width, maxHeight / height, 1);
          width = Math.round(width * scale);
          height = Math.round(height * scale);

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          const compressedImage = canvas.toDataURL('image/jpeg', 0.82);

          setFormData({ ...formData, capa: compressedImage });
          setSucesso('Foto de capa adicionada com sucesso! Clique em "Salvar Alterações" para confirmar.');
          setTimeout(() => setSucesso(''), 4000);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Definir o array de idiomas disponíveis no início do componente Perfil
  const idiomasDisponiveis = [
    'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Mandarim', 'Árabe', 'Russo', 'Japonês', 'Outro'
  ];

  // Definir os níveis de idioma disponíveis
  const niveis = ['básico', 'intermediário', 'avançado', 'fluente', 'nativo'];

  // Sempre mostrar perfil público estilizado para /perfil/:id diferente do próprio usuário
  if (id && (!user || String(user.id ?? user._id ?? '') !== String(id))) {
    const displayName = publicProfileUser?.nome || `Usuário ${String(id).slice(0, 6)}`
    const headline = publicProfileUser?.perfil?.bio || publicProfileUser?.perfil?.resumo || 'Perfil público'
    const locationLabel = publicProfileUser?.perfil?.endereco || publicProfileUser?.endereco || 'Moçambique'
    const skills = Array.isArray(publicProfileUser?.perfil?.habilidades) ? (publicProfileUser?.perfil?.habilidades || []) : []
    const avatarUrl = publicProfileUser?.perfil?.foto || publicProfileUser?.foto || ''

    const avatarResolved = avatarUrl
      ? (String(avatarUrl).startsWith('http://') || String(avatarUrl).startsWith('https://') || String(avatarUrl).startsWith('data:')
          ? avatarUrl
          : uploadsUrl(avatarUrl))
      : ''

    const postsCount = (typeof publicProfileUser?.stats?.posts === 'number')
      ? publicProfileUser.stats.posts
      : (Array.isArray(publicProfilePosts) ? publicProfilePosts.length : 0)

    const followersCount = (typeof publicProfileUser?.stats?.followers === 'number')
      ? publicProfileUser.stats.followers
      : (typeof publicProfileUser?.stats?.connections === 'number')
        ? publicProfileUser.stats.connections
        : 0

    const followingCount = (typeof publicProfileUser?.stats?.following === 'number')
      ? publicProfileUser.stats.following
      : (typeof publicProfileUser?.stats?.connections === 'number')
        ? publicProfileUser.stats.connections
        : 0

    const connectionsCount = (typeof publicProfileUser?.stats?.connections === 'number')
      ? publicProfileUser.stats.connections
      : 0

    const aboutText = (
      publicProfileUser?.perfil?.descricao
      || publicProfileUser?.perfil?.bio
      || publicProfileUser?.perfil?.resumo
      || publicProfileUser?.descricao
      || ''
    )

    const resolveMaybeUploadUrl = (maybePath) => {
      if (!maybePath) return ''
      const raw = String(maybePath)
      if (!raw) return ''
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
      return uploadsUrl(raw)
    }

    const coverResolved = resolveMaybeUploadUrl(publicProfileUser?.perfil?.capa || publicProfileUser?.capa || '')

    if (publicProfileLoading) {
      return (
        <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 sm:h-52 md:h-64 bg-gray-200" />
              <div className="p-4">
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex-none rounded-full overflow-hidden bg-gray-200">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-[3px]">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                        <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-gray-700">
                          {String(displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      </div>
                    </div>
                  </div>
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
                <div className="mt-5">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (publicProfileError) {
      return (
        <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-sm">
            {publicProfileError}
          </div>
        </div>
      )
    } else {
      return (
        <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="relative">
              <div className="h-40 sm:h-52 md:h-64 bg-gray-200">
                {coverResolved ? (
                  <img src={coverResolved} alt="Foto de capa" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
              <div className="px-4">
                <div className="relative -mt-4 sm:-mt-8 md:-mt-12 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="flex items-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (avatarResolved) setPublicActivePhotoUrl(avatarResolved)
                        }}
                        className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex-none rounded-full overflow-hidden p-[3px] bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600"
                        aria-label="Ver foto do perfil"
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-white p-[3px]">
                          <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                            {avatarResolved ? (
                              <div className="w-full h-full rounded-full overflow-hidden">
                                <img src={avatarResolved} alt={displayName} className="w-full h-full object-cover rounded-full" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-gray-700">
                                {String(displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="pb-2 mt-6 sm:mt-0">
                        <div className="text-2xl font-extrabold text-gray-900">{displayName}</div>
                        <div className="text-sm text-gray-600 mt-1">{headline} · {locationLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      {user ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (publicConnectionStatus === 'connected' || publicConnectionStatus === 'pending_outgoing') return removePublicConnection()
                            return requestPublicConnection()
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${publicConnectionStatus === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' : publicConnectionStatus === 'pending_outgoing' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          {publicConnectionStatus === 'connected'
                            ? 'Conectado'
                            : publicConnectionStatus === 'pending_outgoing'
                              ? 'Pendente'
                              : 'Conectar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/login')}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                        >
                          Conectar
                        </button>
                      )}
                      <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition">
                        Mensagem
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-800">
                    <div><span className="font-semibold">{postsCount}</span> publicações</div>
                    <div><span className="font-semibold">{followersCount}</span> seguidores</div>
                    <div><span className="font-semibold">{followingCount}</span> seguindo</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="font-bold text-gray-900">Sobre</div>
                    <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                      {aboutText ? aboutText : 'Sem informações adicionais.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {publicActivePhotoUrl ? (
            <div
              className="fixed inset-0 z-50 bg-black"
              onClick={() => setPublicActivePhotoUrl('')}
            >
              <div
                className="relative w-full h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-full bg-black">
                  <img
                    src={publicActivePhotoUrl}
                    alt=""
                    className="w-full h-full object-contain bg-black"
                  />
                  <button
                    onClick={() => setPublicActivePhotoUrl('')}
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
          <div className="border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-4">
              <div className="grid grid-cols-3 py-3 text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setPublicActiveTab('posts')}
                  className={`text-center py-2 rounded-lg transition ${publicActiveTab === 'posts' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  PUBLICAÇÕES
                </button>
                <button
                  type="button"
                  onClick={() => setPublicActiveTab('reels')}
                  className={`text-center py-2 rounded-lg transition ${publicActiveTab === 'reels' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  REELS
                </button>
                <button
                  type="button"
                  onClick={() => setPublicActiveTab('mentions')}
                  className={`text-center py-2 rounded-lg transition ${publicActiveTab === 'mentions' ? 'text-gray-900 bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  MENÇÕES
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-1 sm:px-4 pb-6">
            {publicActiveTab === 'posts' ? (
              publicProfilePostsLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
                      <div className="p-4">
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-gray-200 rounded" />
                          <div className="h-3 w-5/6 bg-gray-200 rounded" />
                          <div className="h-3 w-2/3 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-20 bg-gray-200 rounded" />
                          <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : publicProfilePostsError ? (
                <div className="bg-white border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-sm">
                  {publicProfilePostsError}
                </div>
              ) : (Array.isArray(publicProfilePosts) && publicProfilePosts.length > 0) ? (
                <div className="space-y-4">
                  {publicProfilePosts.map(p => (
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
      )
    }
  }

  const renderSecaoPublicacoes = () => {
    const resolveMaybeUploadUrl = (maybePath) => {
      if (!maybePath) return ''
      const raw = String(maybePath)
      if (!raw) return ''
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
      return uploadsUrl(raw)
    }

    return (
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Publicações</h2>
        </div>

        {ownProfilePostsLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((k) => (
              <div key={k} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ownProfilePostsError ? (
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-sm">
            {ownProfilePostsError}
          </div>
        ) : (Array.isArray(ownProfilePosts) && ownProfilePosts.length > 0) ? (
          <div className="space-y-4">
            {ownProfilePosts.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  {editingOwnPostId && String(editingOwnPostId) === String(p.id) ? (
                    <div>
                      <textarea
                        value={editingOwnPostText}
                        onChange={(e) => setEditingOwnPostText(e.target.value)}
                        rows={3}
                        className="w-full resize-none outline-none text-gray-900 placeholder:text-gray-500 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 focus:border-blue-300"
                      />
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOwnPostId(null)
                            setEditingOwnPostText('')
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const text = String(editingOwnPostText || '').trim()
                            if (!text) {
                              setOwnProfilePostsError('O texto da publicação não pode estar vazio.')
                              return
                            }
                            try {
                              const { data } = await api.put(`/posts/${encodeURIComponent(p.id)}`, { texto: text })
                              setOwnProfilePosts(prev => prev.map(it => (String(it.id) === String(p.id) ? { ...it, texto: data?.texto ?? it.texto, imageUrl: data?.imageUrl ?? it.imageUrl, counts: data?.counts ?? it.counts } : it)))
                              setEditingOwnPostId(null)
                              setEditingOwnPostText('')
                            } catch (e) {
                              console.error('Erro ao editar post:', e)
                              setOwnProfilePostsError('Erro ao editar publicação.')
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : p.texto ? (
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{p.texto}</div>
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

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOwnPostId(p.id)
                        setEditingOwnPostText(String(p.texto || ''))
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteOwnPostId(p.id)
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
            Sem publicações por enquanto.
          </div>
        )}
      </div>
    )
  }

  const renderSecaoPessoal = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Informações Pessoais</h2>
          {assinatura && user?.tipo === 'usuario' && (
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2
              ${assinatura.plano === 'premium' ? 'bg-yellow-400 text-white border-yellow-500' :
                assinatura.plano === 'basico' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                'bg-gray-100 text-gray-500 border-gray-300'}`}
            >
              {assinatura.plano === 'premium' ? 'Perfil Premium' :
                assinatura.plano === 'basico' ? 'Perfil em Destaque' :
                'Perfil Gratuito'}
              <span className="ml-2 text-green-600 font-bold">• Ativo</span>
            </span>
          )}
        </div>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm mt-2 sm:mt-0"
          >
            Editar
          </button>
        )}
      </div>

      {sucesso && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {sucesso}
        </div>
      )}

      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow">
            <img
              src={formData.foto || user?.perfil?.foto || '/nevu.png'}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Nome Completo</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">E-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Data de Nascimento</label>
            <input
              type="date"
              name="dataNascimento"
              value={formData.dataNascimento ? new Date(formData.dataNascimento).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  )

  const renderSecaoProfissional = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Informações Profissionais</h2>
        {!editando && (
        <button type="button"
            onClick={() => setEditando(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="space-y-2 sm:space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formação</label>
            <input
              type="text"
              name="formacao"
              value={formData.formacao}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instituição</label>
            <input
              type="text"
              name="instituicao"
              value={formData.instituicao}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experiência</label>
            <input
              type="text"
              name="experiencia"
              value={formData.experiencia}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Habilidades</label>
          <input
            type="text"
            name="habilidades"
            value={formData.habilidades}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Ex: React, JavaScript, TypeScript, Node.js"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Resumo Profissional</label>
          <textarea
            name="resumo"
            value={formData.resumo}
            onChange={handleChange}
            disabled={!editando}
            rows={4}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  )

  const renderSecaoCurriculo = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">CV</h2>
        <button
          type="button"
          onClick={() => document.getElementById('curriculo-upload').click()}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
          Atualizar CV
        </button>
      </div>
      
      <input
        id="curriculo-upload"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 mb-2">CV atual: {formData.cv ? formData.cv : '—'}</p>
        {formData.cvData ? (
          <div className="flex gap-2 justify-center">
            <a
              href={cvPreviewUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm disabled:opacity-50"
              aria-disabled={!cvPreviewUrl}
              onClick={(e) => { if (!cvPreviewUrl) e.preventDefault(); }}
            >
              Visualizar
            </a>
            <a
              href={cvPreviewUrl || '#'}
              download={formData.cv || 'curriculo'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm disabled:opacity-50"
              aria-disabled={!cvPreviewUrl}
              onClick={(e) => { if (!cvPreviewUrl) e.preventDefault(); }}
            >
              Baixar
            </a>
            {cvDirty && (
              <button
                type="button"
                onClick={salvarCv}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Salvar CV'}
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Nenhum arquivo disponível para visualizar/baixar</div>
        )}
      </div>
    </div>
  )

  const renderSecaoRedesSociais = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Redes Sociais</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
          <input
            type="url"
            name="github"
            value={formData.github}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Portfólio</label>
          <input
            type="url"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Behance</label>
          <input
            type="url"
            name="behance"
            value={formData.behance}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
          <input
            type="text"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X</label>
          <input
            type="text"
            name="twitter"
            value={formData.twitter}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  )

  const renderSecaoPreferencias = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Preferências de Trabalho</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Trabalho</label>
          <select
            name="tipoTrabalho"
            value={formData.tipoTrabalho}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>
        {/* Campo de faixa salarial removido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Localização Preferida</label>
          <input
            type="text"
            name="localizacaoPreferida"
            value={formData.localizacaoPreferida}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidade</label>
          <select
            name="disponibilidade"
            value={formData.disponibilidade}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="imediata">Imediata</option>
            <option value="15dias">15 dias</option>
            <option value="30dias">30 dias</option>
            <option value="60dias">60 dias</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderSecaoCertificacoes = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Certificações</h2>
        <button type="button"
          onClick={() => setModalCert(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
          Adicionar
        </button>
      </div>
      {/* Modal de adicionar certificação */}
      <Modal isOpen={modalCert} onClose={() => setModalCert(false)} title="Adicionar Certificação">
        <div className="space-y-3">
          <input type="text" placeholder="Nome da Certificação" value={novaCert.nome} onChange={e => setNovaCert(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Instituição" value={novaCert.instituicao} onChange={e => setNovaCert(v => ({...v, instituicao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link (opcional)" value={novaCert.link} onChange={e => setNovaCert(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Anexar Certificado (PDF/JPG/PNG)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setNovaCert(v => ({...v, arquivo: file, arquivoDataUrl: reader.result}))
                };
                reader.readAsDataURL(file);
              }
            }} />
            {novaCert.arquivoDataUrl && (
              <div className="mt-1 text-xs text-green-700">Arquivo selecionado: {novaCert.arquivo?.name || 'visualizar'} <a href={novaCert.arquivoDataUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalCert(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="button" onClick={adicionarCertificacao} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>
      <div className="space-y-2 sm:space-y-4">
        {Array.isArray(certificacoes) && certificacoes.map((cert) => (
          <div key={cert.id} className="border rounded-lg p-2 sm:p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{cert.nome}</h3>
                <p className="text-sm text-gray-600">{cert.instituicao}</p>
                {cert.link && <a href={cert.link} className="text-blue-600 underline text-xs" target="_blank" rel="noopener noreferrer">Ver certificado</a>}
              </div>
              <div className="flex gap-1 sm:gap-2">
                <button className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition" onClick={() => verificarCert(cert)}>
                  Verificar
                </button>
                <button className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 transition">
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSecaoIdiomas = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Idiomas</h2>
        <button type="button"
          onClick={() => setModalIdioma(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
          Adicionar
        </button>
      </div>
      {/* Modal de adicionar idioma */}
      <Modal isOpen={modalIdioma} onClose={() => setModalIdioma(false)} title="Adicionar Idioma">
        <div className="space-y-3">
          <select
            value={novoIdioma.idioma}
            onChange={e => setNovoIdioma(v => ({...v, idioma: e.target.value}))}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione o idioma</option>
                          {Array.isArray(idiomasDisponiveis) && idiomasDisponiveis.map(idioma => (
                <option key={idioma} value={idioma}>{idioma}</option>
              ))}
          </select>
          <select value={novoIdioma.nivel} onChange={e => setNovoIdioma(v => ({...v, nivel: e.target.value}))} className="w-full p-2 border rounded">
            <option value="básico">Básico</option>
            <option value="intermediário">Intermediário</option>
            <option value="avançado">Avançado</option>
            <option value="nativo">Nativo</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalIdioma(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="button" onClick={adicionarIdioma} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Idiomas</h2>
        {/* Substituir a lista de idiomas adicionados por uma visualização mais "viva": */}
        <ul className="flex flex-wrap gap-3 mb-2">
          {Array.isArray(idiomas) && idiomas.map(i => (
            <li key={i.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-blue-600 text-lg mr-1">🌐</span>
              <span className="font-semibold text-gray-800">{i.idioma}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                i.nivel === 'básico' ? 'bg-gray-200 text-gray-700' :
                i.nivel === 'intermediário' ? 'bg-yellow-100 text-yellow-800' :
                i.nivel === 'avançado' ? 'bg-blue-100 text-blue-700' :
                i.nivel === 'fluente' ? 'bg-green-100 text-green-700' :
                i.nivel === 'nativo' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {i.nivel.charAt(0).toUpperCase() + i.nivel.slice(1)}
              </span>
              {editando && (
                <button type="button" onClick={() => removerIdioma(i.id)} className="ml-2 text-red-500 text-xs hover:text-red-700 transition" title="Remover">
                  ✖
                </button>
              )}
            </li>
          ))}
        </ul>
        {editando && (
          <div className="flex gap-2 items-end">
            <select
              value={novoIdioma.idioma}
              onChange={e => setNovoIdioma({ ...novoIdioma, idioma: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">Selecione o idioma</option>
              {Array.isArray(idiomasDisponiveis) && idiomasDisponiveis.map(idioma => (
                <option key={idioma} value={idioma}>{idioma}</option>
              ))}
            </select>
            <select
              value={novoIdioma.nivel}
              onChange={e => setNovoIdioma({ ...novoIdioma, nivel: e.target.value })}
              className="border p-2 rounded"
            >
              {Array.isArray(niveis) && niveis.map(nivel => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
            </select>
            <button type="button" onClick={adicionarIdioma} className="bg-blue-600 text-white px-3 py-1 rounded">Adicionar</button>
          </div>
        )}
      </div>
    </div>
  )

  const renderSecaoProjetos = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Projetos</h2>
        <button type="button"
          onClick={() => setModalProjeto(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
          Adicionar
        </button>
      </div>
      {/* Modal de adicionar projeto */}
      <Modal isOpen={modalProjeto} onClose={() => setModalProjeto(false)} title="Adicionar Projeto">
        <div className="space-y-3">
          <input type="text" placeholder="Nome do Projeto" value={novoProjeto.nome} onChange={e => setNovoProjeto(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <textarea placeholder="Descrição" value={novoProjeto.descricao} onChange={e => setNovoProjeto(v => ({...v, descricao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Tecnologias (separadas por vírgula)" value={novoProjeto.tecnologias} onChange={e => setNovoProjeto(v => ({...v, tecnologias: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link do Projeto" value={novoProjeto.link} onChange={e => setNovoProjeto(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Imagem do Projeto (JPG/PNG)</label>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setNovoProjeto(v => ({...v, imagemFile: file, imagemUrl: url}))
              }
            }} />
            {novoProjeto.imagemUrl && (
              <div className="mt-1 text-xs text-green-700">Imagem selecionada: {novoProjeto.imagemFile?.name || 'visualizar'} <a href={novoProjeto.imagemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalProjeto(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="button" onClick={adicionarProjeto} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>
      <div className="grid md:grid-cols-2 gap-6">
        {Array.isArray(projetos) && projetos.map((projeto) => (
          <div key={projeto.id} className="border rounded-lg overflow-hidden">
            <img src={projeto.imagem} alt={projeto.nome} className="w-full h-32 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{projeto.nome}</h3>
              <p className="text-sm text-gray-600 mb-3">{projeto.descricao}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {Array.isArray(projeto.tecnologias) && projeto.tecnologias.map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">
                  Ver Projeto
                </button>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSecaoEstatisticas = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Estatísticas</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-2 sm:p-4 bg-blue-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">{estatisticas.candidaturas.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Candidaturas</div>
        </div>
        <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-green-600">{estatisticas.entrevistas.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Entrevistas</div>
        </div>
        <div className="text-center p-2 sm:p-4 bg-purple-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-purple-600">{estatisticas.vagasSalvas}</div>
          <div className="text-xs sm:text-sm text-gray-600">Vagas Salvas</div>
        </div>
        <div className="text-center p-2 sm:p-4 bg-orange-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-orange-600">{estatisticas.visualizacoes}</div>
          <div className="text-xs sm:text-sm text-gray-600">Visualizações</div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Candidaturas este mês</span>
          <span className="font-semibold">{estatisticas.candidaturas.esteMes}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Candidaturas aprovadas</span>
          <span className="font-semibold text-green-600">{estatisticas.candidaturas.aprovadas}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Entrevistas agendadas</span>
          <span className="font-semibold text-blue-600">{estatisticas.entrevistas.agendadas}</span>
        </div>
      </div>
    </div>
  )

  const isPlanoPago = assinatura?.plano === 'basico' || assinatura?.plano === 'premium';

  const renderSecaoNotificacoes = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações</h3>
      {soundToast && (
        <div className="mb-3 p-2 rounded text-sm bg-blue-50 text-blue-700 border border-blue-200">
          {soundToast}
        </div>
      )}
      <NotificacoesSwitch />
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Alertas de vagas</h3>
            <p className="text-sm text-gray-600">Receber notificações de novas vagas</p>
          </div>
            <input
              type="checkbox"
              checked={formData.alertasVagas}
            onChange={e => setFormData({...formData, alertasVagas: e.target.checked})}
            className="w-5 h-5"
            disabled={!isPlanoPago}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Som de notificações</h3>
            <p className="text-sm text-gray-600">Tocar um som quando uma notificação push chegar</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={async (e) => {
                const enabled = e.target.checked;
                setSoundEnabled(enabled);
                try { localStorage.setItem('notificationSoundEnabled', enabled ? 'true' : 'false'); } catch {}
                setSoundToast(enabled ? 'Som de notificações ativado' : 'Som de notificações desativado');
                setTimeout(() => setSoundToast(''), 2000);
                try {
                  if (!user?.id) return;
                  await updateProfile({ perfil: { somNotificacoes: enabled } })
                } catch (err) {
                  console.error('Falha ao salvar somNotificacoes no backend:', err);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de alertas</label>
          <select
            name="frequenciaAlertas"
            value={formData.frequenciaAlertas}
            onChange={handleChange}
            disabled={!isPlanoPago}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Palavras-chave de interesse</label>
          <input
            type="text"
            name="vagasInteresse"
            value={Array.isArray(formData.vagasInteresse) ? formData.vagasInteresse.join(', ') : ''}
            onChange={e => setFormData({...formData, vagasInteresse: e.target.value.split(', ')})}
            disabled={!isPlanoPago}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Ex: desenvolvedor, frontend, react"
          />
        </div>
      </div>
    </div>
  );

  const renderSecaoPrivacidade = () => (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Privacidade</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Perfil público</h3>
            <p className="text-sm text-gray-600">Permitir que empresas vejam seu perfil</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.perfilPublico}
              onChange={(e) => setFormData({...formData, perfilPublico: e.target.checked})}
              disabled={!editando}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Mostrar telefone</h3>
            <p className="text-sm text-gray-600">Exibir telefone no perfil público</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.mostrarTelefone}
              onChange={(e) => setFormData({...formData, mostrarTelefone: e.target.checked})}
              disabled={!editando}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Mostrar endereço</h3>
            <p className="text-sm text-gray-600">Exibir endereço no perfil público</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.mostrarEndereco}
              onChange={(e) => setFormData({...formData, mostrarEndereco: e.target.checked})}
              disabled={!editando}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const coverUrlRaw = formData.capa || user?.perfil?.capa || ''
  const coverResolved = coverUrlRaw
    ? (String(coverUrlRaw).startsWith('http://') || String(coverUrlRaw).startsWith('https://') || String(coverUrlRaw).startsWith('data:') || String(coverUrlRaw).startsWith('blob:')
        ? coverUrlRaw
        : uploadsUrl(coverUrlRaw))
    : ''

  return (
    <div className="max-w-4xl w-full mx-auto min-h-screen py-4 sm:py-8 px-2 sm:px-4 pb-20 sm:pb-32 overflow-x-hidden">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
        <div className="relative">
          <div className="h-36 sm:h-48 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
            {coverResolved ? (
              <img
                src={coverResolved}
                alt="Foto de capa"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>

          {editando && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <input
                id="cover-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCapaChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('cover-upload').click()}
                className="px-3 py-2 rounded-lg bg-white/90 text-gray-900 text-xs sm:text-sm font-semibold hover:bg-white transition border border-gray-200 shadow"
              >
                Editar capa
              </button>
              {formData.capa && (
                <button
                  type="button"
                  onClick={removerCapa}
                  className="px-3 py-2 rounded-lg bg-white/90 text-red-700 text-xs sm:text-sm font-semibold hover:bg-white transition border border-gray-200 shadow"
                >
                  Remover
                </button>
              )}
            </div>
          )}
          <div className="px-4">
            <div className="relative -mt-10 sm:-mt-14 flex items-end justify-between gap-3">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white p-1 shadow">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={formData.foto || user?.perfil?.foto || '/nevu.png'}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover border border-gray-200"
                  />
                </div>
                {editando && (
                  <>
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('profile-photo-upload').click()}
                      className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white text-gray-900 hover:bg-gray-50 transition border border-gray-200 shadow flex items-center justify-center"
                      aria-label="Editar foto do perfil"
                      title="Editar foto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-2h6l2 2h4v12H3V7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
                      </svg>
                    </button>
                    {formData.foto && (
                      <button
                        type="button"
                        onClick={removerFoto}
                        className="absolute -bottom-1 -left-1 w-10 h-10 rounded-full bg-white text-red-700 hover:bg-gray-50 transition border border-gray-200 shadow flex items-center justify-center"
                        aria-label="Remover foto do perfil"
                        title="Remover foto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="pb-2 flex items-center gap-2">
                {!editando && (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Editar perfil
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 pb-4">
              <div className="text-xl sm:text-2xl font-extrabold text-gray-900">{formData.nome}</div>
              <div className="text-sm text-gray-600">{formData.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto whitespace-nowrap mb-6">
        <button type="button" onClick={() => setSecaoAtiva('publicacoes')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'publicacoes' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Publicações</button>
        <button type="button" onClick={() => setSecaoAtiva('pessoal')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'pessoal' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Sobre</button>
        <button type="button" onClick={() => setSecaoAtiva('profissional')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'profissional' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Profissional</button>
        <button type="button" onClick={() => setSecaoAtiva('curriculo')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'curriculo' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>CV</button>
        <button type="button" onClick={() => setSecaoAtiva('redes')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'redes' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Redes</button>
        <button type="button" onClick={() => setSecaoAtiva('certificacoes')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'certificacoes' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Certificações</button>
        <button type="button" onClick={() => setSecaoAtiva('idiomas')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'idiomas' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Idiomas</button>
        {isOwnProfile && (
          <button type="button" onClick={() => setSecaoAtiva('notificacoes')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'notificacoes' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Notificações</button>
        )}
        {isOwnProfile && (
          <button type="button" onClick={() => setSecaoAtiva('privacidade')} className={`px-3 py-2 rounded-full text-sm font-semibold transition ${secaoAtiva === 'privacidade' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Privacidade</button>
        )}
      </div>

      <form id="perfil-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="mb-8">
          {secaoAtiva === 'publicacoes' && renderSecaoPublicacoes()}
          {secaoAtiva === 'pessoal' && renderSecaoPessoal()}
          {secaoAtiva === 'profissional' && renderSecaoProfissional()}
          {secaoAtiva === 'curriculo' && renderSecaoCurriculo()}
          {secaoAtiva === 'redes' && renderSecaoRedesSociais()}
          {secaoAtiva === 'certificacoes' && renderSecaoCertificacoes()}
          {secaoAtiva === 'idiomas' && renderSecaoIdiomas()}
          {isOwnProfile && secaoAtiva === 'notificacoes' && renderSecaoNotificacoes()}
          {isOwnProfile && secaoAtiva === 'privacidade' && renderSecaoPrivacidade()}
        </div>
      </form>

      {/* Botões de ação - posicionados no final */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mb-8 mt-8">
        {editando && (
          <>
            <button
              type="submit"
              form="perfil-form"
              disabled={isLoading}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition flex items-center justify-center gap-2 font-semibold text-sm sm:text-base ${
                isLoading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Alterações
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={isLoading}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Cancelar
            </button>
          </>
        )}
        {isOwnProfile && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-semibold"
          >
            Excluir Conta
          </button>
        )}
      </div>
      
      {/* Modais */}
      <Modal isOpen={modalCert} onClose={() => setModalCert(false)} title="Adicionar Certificação">
        <div className="space-y-3">
          <input type="text" placeholder="Nome da Certificação" value={novaCert.nome} onChange={e => setNovaCert(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Instituição" value={novaCert.instituicao} onChange={e => setNovaCert(v => ({...v, instituicao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link (opcional)" value={novaCert.link} onChange={e => setNovaCert(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Anexar Certificado (PDF/JPG/PNG)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setNovaCert(v => ({...v, arquivo: file, arquivoDataUrl: reader.result}))
                };
                reader.readAsDataURL(file);
              }
            }} />
            {novaCert.arquivoDataUrl && (
              <div className="mt-1 text-xs text-green-700">Arquivo selecionado: {novaCert.arquivo?.name || 'visualizar'} <a href={novaCert.arquivoDataUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalCert(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="button" onClick={adicionarCertificacao} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDeleteOwnPostId}
        onClose={() => setConfirmDeleteOwnPostId(null)}
        title="Eliminar publicação"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-700">Tem certeza que deseja eliminar esta publicação?</div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteOwnPostId(null)}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirmDeleteOwnPostId) return
                const postId = confirmDeleteOwnPostId
                try {
                  await api.delete(`/posts/${encodeURIComponent(postId)}`)
                  setOwnProfilePosts(prev => prev.filter(it => String(it.id) !== String(postId)))
                } catch (e) {
                  console.error('Erro ao eliminar post:', e)
                  setOwnProfilePostsError('Erro ao eliminar publicação.')
                } finally {
                  setConfirmDeleteOwnPostId(null)
                }
              }}
              className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalIdioma} onClose={() => setModalIdioma(false)} title="Adicionar Idioma">
        <div className="space-y-3">
          <select
            value={novoIdioma.idioma}
            onChange={e => setNovoIdioma(v => ({...v, idioma: e.target.value}))}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione o idioma</option>
                          {Array.isArray(idiomasDisponiveis) && idiomasDisponiveis.map(idioma => (
                <option key={idioma} value={idioma}>{idioma}</option>
              ))}
          </select>
          <select value={novoIdioma.nivel} onChange={e => setNovoIdioma(v => ({...v, nivel: e.target.value}))} className="w-full p-2 border rounded">
            <option value="básico">Básico</option>
            <option value="intermediário">Intermediário</option>
            <option value="avançado">Avançado</option>
            <option value="nativo">Nativo</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalIdioma(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="button" onClick={adicionarIdioma} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalProjeto} onClose={() => setModalProjeto(false)} title="Adicionar Projeto">
        <div className="space-y-3">
          <input type="text" placeholder="Nome do Projeto" value={novoProjeto.nome} onChange={e => setNovoProjeto(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <textarea placeholder="Descrição" value={novoProjeto.descricao} onChange={e => setNovoProjeto(v => ({...v, descricao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Tecnologias (separadas por vírgula)" value={novoProjeto.tecnologias} onChange={e => setNovoProjeto(v => ({...v, tecnologias: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link do Projeto" value={novoProjeto.link} onChange={e => setNovoProjeto(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Imagem do Projeto (JPG/PNG)</label>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setNovoProjeto(v => ({...v, imagemFile: file, imagemUrl: url}))
              }
            }} />
            {novoProjeto.imagemUrl && (
              <div className="mt-1 text-xs text-green-700">Imagem selecionada: {novoProjeto.imagemFile?.name || 'visualizar'} <a href={novoProjeto.imagemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalProjeto(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="button" onClick={adicionarProjeto} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir Conta">
        <div className="space-y-2 sm:space-y-4">
          {!deleting ? (
            <>
              <p className="text-red-700 font-semibold">Tem certeza que deseja excluir sua conta?</p>
              <p className="text-sm text-gray-600 mt-2">Sua conta será suspensa por 30 dias. Durante esse período, você pode entrar em contato com o suporte para cancelar a exclusão. Após 30 dias, sua conta será permanentemente excluída.</p>
              <div className="flex gap-4 justify-end mt-4">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    setProgress(0);
                    let pct = 0;
                    const interval = setInterval(() => {
                      pct += 10;
                      setProgress(pct);
                      if (pct >= 90) {
                        clearInterval(interval);
                      }
                    }, 100);
                    
                    try {
                      // Chamar a função de exclusão do AuthContext (sem immediate=true)
                      await deleteAccount();
                      setProgress(100);
                      
                      // Aguardar um momento para mostrar 100% e então redirecionar
                      setTimeout(() => {
                        navigate('/login');
                        window.location.reload(); // Força reload para limpar todo o estado
                      }, 500);
                    } catch (error) {
                      clearInterval(interval);
                      setDeleting(false);
                      setProgress(0);
                      alert('Erro ao solicitar exclusão: ' + (error.response?.data?.error || error.message));
                      setShowDeleteModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
                >
                  Solicitar Exclusão
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <span className="text-6xl animate-bounce">😭</span>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-orange-500 h-4 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-center text-gray-700 font-semibold">
                Suspendendo sua conta... ({progress}%)
                <br/>
                <span className="text-sm text-gray-600">Você terá 30 dias para mudar de ideia!</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Reportar */}
      {/* {modalReportar && (
        <Modal isOpen={modalReportar} onClose={() => setModalReportar(false)} title="Reportar Chamado" size="sm">
          <div className="space-y-2 sm:space-y-4">
            <label className="block text-sm font-medium text-gray-700">Motivo do reporte</label>
            <textarea value={motivoReport} onChange={e => setMotivoReport(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva o motivo..." />
            <button onClick={enviarReport} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Enviar Reporte</button>
          </div>
        </Modal>
      )} */}

      {/* Toast de erro */}
      {erro && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg text-white bg-red-600 animate-fade-in">
          {erro}
        </div>
      )}
    </div>
  )
}