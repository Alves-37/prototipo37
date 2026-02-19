import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Modal from '../components/Modal'
import { useMonetizacao } from '../context/MonetizacaoContext';
import NotificacoesSwitch from '../components/NotificacoesSwitch';
import api from '../services/api'
import { uploadsUrl } from '../services/url'
import { io as ioClient } from 'socket.io-client'
import mensagemService from '../services/mensagemService'

export default function Perfil() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const { assinatura, planosCandidato } = useMonetizacao();
  const { id } = useParams()
  const navigate = useNavigate();
  const location = useLocation();
  const [publicMessageLoading, setPublicMessageLoading] = useState(false)
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
  const [activePostImageUrl, setActivePostImageUrl] = useState('')
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

  const openPublicChat = async () => {
    if (!user?.id) {
      navigate('/login')
      return
    }
    if (!id) return

    try {
      setPublicMessageLoading(true)
      const resp = await mensagemService.iniciarConversa(id)
      const conversaId = resp?.conversa?.id ?? resp?.id ?? resp?.conversaId ?? null

      if (!conversaId) {
        setErro('Não foi possível abrir a conversa.')
        setTimeout(() => setErro(''), 3000)
        return
      }

      navigate(`/mensagens?chat=${encodeURIComponent(conversaId)}`)
    } catch (err) {
      console.error('Erro ao abrir conversa (perfil público):', err)
      setErro('Não foi possível abrir a conversa.')
      setTimeout(() => setErro(''), 3000)
    } finally {
      setPublicMessageLoading(false)
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
                  <div className="flex flex-row flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
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
                      <div className="min-w-0 flex-1 pb-2 sm:pb-0 text-left">
                        <div className="text-2xl font-extrabold text-gray-900 break-words leading-tight">{displayName}</div>
                        <div className="text-sm text-gray-600 mt-1 min-w-0">
                          <span className="block line-clamp-2">{headline}</span>
                          <span className="block truncate">{locationLabel}</span>
                        </div>
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
                      <button
                        type="button"
                        onClick={openPublicChat}
                        disabled={publicMessageLoading}
                        className={`px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition ${publicMessageLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {publicMessageLoading ? 'A abrir…' : 'Mensagem'}
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
                            <img
                              src={resolveMaybeUploadUrl(p.imageUrl)}
                              alt=""
                              className="w-full max-h-96 object-cover cursor-pointer"
                              onClick={() => setActivePostImageUrl(resolveMaybeUploadUrl(p.imageUrl))}
                            />
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

  // Stubs para seções ainda não implementadas (evita ReferenceError)
  const renderSecaoPessoal = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Sobre" em construção.</p></div>
  const renderSecaoProfissional = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Profissional" em construção.</p></div>
  const renderSecaoCurriculo = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Currículo" em construção.</p></div>
  const renderSecaoRedesSociais = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Redes Sociais" em construção.</p></div>
  const renderSecaoCertificacoes = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Certificações" em construção.</p></div>
  const renderSecaoIdiomas = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Idiomas" em construção.</p></div>
  const renderSecaoNotificacoes = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Notificações" em construção.</p></div>
  const renderSecaoPrivacidade = () => <div className="bg-white rounded-2xl shadow p-6"><p className="text-gray-500">Seção "Privacidade" em construção.</p></div>

  const renderSecaoPublicacoes = () => {
    const resolveMaybeUploadUrl = (maybePath) => {
      if (!maybePath) return ''
      const raw = String(maybePath)
      if (!raw) return ''

      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
      return uploadsUrl(raw)
    }

    return (
      <div className="bg-white rounded-2xl shadow p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
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
          <div className="space-y-3 sm:space-y-4">
            {ownProfilePosts.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">Você</div>
                      {p?.createdAt ? (
                        <div className="text-[12px] text-gray-500 truncate">
                          {(() => {
                            try { return new Date(p.createdAt).toLocaleString('pt-BR') } catch { return '' }
                          })()}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
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
                      <img
                        src={resolveMaybeUploadUrl(p.imageUrl)}
                        alt=""
                        className="w-full max-h-96 object-cover cursor-pointer"
                        onClick={() => setActivePostImageUrl(resolveMaybeUploadUrl(p.imageUrl))}
                      />
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
        )}
      </div>
    )
  }

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
            <div className="relative -mt-10 sm:-mt-14">
              <div className="flex flex-row items-end justify-between gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white p-1 shadow">
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

                <div className="w-auto sm:w-auto">
                  {!editando && (
                    <button
                      type="button"
                      onClick={() => setEditando(true)}
                      className="w-auto sm:w-auto px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      Editar perfil
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 pb-4 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 break-words">{formData.nome}</div>
                <div className="text-sm text-gray-600 break-all">{formData.email}</div>
              </div>
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

      {editando && (
        <div className="sm:hidden h-20" />
      )}

      {/* Botões de ação - posicionados no final */}
      {editando && (
        <div className="fixed left-0 right-0 bottom-0 z-50 sm:hidden">
          <div className="bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-3">
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-xl transition font-semibold text-sm ${
                  isLoading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="perfil-form"
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 font-semibold text-sm ${
                  isLoading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden sm:flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mb-8 mt-8">
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

      {/* Overlay fullscreen para imagem da publicação */}
      {activePostImageUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black"
          onClick={() => setActivePostImageUrl('')}
        >
          <div
            className="relative w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full bg-black">
              <img
                src={activePostImageUrl}
                alt=""
                className="w-full h-full object-contain bg-black"
              />
              <button
                onClick={() => setActivePostImageUrl('')}
                className="fixed top-4 right-4 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/10"
                aria-label="Fechar imagem"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}