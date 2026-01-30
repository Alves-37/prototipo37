import { useState, useEffect } from 'react'
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

  useEffect(() => {
    async function fetchVaga() {
      try {
        setLoading(true)
        const response = await api.get(`/vagas/${id}`)
        setVaga(response.data)
      } catch (err) {
        setError('Vaga não encontrada')
      } finally {
        setLoading(false)
      }
    }
    fetchVaga()
  }, [id])

  // Checar favorito no localStorage
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favoritosVagas') || '[]');
    setFavorito(favs.includes(id));
  }, [id]);

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'tecnologia': return '💻'
      case 'design': return '🎨'
      case 'marketing': return '📈'
      case 'administrativo': return '📊'
      default: return '💼'
    }
  }

  const enviarCandidatura = async () => {
    setEnviando(true);
    try {
      // Criar FormData para enviar arquivo
      const formData = new FormData();
      formData.append('vagaId', vaga.id);
      formData.append('mensagem', candidatura.cartaApresentacao);
      formData.append('telefone', candidatura.telefone);
      formData.append('linkedin', candidatura.linkedin);
      formData.append('disponibilidade', candidatura.disponibilidade);
      
      // Adicionar arquivo de CV se existir
      if (candidatura.cv) {
        formData.append('curriculo', candidatura.cv);
      }

      // Validar documentos obrigatórios
      if (!candidatura.documentoFrente || !candidatura.documentoVerso) {
        setShowToast({ type: 'error', message: 'Anexe o documento (frente e verso) para enviar a candidatura.' });
        setTimeout(() => setShowToast(null), 2500);
        setEnviando(false);
        return;
      }
      formData.append('documentoFrente', candidatura.documentoFrente);
      formData.append('documentoVerso', candidatura.documentoVerso);

      await api.post('/candidaturas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setCandidatado(true);
      setShowToast({ type: 'success', message: 'Candidatura enviada com sucesso!' });
      setModalCandidatura(false);
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
        <div className="flex items-center text-gray-600 text-sm">
          <span className="mr-4">👁️ {vaga.visualizacoes} visualizações</span>
          <span className="mr-4">👥 {vaga.candidaturas?.length || 0} candidatos</span>
          <span className="mr-4">📊 Aprovados: {vaga.candidaturas?.filter(c => c.fase === 'aprovada' || c.fase === 'contratada').length || 0}/{vaga.capacidadeVagas || 1}</span>
          <span>📅 Publicada em {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}</span>
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Localização:</span>
                <span className="font-medium">{vaga.localizacao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salário:</span>
                <span className="font-medium text-green-600">{vaga.salario}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{vaga.tipoContrato}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experiência:</span>
                <span className="font-medium">{vaga.nivelExperiencia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modalidade:</span>
                <span className="font-medium">{vaga.modalidade}</span>
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
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone de Contato *</label>
            <input
              type="text"
              value={candidatura.telefone}
              onChange={e => setCandidatura(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="Ex: (+258) 84 123 4567"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn (opcional)</label>
            <input
              type="url"
              value={candidatura.linkedin}
              onChange={e => setCandidatura(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/seu-perfil"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CV (PDF, obrigatório)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => setCandidatura(prev => ({ ...prev, cv: e.target.files[0] }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {candidatura.cv && (
              <p className="text-xs text-green-700 mt-1">Arquivo selecionado: {candidatura.cv.name}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Documento de Identificação - Frente (obrigatório)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setCandidatura(prev => ({ ...prev, documentoFrente: e.target.files[0] }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {candidatura.documentoFrente && (
                <p className="text-xs text-green-700 mt-1">Selecionado: {candidatura.documentoFrente.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Documento de Identificação - Verso (obrigatório)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setCandidatura(prev => ({ ...prev, documentoVerso: e.target.files[0] }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {candidatura.documentoVerso && (
                <p className="text-xs text-green-700 mt-1">Selecionado: {candidatura.documentoVerso.name}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidade *</label>
            <select
              value={candidatura.disponibilidade}
              onChange={e => setCandidatura(prev => ({ ...prev, disponibilidade: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione</option>
              <option value="imediata">Imediata</option>
              <option value="15_dias">15 dias</option>
              <option value="30_dias">30 dias</option>
              <option value="60_dias">60 dias</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Carta de Apresentação *</label>
            <textarea
              value={candidatura.cartaApresentacao}
              onChange={e => setCandidatura(prev => ({ ...prev, cartaApresentacao: e.target.value }))}
              placeholder="Conte-nos por que você seria ideal para esta vaga..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={enviarCandidatura}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 ${enviando ? 'opacity-60 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : 'Enviar Candidatura'}
            </button>
            <button
              onClick={() => setModalCandidatura(false)}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 active:scale-95"
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