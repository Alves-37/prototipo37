import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DetalheVaga() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vaga, setVaga] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalCandidatura, setModalCandidatura] = useState(false)
  const [etapaCandidatura, setEtapaCandidatura] = useState(1)
  const [errosCandidatura, setErrosCandidatura] = useState({})
  const [candidatura, setCandidatura] = useState({
    telefone: '',
    linkedin: '',
    cv: null,
    documentoFrente: null,
    documentoVerso: null,
    disponibilidade: '',
    cartaApresentacao: ''
  })
  const [showToast, setShowToast] = useState(null); // { type, message }
  const [favorito, setFavorito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [candidatado, setCandidatado] = useState(false);

  const { user } = useAuth();

  const candidaturaStorageKey = useMemo(() => {
    const uid = user?.id ?? user?._id ?? user?.usuarioId ?? ''
    return `candidatura_vaga_${String(id)}_${String(uid)}`
  }, [id, user?.id, user?._id, user?.usuarioId])

  const isMobile = useMemo(() => {
    try {
      return window.innerWidth < 768
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    async function fetchVaga() {
      try {
        setLoading(true)
        const response = await api.get(`/vagas/${id}`)
        setVaga(response.data)

        try {
          const vagaData = response.data
          const uid = user?.id ?? user?._id ?? user?.usuarioId
          const userEmail = String(user?.email || '').trim().toLowerCase()

          const candidaturasArr = Array.isArray(vagaData?.candidaturas) ? vagaData.candidaturas : []
          const jaCandidatou = candidaturasArr.some((c) => {
            try {
              const cid = c?.usuarioId ?? c?.userId ?? c?.candidatoId ?? c?.usuario?.id ?? c?.usuario?._id
              const cEmail = String(c?.email || c?.usuario?.email || '').trim().toLowerCase()
              if (uid !== undefined && uid !== null && String(cid) === String(uid)) return true
              if (userEmail && cEmail && cEmail === userEmail) return true
              return false
            } catch {
              return false
            }
          })

          if (jaCandidatou) {
            setCandidatado(true)
          } else {
            const stored = localStorage.getItem(candidaturaStorageKey)
            if (stored === '1') setCandidatado(true)
          }
        } catch {}
      } catch (err) {
        setError('Vaga não encontrada')
      } finally {
        setLoading(false)
      }
    }
    fetchVaga()
  }, [candidaturaStorageKey, id, user?.email, user?.id, user?._id, user?.usuarioId])

  const validarEtapa = (step) => {
    const nextErrors = {}
    if (step === 1) {
      if (!String(candidatura.telefone || '').trim()) nextErrors.telefone = 'Informe um telefone de contato.'
      if (!String(candidatura.disponibilidade || '').trim()) nextErrors.disponibilidade = 'Selecione sua disponibilidade.'
    }
    if (step === 2) {
      if (!candidatura.cv) nextErrors.cv = 'Anexe seu CV (obrigatório).'
      if (!candidatura.documentoFrente) nextErrors.documentoFrente = 'Anexe o documento (frente).'
      if (!candidatura.documentoVerso) nextErrors.documentoVerso = 'Anexe o documento (verso).'
    }
    if (step === 3) {
      if (!String(candidatura.cartaApresentacao || '').trim()) nextErrors.cartaApresentacao = 'Escreva uma carta de apresentação.'
    }
    setErrosCandidatura(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const irParaEtapa = (step) => {
    setEtapaCandidatura(step)
    setErrosCandidatura({})
  }

  const proximaEtapa = () => {
    if (!validarEtapa(etapaCandidatura)) {
      setShowToast({ type: 'error', message: 'Corrija os campos obrigatórios para continuar.' })
      setTimeout(() => setShowToast(null), 2200)
      return
    }
    irParaEtapa(Math.min(3, etapaCandidatura + 1))
  }

  const etapaAnterior = () => {
    irParaEtapa(Math.max(1, etapaCandidatura - 1))
  }

  const enviarCandidatura = async () => {
    if (!validarEtapa(1) || !validarEtapa(2) || !validarEtapa(3)) {
      setShowToast({ type: 'error', message: 'Preencha todos os campos obrigatórios antes de enviar.' })
      setTimeout(() => setShowToast(null), 2500)
      return
    }

    setEnviando(true);
    try {
      // Criar FormData para enviar arquivo
      const formData = new FormData();
      formData.append('vagaId', vaga.id);
      formData.append('mensagem', candidatura.cartaApresentacao);
      formData.append('telefone', candidatura.telefone);
      formData.append('linkedin', candidatura.linkedin);
      formData.append('disponibilidade', candidatura.disponibilidade);
      
      // Adicionar arquivo de CV (obrigatório)
      formData.append('curriculo', candidatura.cv);

      formData.append('documentoFrente', candidatura.documentoFrente);
      formData.append('documentoVerso', candidatura.documentoVerso);

      await api.post('/candidaturas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setCandidatado(true);
      try { localStorage.setItem(candidaturaStorageKey, '1') } catch {}
      setShowToast({ type: 'success', message: 'Candidatura enviada com sucesso!' });
      setModalCandidatura(false);
      setEtapaCandidatura(1)
      setErrosCandidatura({})
    } catch (err) {
      console.error('Erro ao enviar candidatura:', err);
      setShowToast({ type: 'error', message: 'Erro ao enviar candidatura.' });
    } finally {
      setEnviando(false);
    }
  };

  // Favoritar
  const handleFavoritar = () => {
    let favs = JSON.parse(localStorage.getItem('favoritosVagas') || '[]');
    if (favorito) {
      favs = favs.filter(vid => vid !== id);
      setShowToast({ type: 'info', message: 'Removido dos favoritos.' });
    } else {
      favs.push(id);
      setShowToast({ type: 'success', message: 'Adicionado aos favoritos!' });
    }
    localStorage.setItem('favoritosVagas', JSON.stringify(favs));
    setFavorito(!favorito);
    setTimeout(() => setShowToast(null), 1800);
  };

  // Compartilhar
  const handleCompartilhar = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: vaga.titulo, url });
        setShowToast({ type: 'success', message: 'Vaga compartilhada!' });
      } catch (err) {
        if (err && err.name === 'AbortError') {
          setShowToast({ type: 'info', message: 'Compartilhamento cancelado.' });
        } else {
          setShowToast({ type: 'error', message: 'Não foi possível compartilhar.' });
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setShowToast({ type: 'success', message: 'Link copiado para área de transferência!' });
      } catch (err) {
        setShowToast({ type: 'error', message: 'Erro ao copiar o link. Copie manualmente.' });
      }
    } else {
      setShowToast({ type: 'info', message: 'Não foi possível compartilhar.' });
    }
    setTimeout(() => setShowToast(null), 2200);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conteúdo principal skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid md:grid-cols-2 gap-3">
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (error || !vaga) return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Vaga não encontrada</h2>
      <p className="text-gray-700">A vaga que você tentou acessar não existe ou foi removida.</p>
      <Link to="/vagas" className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Voltar para Vagas</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/vagas" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar às Vagas
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          {vaga.titulo}
          {vaga.premium && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-white border border-yellow-500 ml-2">Vaga Premium ⭐</span>
          )}
        </h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {vaga.prioridade && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(vaga.prioridade)}`}>
            {vaga.prioridade.toUpperCase()}
          </span>
          )}
          {vaga.categoria && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {getCategoriaIcon(vaga.categoria)} {vaga.categoria.toUpperCase()}
          </span>
          )}
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {vaga.modalidade}
          </span>
          {/* Status da Capacidade */}
          {vaga.statusCapacidade && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              vaga.statusCapacidade === 'aberta' ? 'bg-green-100 text-green-800' :
              vaga.statusCapacidade === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {vaga.statusCapacidade === 'aberta' ? '🟢 Aberta' :
               vaga.statusCapacidade === 'parcial' ? '🟡 Quase Cheia' :
               '🔴 Fechada'}
            </span>
          )}
        </div>
        <div className="text-gray-600 text-sm">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:flex-wrap sm:items-center">
            <span className="min-w-0">👁️ {vaga.visualizacoes} visualizações</span>
            <span className="min-w-0">👥 {vaga.candidaturas?.length || 0} candidatos</span>
            <span className="min-w-0">📊 Aprovados: {vaga.candidaturas?.filter(c => c.fase === 'aprovada' || c.fase === 'contratada').length || 0}/{vaga.capacidadeVagas || 1}</span>
            <span className="min-w-0">📅 Publicada em {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informações principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Descrição da Vaga</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{vaga.descricao}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Responsabilidades</h3>
                <ul className="space-y-1">
                  {(vaga.responsabilidades || []).map((resp, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Requisitos</h3>
                <ul className="space-y-1">
                  {(Array.isArray(vaga.requisitos) ? vaga.requisitos : (vaga.requisitos ? vaga.requisitos.split('\n') : [])).map((req, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Benefícios */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Benefícios</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {(Array.isArray(vaga.beneficios) ? vaga.beneficios : (vaga.beneficios ? vaga.beneficios.split('\n') : [])).map((beneficio, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">🎁</span>
                  {beneficio}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações da empresa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Empresa</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  {(vaga.empresa?.logo || vaga.empresa?.logoUrl || vaga.empresa?.logoURL || vaga.empresa?.imagem || vaga.empresa?.foto) ? (
                    <img
                      src={vaga.empresa.logo || vaga.empresa.logoUrl || vaga.empresa.logoURL || vaga.empresa.imagem || vaga.empresa.foto}
                      alt={vaga.empresa?.nome || 'Logo da empresa'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm bg-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img
                      src="/nevu.png"
                      alt="Logo padrão"
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm bg-white"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-800">{vaga.empresa?.nome}</div>
                    <div className="text-sm text-gray-500">{vaga.empresa?.descricao}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Setor:</span>
                  <span className="font-medium">{vaga.empresa?.setor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Website:</span>
                  <span className="font-medium">
                    {vaga.empresa?.website ? (
                      <a href={vaga.empresa.website.startsWith('http') ? vaga.empresa.website : `https://${vaga.empresa.website}`}
                         target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {vaga.empresa.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Localização:</span>
                  <span className="font-medium">{vaga.empresa?.endereco || vaga.empresa?.localizacao}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Detalhes da vaga */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalhes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>📍</span>
                  <span>Localização</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{vaga.localizacao}</div>
              </div>

              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>💰</span>
                  <span>Salário</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-green-700 break-words">{vaga.salario || '—'}</div>
              </div>

              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>📄</span>
                  <span>Tipo</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{vaga.tipoContrato || '—'}</div>
              </div>

              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🧠</span>
                  <span>Experiência</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{vaga.nivelExperiencia || '—'}</div>
              </div>

              <div className="sm:col-span-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🏢</span>
                  <span>Modalidade</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {String(vaga.modalidade || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-800"
                      >
                        {m}
                      </span>
                    ))}
                  {!String(vaga.modalidade || '').trim() && (
                    <span className="text-sm font-semibold text-gray-900">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Ações */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (candidatado) return;
                  if (!user) {
                    setShowToast({ type: 'info', message: 'Faça login para se candidatar' });
                    setTimeout(() => {
                      navigate('/login', { state: { from: `/vaga/${id}` } });
                    }, 1500);
                    return;
                  }
                  setEtapaCandidatura(1)
                  setErrosCandidatura({})
                  setModalCandidatura(true);
                }}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 ${candidatado ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                disabled={candidatado}
              >
                {candidatado ? 'Candidatado!' : user ? 'Candidatar-se' : 'Login para Candidatar'}
              </button>
              <button
                onClick={handleFavoritar}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 active:scale-95 flex items-center justify-center gap-2 ${favorito ? 'bg-yellow-100 text-yellow-800 border border-yellow-400' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
              >
                <svg className={`w-5 h-5 transition-all duration-200 ${favorito ? 'fill-yellow-400' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" />
                </svg>
                {favorito ? 'Remover dos Favoritos' : 'Favoritar'}
              </button>
              <button
                onClick={handleCompartilhar}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast visual */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg text-white ${showToast.type === 'success' ? 'bg-green-500' : showToast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {showToast.message}
        </div>
      )}

      {/* Modal de Candidatura */}
      <Modal
        isOpen={modalCandidatura}
        onClose={() => setModalCandidatura(false)}
        title="Candidatar-se à Vaga"
        size={isMobile ? 'full' : 'md'}
      >
        <div className={isMobile ? 'flex flex-col h-[calc(100vh-110px)]' : ''}>
          <div className={isMobile ? 'px-1 pb-2 border-b border-gray-100' : 'mb-2'}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Etapa {etapaCandidatura}/3
              </div>
              <div className="text-xs text-gray-500">
                {etapaCandidatura === 1 ? 'Contato' : etapaCandidatura === 2 ? 'Documentos' : 'Mensagem'}
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${(etapaCandidatura / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className={isMobile ? 'flex-1 overflow-y-auto px-1 py-3 space-y-4' : 'space-y-4'}>
            {etapaCandidatura === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone de Contato *</label>
                  <input
                    type="tel"
                    value={candidatura.telefone}
                    onChange={e => setCandidatura(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="Ex: (+258) 84 123 4567"
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errosCandidatura.telefone ? 'border-red-400' : 'border-gray-300'}`}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {errosCandidatura.telefone && (
                    <p className="text-xs text-red-600 mt-1">{errosCandidatura.telefone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidade *</label>
                  <select
                    value={candidatura.disponibilidade}
                    onChange={e => setCandidatura(prev => ({ ...prev, disponibilidade: e.target.value }))}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errosCandidatura.disponibilidade ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Selecione</option>
                    <option value="imediata">Imediata</option>
                    <option value="15_dias">15 dias</option>
                    <option value="30_dias">30 dias</option>
                    <option value="60_dias">60 dias</option>
                  </select>
                  {errosCandidatura.disponibilidade && (
                    <p className="text-xs text-red-600 mt-1">{errosCandidatura.disponibilidade}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn (opcional)</label>
                  <input
                    type="url"
                    value={candidatura.linkedin}
                    onChange={e => setCandidatura(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="url"
                  />
                </div>
              </>
            )}

            {etapaCandidatura === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CV (obrigatório)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setCandidatura(prev => ({ ...prev, cv: e.target.files?.[0] || null }))}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errosCandidatura.cv ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {candidatura.cv && (
                    <p className="text-xs text-green-700 mt-1">Arquivo selecionado: {candidatura.cv.name}</p>
                  )}
                  {errosCandidatura.cv && (
                    <p className="text-xs text-red-600 mt-1">{errosCandidatura.cv}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Documento - Frente (obrigatório)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => setCandidatura(prev => ({ ...prev, documentoFrente: e.target.files?.[0] || null }))}
                      className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errosCandidatura.documentoFrente ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {candidatura.documentoFrente && (
                      <p className="text-xs text-green-700 mt-1">Selecionado: {candidatura.documentoFrente.name}</p>
                    )}
                    {errosCandidatura.documentoFrente && (
                      <p className="text-xs text-red-600 mt-1">{errosCandidatura.documentoFrente}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Documento - Verso (obrigatório)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => setCandidatura(prev => ({ ...prev, documentoVerso: e.target.files?.[0] || null }))}
                      className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errosCandidatura.documentoVerso ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {candidatura.documentoVerso && (
                      <p className="text-xs text-green-700 mt-1">Selecionado: {candidatura.documentoVerso.name}</p>
                    )}
                    {errosCandidatura.documentoVerso && (
                      <p className="text-xs text-red-600 mt-1">{errosCandidatura.documentoVerso}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Dica: foto do documento (imagem) também funciona.
                </p>
              </>
            )}

            {etapaCandidatura === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carta de Apresentação *</label>
                  <textarea
                    value={candidatura.cartaApresentacao}
                    onChange={e => setCandidatura(prev => ({ ...prev, cartaApresentacao: e.target.value }))}
                    placeholder="Conte-nos por que você seria ideal para esta vaga..."
                    rows={6}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errosCandidatura.cartaApresentacao ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errosCandidatura.cartaApresentacao && (
                    <p className="text-xs text-red-600 mt-1">{errosCandidatura.cartaApresentacao}</p>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                  <div className="font-semibold mb-1">Resumo</div>
                  <div className="text-xs text-gray-600">Telefone: {String(candidatura.telefone || '').trim() || '—'}</div>
                  <div className="text-xs text-gray-600">Disponibilidade: {String(candidatura.disponibilidade || '').trim() || '—'}</div>
                  <div className="text-xs text-gray-600">CV: {candidatura.cv?.name || '—'}</div>
                  <div className="text-xs text-gray-600">Documento frente: {candidatura.documentoFrente?.name || '—'}</div>
                  <div className="text-xs text-gray-600">Documento verso: {candidatura.documentoVerso?.name || '—'}</div>
                </div>
              </>
            )}
          </div>

          <div className={isMobile ? 'sticky bottom-0 bg-white border-t border-gray-200 pt-3 pb-2 px-1' : 'pt-4'}>
            <div className="flex gap-2">
              <button
                onClick={etapaAnterior}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 active:scale-95 ${etapaCandidatura === 1 ? 'opacity-40 cursor-not-allowed bg-gray-200 text-gray-600' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
                disabled={etapaCandidatura === 1 || enviando}
              >
                Voltar
              </button>

              {etapaCandidatura < 3 ? (
                <button
                  onClick={proximaEtapa}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 ${enviando ? 'opacity-60 cursor-not-allowed bg-blue-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  disabled={enviando}
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={enviarCandidatura}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 ${enviando ? 'opacity-60 cursor-not-allowed bg-blue-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  disabled={enviando}
                >
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              )}
            </div>

            <button
              onClick={() => setModalCandidatura(false)}
              className="mt-2 w-full px-4 py-2 bg-white text-gray-600 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Bloqueios de plano removidos: candidaturas livres */}
    </div>
  )
}