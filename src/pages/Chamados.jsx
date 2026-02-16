import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../services/api';

export default function Chamados() {

  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [filtroCategoria, setFiltroCategoria] = useState(searchParams.get('categoria') || 'todas')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [debBusca, setDebBusca] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalheChamado, setDetalheChamado] = useState(null);
  const [modalResposta, setModalResposta] = useState(false);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [isProposta, setIsProposta] = useState(false);
  const [respostaOrcamento, setRespostaOrcamento] = useState('');
  const [respostaPrazo, setRespostaPrazo] = useState('');
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [chamadoParaResponder, setChamadoParaResponder] = useState(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mostrandoMeusChamados, setMostrandoMeusChamados] = useState(false);
  const [formEdit, setFormEdit] = useState({ id: null, titulo: '', descricao: '', categoria: 'outros', prioridade: 'baixa', localizacao: '', orcamento: '', prazo: '' });
  const [imagensEdit, setImagensEdit] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Auto-fechar toast após 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Debounce da busca (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebBusca(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  // Carregar chamados da API
  const carregarChamados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/chamados';
      const params = new URLSearchParams();
      
      if (mostrandoMeusChamados) {
        if (!user) {
          // Se não estiver logado, não pode ver "Meus Chamados"
          setChamados([]);
          setLoading(false);
          return;
        }
        endpoint = '/chamados/usuario/meus';
      } else {
        if (filtroCategoria !== 'todas') params.append('categoria', filtroCategoria);
        if (filtroStatus !== 'todos') params.append('status', filtroStatus);
        if (debBusca) params.append('busca', debBusca);
        // Filtrar chamados do usuário logado na página principal
        if (user) {
          params.append('excluirUsuario', user.id);
        }
      }
      
      
      const response = await api.get(`${endpoint}?${params.toString()}`);
      setChamados(response.data.chamados || response.data);
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
      setError('Erro ao carregar chamados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recarregar em tempo real quando chegar push com a aba visível
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event) => {
      if (event.data?.type === 'PUSH_RECEIVED' && document.visibilityState === 'visible') {
        setReloadTick((t) => t + 1);
        // Se um detalhe estiver aberto, tentar atualizá-lo também
        if (detalheChamado?.id) {
          buscarDetalhesChamado(detalheChamado.id);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [detalheChamado]);

  // Abrir modal de edição preenchendo dados
  const abrirEdicao = (ch) => {
    setFormEdit({
      id: ch.id,
      titulo: ch.titulo,
      descricao: ch.descricao,
      categoria: ch.categoria,
      prioridade: ch.prioridade,
      localizacao: ch.localizacao || '',
      orcamento: ch.orcamento || '',
      prazo: ch.prazo ? new Date(ch.prazo).toISOString().split('T')[0] : ''
    });
    setImagensEdit([]);
    setModalEditar(true);
  };

  // Salvar edição via API
  const salvarEdicao = async () => {
    if (!formEdit.id || !formEdit.titulo || !formEdit.descricao) {
      setToast({ type: 'error', message: 'Preencha título e descrição.' });
      return;
    }
    try {
      setSalvando(true);
      const hasImagens = Array.isArray(imagensEdit) && imagensEdit.length > 0;
      if (hasImagens) {
        const fd = new FormData();
        fd.append('titulo', String(formEdit.titulo || ''));
        fd.append('descricao', String(formEdit.descricao || ''));
        fd.append('categoria', String(formEdit.categoria || 'outros'));
        fd.append('prioridade', String(formEdit.prioridade || 'media'));
        fd.append('localizacao', String(formEdit.localizacao || ''));
        fd.append('orcamento', String(formEdit.orcamento || ''));
        fd.append('prazo', formEdit.prazo ? String(formEdit.prazo) : '');
        imagensEdit.forEach((f) => fd.append('imagens', f));

        await api.put(`/chamados/${formEdit.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.put(`/chamados/${formEdit.id}`, {
          titulo: formEdit.titulo,
          descricao: formEdit.descricao,
          categoria: formEdit.categoria,
          prioridade: formEdit.prioridade,
          localizacao: formEdit.localizacao,
          orcamento: formEdit.orcamento,
          prazo: formEdit.prazo || null,
        });
      }
      setToast({ type: 'success', message: 'Chamado atualizado!' });
      setModalEditar(false);
      setImagensEdit([]);
      // Recarregar lista e detalhes se abertos
      carregarChamados();
      if (detalheChamado && detalheChamado.id === formEdit.id) {
        buscarDetalhesChamado(formEdit.id);
      }
    } catch (err) {
      console.error('Erro ao atualizar chamado:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao atualizar chamado' });
    } finally {
      setSalvando(false);
    }
  };

  // Excluir chamado
  const excluirChamado = async (id) => {
    if (!id) return;
    try {
      setExcluindo(true);
      await api.delete(`/chamados/${id}`);
      setToast({ type: 'success', message: 'Chamado excluído.' });
      setDetalheChamado(null);
      setModalEditar(false);
      carregarChamados();
    } catch (err) {
      console.error('Erro ao excluir chamado:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao excluir chamado' });
    } finally {
      setExcluindo(false);
    }
  };

  const abrirExcluir = (id) => { setDeleteId(id); setDeleteModalOpen(true); };
  const cancelarExcluir = () => { setDeleteModalOpen(false); setDeleteId(null); };
  const confirmarExcluir = async () => {
    const id = deleteId;
    setDeleteModalOpen(false);
    setDeleteId(null);
    await excluirChamado(id);
  };

  // Carregar chamados quando os filtros mudarem
  useEffect(() => {
    carregarChamados();
  }, [filtroCategoria, filtroStatus, debBusca, mostrandoMeusChamados, reloadTick]);

  // Buscar detalhes do chamado
  const buscarDetalhesChamado = async (id) => {
    try {
      const response = await api.get(`/chamados/${id}`);
      setDetalheChamado(response.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do chamado:', err);
      setToast({ type: 'error', message: 'Erro ao carregar detalhes do chamado' });
    }
  };

  // Enviar resposta
  const enviarResposta = async () => {
    if (!respostaTexto.trim()) {
      setToast({ type: 'error', message: 'Digite uma resposta' });
      return;
    }
    if (respostaTexto.trim().length < 5) {
      setToast({ type: 'error', message: 'A resposta deve ter pelo menos 5 caracteres.' });
      return;
    }
    if (isProposta) {
      // Validações básicas para proposta
      if (!respostaOrcamento || isNaN(Number(respostaOrcamento))) {
        setToast({ type: 'error', message: 'Informe um orçamento válido.' });
        return;
      }
      // prazo opcional, mas se informado, deve ser uma data válida
      if (respostaPrazo && isNaN(new Date(respostaPrazo).getTime())) {
        setToast({ type: 'error', message: 'Informe um prazo válido.' });
        return;
      }
    }

    try {
      setEnviandoResposta(true);
      await api.post(`/chamados/${chamadoParaResponder.id}/respostas`, {
        resposta: respostaTexto.trim(),
        tipo: isProposta ? 'proposta' : 'resposta',
        orcamento: isProposta ? Number(respostaOrcamento) : undefined,
        prazo: isProposta && respostaPrazo ? respostaPrazo : undefined,
      });
      
      setToast({ type: 'success', message: 'Resposta enviada com sucesso!' });
      setModalResposta(false);
      setRespostaTexto('');
      setIsProposta(false);
      setRespostaOrcamento('');
      setRespostaPrazo('');
      setChamadoParaResponder(null);
      
      // Recarregar detalhes do chamado se estiver aberto
      if (detalheChamado && detalheChamado.id === chamadoParaResponder.id) {
        buscarDetalhesChamado(chamadoParaResponder.id);
      }
    } catch (err) {
      console.error('Erro ao enviar resposta:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao enviar resposta' });
    } finally {
      setEnviandoResposta(false);
    }
  };

  // Aceitar proposta
  const aceitarProposta = async (chamadoId, respostaId) => {
    try {
      await api.put(`/chamados/${chamadoId}/respostas/${respostaId}/aceitar`);
      setToast({ type: 'success', message: 'Proposta aceita com sucesso!' });
      
      // Recarregar detalhes do chamado
      if (detalheChamado && detalheChamado.id === chamadoId) {
        buscarDetalhesChamado(chamadoId);
      }
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao aceitar proposta' });
    }
  };

  // Concluir chamado
  const concluirChamado = async (chamadoId, avaliacao = null, comentario = null) => {
    try {
      
      
      const response = await api.put(`/chamados/${chamadoId}/concluir`, { avaliacao, comentario });
      
      setToast({ type: 'success', message: 'Chamado concluído com sucesso!' });
      
      // Recarregar detalhes do chamado
      if (detalheChamado && detalheChamado.id === chamadoId) {
        buscarDetalhesChamado(chamadoId);
      }
    } catch (err) {
      console.error('Erro ao concluir chamado:', err);
      console.error('Status do erro:', err.response?.status);
      console.error('Dados do erro:', err.response?.data);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao concluir chamado' });
    }
  };

  // Fechar chamado
  const fecharChamado = async (chamadoId, motivo = null) => {
    try {
      await api.put(`/chamados/${chamadoId}/fechar`, { motivo });
      setToast({ type: 'success', message: 'Chamado fechado com sucesso!' });
      
      // Recarregar detalhes do chamado
      if (detalheChamado && detalheChamado.id === chamadoId) {
        buscarDetalhesChamado(chamadoId);
      }
    } catch (err) {
      console.error('Erro ao fechar chamado:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao fechar chamado' });
    }
  };

  // Reabrir chamado
  const reabrirChamado = async (chamadoId) => {
    try {
      await api.put(`/chamados/${chamadoId}/reabrir`);
      setToast({ type: 'success', message: 'Chamado reaberto com sucesso!' });
      
      // Recarregar detalhes do chamado
      if (detalheChamado && detalheChamado.id === chamadoId) {
        buscarDetalhesChamado(chamadoId);
      }
    } catch (err) {
      console.error('Erro ao reabrir chamado:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Erro ao reabrir chamado' });
    }
  };

  // Favoritar/desfavoritar chamado
  const toggleFavorito = async (chamado) => {
    try {
      await api.put(`/chamados/${chamado.id}/favorito`);
      // Atualizar estado local
      setChamados(prev => prev.map(c => 
        c.id === chamado.id ? { ...c, favoritado: !c.favoritado } : c
      ));
    } catch (err) {
      console.error('Erro ao favoritar chamado:', err);
    }
  };

  const categorias = [
    { id: 'todas', nome: 'Todas as Categorias' },
    { id: 'tecnologia', nome: 'Tecnologia' },
    { id: 'domestico', nome: 'Doméstico' },
    { id: 'design', nome: 'Design' },
    { id: 'educacao', nome: 'Educação' },
    { id: 'manutencao', nome: 'Manutenção' },
    { id: 'fotografia', nome: 'Fotografia' },
    { id: 'outros', nome: 'Outros' }
  ];

  const statusOptions = [
    { id: 'todos', nome: 'Todos os Status' },
    { id: 'aberto', nome: 'Aberto' },
    { id: 'em_andamento', nome: 'Em Andamento' },
    { id: 'concluido', nome: 'Concluído' },
    { id: 'fechado', nome: 'Fechado' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'aberto': return 'bg-green-100 text-green-800'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
      case 'concluido': return 'bg-blue-100 text-blue-800'
      case 'fechado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aberto': return 'Aberto'
      case 'em_andamento': return 'Em Andamento'
      case 'concluido': return 'Concluído'
      case 'fechado': return 'Fechado'
      default: return status
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  };

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'tecnologia': return '💻'
      case 'domestico': return '🏠'
      case 'design': return '🎨'
      case 'educacao': return '📚'
      case 'manutencao': return '🔧'
      case 'fotografia': return '📷'
      default: return '📋'
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 pb-20 md:pb-6">
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="mt-4 h-4 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg shadow border-l-4 border-gray-200 bg-white">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chamados</h1>
        <p className="text-gray-600">Encontre serviços ou ofereça suas habilidades</p>
        
        {/* Botão Meus Chamados */}
        {user && (
          <div className="mt-4">
            <button
              onClick={() => {
                setMostrandoMeusChamados(!mostrandoMeusChamados)
                setMostrarFiltros(false)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mostrandoMeusChamados 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mostrandoMeusChamados ? '📋 Ver Todos os Chamados' : '👤 Meus Chamados'}
            </button>
            {mostrandoMeusChamados && (
              <p className="text-sm text-gray-600 mt-2">
                Mostrando seus chamados publicados. Clique em "Ver Detalhes" para ver as respostas recebidas.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca (sempre visível) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por título, descrição ou localização..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-3 md:hidden">
              <button
                type="button"
                onClick={() => setMostrarFiltros((v) => !v)}
                className="w-full px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
              >
                {mostrarFiltros ? 'Ocultar filtros' : 'Ver filtros'}
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div className={`${mostrarFiltros ? '' : 'hidden'} md:block`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={`${mostrarFiltros ? '' : 'hidden'} md:block`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status.id} value={status.id}>{status.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-4 text-sm text-gray-600">
          {chamados.length} chamado(s) encontrado(s) {loading && <span className="ml-2 text-gray-400">• carregando...</span>}
        </div>
      </div>

      {/* Botão Novo Chamado */}
      <div className="mb-6">
        {user ? (
          <Link
            to="/novo-chamado"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Chamado
          </Link>
        ) : (
          <button
            onClick={() => {
              setToast({ type: 'info', message: 'Faça login para criar um chamado' });
              setTimeout(() => {
                navigate('/login', { state: { from: '/chamados' } });
              }, 1500);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Login para Criar Chamado
          </button>
        )}
      </div>

      {/* Lista de Chamados */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chamados.map(chamado => {
          const isPrioritario = chamado.prioridade === 'alta';
          const isMeuChamado = user && chamado.usuarioId === user.id;
          return (
            <div key={chamado.id} className={`p-4 rounded-lg shadow flex flex-col sm:flex-row sm:items-center justify-between ${
              isMeuChamado ? 'border-l-4 border-blue-500 bg-blue-50' :
              isPrioritario ? 'border-l-4 border-green-500 bg-green-50' : 
              'border-l-4 border-gray-200 bg-white'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800">{chamado.titulo}</span>
                  {isMeuChamado && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white ml-2">Meu Chamado</span>
                  )}
                  {isPrioritario && !isMeuChamado && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white ml-2">Prioritário</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">Aberto em {formatarData(chamado.data)}</div>
                <div className="text-sm text-gray-600 mb-2">{chamado.descricao.substring(0, 100)}...</div>
                
                {/* Informações do autor */}
                {chamado.usuario && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                      {chamado.usuario.foto ? (
                        <img 
                          src={chamado.usuario.foto} 
                          alt={chamado.usuario.nome}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        chamado.usuario.nome?.charAt(0) || 'U'
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{chamado.usuario.nome}</span>
                  </div>
                )}

                {/* Contador de respostas */}
                {chamado.totalRespostas > 0 && (
                  <div className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                    <span className="text-blue-500">💬</span>
                    <span className="font-medium">{chamado.totalRespostas} resposta{chamado.totalRespostas > 1 ? 's' : ''}</span>
                    {mostrandoMeusChamados && (
                      <span className="text-green-600 font-bold">• Ver respostas</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 sm:mt-0 flex flex-col gap-2 items-end min-w-[120px]">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(chamado.status)}`}>
                  {getStatusText(chamado.status)}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-xs border border-gray-300"
                    onClick={() => buscarDetalhesChamado(chamado.id)}
                  >
                    {mostrandoMeusChamados ? 'Ver Respostas' : 'Ver Detalhes'}
                  </button>
                  {isMeuChamado && (
                    <>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        onClick={() => abrirEdicao(chamado)}
                        title="Editar chamado"
                      >
                        Editar
                      </button>
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        onClick={() => abrirExcluir(chamado.id)}
                        title="Excluir chamado"
                        disabled={excluindo}
                      >
                        {excluindo ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </>
                  )}
                  {chamado.favoritado && (
                    <button
                      className="px-2 py-1 text-yellow-600 hover:text-yellow-700"
                      onClick={() => toggleFavorito(chamado)}
                      title="Remover dos favoritos"
                    >
                      ⭐
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem quando não há resultados */}
      {chamados.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {mostrandoMeusChamados ? '📝' : '🔍'}
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {mostrandoMeusChamados ? 'Você ainda não publicou nenhum chamado' : 'Nenhum chamado encontrado'}
          </h3>
          <p className="text-gray-600">
            {mostrandoMeusChamados 
              ? 'Crie seu primeiro chamado para começar a receber propostas de profissionais' 
              : 'Tente ajustar os filtros ou criar um novo chamado'
            }
          </p>
          {mostrandoMeusChamados && (
            <Link
              to="/novo-chamado"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mt-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Criar Primeiro Chamado
            </Link>
          )}
        </div>
      )}

      {/* Modal de detalhes do chamado */}
      {detalheChamado && (
        <Modal isOpen={!!detalheChamado} onClose={() => setDetalheChamado(null)} title={null}>
          <div className="space-y-4">
            {/* Topo: Ícone e categoria */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">
                {getCategoriaIcon(detalheChamado.categoria)}
              </span>
              <div>
                <h2 className="text-2xl font-bold text-blue-800 leading-tight">{detalheChamado.titulo}</h2>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {/* Badge categoria */}
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      {detalheChamado.categoria.charAt(0).toUpperCase() + detalheChamado.categoria.slice(1)}
                    </span>
                  {/* Badge prioridade */}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPrioridadeColor(detalheChamado.prioridade)}`}>
                      Prioridade: {detalheChamado.prioridade.charAt(0).toUpperCase() + detalheChamado.prioridade.slice(1)}
                    </span>
                  {/* Badge status */}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(detalheChamado.status)}`}>
                    {getStatusText(detalheChamado.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de informações principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Localização</div>
                <div className="font-semibold text-gray-800">{detalheChamado.localizacao || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Orçamento</div>
                <div className="font-semibold text-gray-800">{detalheChamado.orcamento || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Prazo</div>
                <div className="font-semibold text-gray-800">{detalheChamado.prazo ? formatarData(detalheChamado.prazo) : '-'}</div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Descrição</div>
              <div className="bg-white rounded-lg p-3 border text-gray-700 text-sm">{detalheChamado.descricao}</div>
            </div>

            {/* Requisitos */}
            {detalheChamado.requisitos && detalheChamado.requisitos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-600 text-lg">✔️</span>
                  <span className="text-xs text-gray-500">Requisitos do Profissional</span>
                </div>
                <ul className="list-disc ml-6 text-sm text-gray-800 space-y-1">
                  {detalheChamado.requisitos.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contato */}
            <div className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a2 2 0 011.7 1l1.09 2.18a2 2 0 01-.45 2.45l-1.27 1.02a11.05 11.05 0 005.52 5.52l1.02-1.27a2 2 0 012.45-.45l2.18 1.09a2 2 0 011 1.7V19a2 2 0 01-2 2h-1C7.82 21 3 16.18 3 10V9a2 2 0 012-2z" /></svg>
                <span className="font-medium text-gray-700 text-sm">{detalheChamado.telefone}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm2 0a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                <span className="font-medium text-gray-700 text-sm">{detalheChamado.email}</span>
              </div>
            </div>

            {/* Informações do ciclo de vida */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="text-xs text-gray-500">
                <strong>Data de abertura:</strong> <span className="font-semibold text-gray-700">{formatarData(detalheChamado.data)}</span>
              </div>
              
              {detalheChamado.dataConclusao && (
                <div className="text-xs text-gray-500">
                  <strong>Data de conclusão:</strong> <span className="font-semibold text-green-700">{formatarData(detalheChamado.dataConclusao)}</span>
                </div>
              )}
              
              {detalheChamado.dataFechamento && (
                <div className="text-xs text-gray-500">
                  <strong>Data de fechamento:</strong> <span className="font-semibold text-red-700">{formatarData(detalheChamado.dataFechamento)}</span>
                  {detalheChamado.motivoFechamento && (
                    <span className="ml-2 text-gray-600">({detalheChamado.motivoFechamento})</span>
                  )}
                </div>
              )}
              
              {detalheChamado.dataReabertura && (
                <div className="text-xs text-gray-500">
                  <strong>Data de reabertura:</strong> <span className="font-semibold text-blue-700">{formatarData(detalheChamado.dataReabertura)}</span>
                </div>
              )}
            </div>

            {/* Histórico de respostas - APENAS para o autor do chamado */}
            {user && detalheChamado.usuarioId === user.id && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-600 font-semibold">
                    💬 Respostas ({detalheChamado.respostasList ? detalheChamado.respostasList.length : 0}):
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    ✨ Você é o autor deste chamado
                  </span>
                </div>
                

                
                {detalheChamado.respostasList && detalheChamado.respostasList.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {detalheChamado.respostasList.map((resposta, idx) => (
                      <div key={idx} className={`bg-gray-50 rounded-lg p-3 border-l-4 ${
                        resposta.aceita ? 'border-green-500 bg-green-50' : 'border-blue-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                            {resposta.usuario?.foto ? (
                              <img 
                                src={resposta.usuario.foto} 
                                alt={resposta.usuario.nome}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              resposta.usuario?.nome?.charAt(0) || 'U'
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{resposta.usuario?.nome}</span>
                          <span className="text-xs text-gray-500">{formatarData(resposta.data)}</span>
                          {resposta.tipo === 'proposta' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Proposta</span>
                          )}
                          {resposta.aceita && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">✅ Aceita</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{resposta.resposta}</p>
                        
                        {/* Informações adicionais da proposta */}
                        {(resposta.orcamento || resposta.prazo) && (
                          <div className="text-xs text-gray-600 space-y-1 bg-white p-2 rounded border">
                            {resposta.orcamento && (
                              <div><strong>💰 Orçamento:</strong> {resposta.orcamento}</div>
                            )}
                            {resposta.prazo && (
                              <div><strong>📅 Prazo:</strong> {formatarData(resposta.prazo)}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Botão para aceitar proposta */}
                        {!resposta.aceita && (
                          <button
                            onClick={() => aceitarProposta(detalheChamado.id, resposta.id)}
                            className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            ✅ Aceitar Proposta
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">💬</div>
                    <p className="text-sm text-gray-600">
                      Ainda não há respostas para este chamado
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Mensagem para outros usuários */}
            {(!user || detalheChamado.usuarioId !== user.id) && (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm text-gray-600">
                  {user ? 'Seja o primeiro a responder este chamado' : 'Faça login para responder este chamado'}
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    detalheChamado.favoritado 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleFavorito(detalheChamado)}
                >
                  {detalheChamado.favoritado ? '⭐ Favoritado' : '☆ Favoritar'}
                </button>
                {user && detalheChamado.usuarioId === user.id && (
                  <>
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition"
                      onClick={() => abrirEdicao(detalheChamado)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700 transition"
                      onClick={() => excluirChamado(detalheChamado.id)}
                      disabled={excluindo}
                    >
                      {excluindo ? 'Excluindo...' : '🗑 Excluir'}
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {/* Botões para o autor do chamado */}
                {user && detalheChamado.usuarioId === user.id && (
                  <>
                    {detalheChamado.status === 'em_andamento' && (
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                        onClick={() => concluirChamado(detalheChamado.id)}
                        title="Marcar como concluído"
                      >
                        ✅ Concluir
                      </button>
                    )}
                    
                    {detalheChamado.status === 'aberto' && (
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                        onClick={() => fecharChamado(detalheChamado.id)}
                        title="Fechar chamado"
                      >
                        🔒 Fechar
                      </button>
                    )}
                    
                    {detalheChamado.status === 'fechado' && (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => reabrirChamado(detalheChamado.id)}
                        title="Reabrir chamado"
                      >
                        🔓 Reabrir
                      </button>
                    )}
                  </>
                )}
                
                {/* Botão de resposta para todos os usuários */}
                {(!user || detalheChamado.usuarioId !== user.id) && detalheChamado.status === 'aberto' && (
                  <button
                    className={`px-6 py-2 rounded-lg font-bold shadow text-base transition bg-blue-600 text-white hover:bg-blue-700`}
                    onClick={() => {
                      if (!user) {
                        setToast({ type: 'info', message: 'Faça login para responder ao chamado' });
                        setTimeout(() => {
                          navigate('/login', { state: { from: `/chamado/${detalheChamado.id}` } });
                        }, 1500);
                        return;
                      }
                      setChamadoParaResponder(detalheChamado);
                      setModalResposta(true);
                    }}
                    disabled={false}
                  >
                    {user ? 'Responder' : 'Login para Responder'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de confirmação para exclusão */}
      <Modal isOpen={deleteModalOpen} onClose={cancelarExcluir} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelarExcluir}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarExcluir}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={excluindo}
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de resposta */}
      {modalResposta && (
        <Modal isOpen={modalResposta} onClose={() => setModalResposta(false)} title="Responder Chamado">
          <div className="space-y-4">
            {/* Toggle Resposta/Proposta */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4" checked={isProposta} onChange={(e) => setIsProposta(e.target.checked)} />
                Enviar como Proposta (com orçamento e prazo)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sua resposta:</label>
              <textarea
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
                placeholder="Digite sua resposta, proposta ou dúvida..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
            </div>
            {isProposta && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento proposto (MT) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={respostaOrcamento}
                    onChange={(e) => setRespostaOrcamento(e.target.value)}
                    placeholder="Ex: 2500.00"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prazo proposto</label>
                  <input
                    type="date"
                    value={respostaPrazo}
                    onChange={(e) => setRespostaPrazo(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalResposta(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarResposta}
                disabled={enviandoResposta || !respostaTexto.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {enviandoResposta ? 'Enviando...' : (isProposta ? 'Enviar Proposta' : 'Enviar Resposta')}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {modalEditar && (
        <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} title="Editar Chamado">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input type="text" value={formEdit.titulo} onChange={e=>setFormEdit({...formEdit, titulo: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea rows={4} value={formEdit.descricao} onChange={e=>setFormEdit({...formEdit, descricao: e.target.value})} className="w-full p-2 border rounded"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto do problema (opcional)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length) return
                  setImagensEdit((prev) => {
                    const next = [...(Array.isArray(prev) ? prev : []), ...files]
                    return next.slice(0, 5)
                  })
                  e.target.value = ''
                }}
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Ao selecionar novas fotos, elas substituem as fotos anteriores do chamado.</p>

              {imagensEdit.length > 0 && (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {imagensEdit.map((file, idx) => {
                    const url = URL.createObjectURL(file)
                    return (
                      <div key={`${file.name}-${file.size}-${idx}`} className="relative">
                        <img
                          src={url}
                          alt="preview"
                          className="w-full h-20 object-cover rounded-lg border"
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                        <button
                          type="button"
                          onClick={() => setImagensEdit((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                          aria-label="Remover imagem"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={formEdit.categoria} onChange={e=>setFormEdit({...formEdit, categoria: e.target.value})} className="w-full p-2 border rounded">
                  {categorias.filter(c=>c.id!=='todas').map(c=>(<option key={c.id} value={c.id}>{c.nome}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select value={formEdit.prioridade} onChange={e=>setFormEdit({...formEdit, prioridade: e.target.value})} className="w-full p-2 border rounded">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input type="text" value={formEdit.localizacao} onChange={e=>setFormEdit({...formEdit, localizacao: e.target.value})} className="w-full p-2 border rounded"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento</label>
                <input type="text" value={formEdit.orcamento} onChange={e=>setFormEdit({...formEdit, orcamento: e.target.value})} className="w-full p-2 border rounded"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                <input type="date" value={formEdit.prazo} onChange={e=>setFormEdit({...formEdit, prazo: e.target.value})} className="w-full p-2 border rounded"/>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setModalEditar(false)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={salvarEdicao} disabled={salvando} className="px-4 py-2 bg-blue-600 text-white rounded">{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de convite para upgrade removido */}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
} 