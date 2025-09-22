import { useMonetizacao } from '../context/MonetizacaoContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FuncionalidadeEmProducao from './FuncionalidadeEmProducao';
import { useState, useEffect } from 'react';
import Modal from '../components/Modal';

export default function FiltrosAvancadosEmpresa() {
  const { user } = useAuth();
  const { planos } = useMonetizacao();
  const navigate = useNavigate();

  if (!user || user.tipo !== 'empresa') {
    return <FuncionalidadeEmProducao mensagem="Acesso restrito. Faça login como empresa." />;
  }

  const planoAtual = user.assinatura?.plano || 'gratuito';
  const planoObj = planos[planoAtual] || planos['gratuito'];

  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    localizacao: '',
    area: '',
    experiencia: '',
    idiomas: '',
    disponibilidade: ''
  });

  // Estado dos resultados (mock)
  const [resultados, setResultados] = useState([]);
  const [showResultadosMobile, setShowResultadosMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simulação de candidatos (mock)
  const candidatos = [
    { nome: 'João', localizacao: 'Maputo', area: 'TI', experiencia: 'Sênior', idiomas: 'Português', disponibilidade: 'Imediata' },
    { nome: 'Maria', localizacao: 'Beira', area: 'Design', experiencia: 'Júnior', idiomas: 'Inglês', disponibilidade: '30 dias' },
    { nome: 'Carlos', localizacao: 'Nampula', area: 'TI', experiencia: 'Pleno', idiomas: 'Português, Inglês', disponibilidade: '15 dias' },
    { nome: 'Ana', localizacao: 'Maputo', area: 'RH', experiencia: 'Sênior', idiomas: 'Português', disponibilidade: 'Imediata' },
    { nome: 'Pedro', localizacao: 'Beira', area: 'TI', experiencia: 'Júnior', idiomas: 'Inglês', disponibilidade: '30 dias' },
  ];

  // Atualiza resultados sempre que filtros mudam
  useEffect(() => {
    let filtrados = candidatos;
    if (filtros.nome) filtrados = filtrados.filter(c => c.nome.toLowerCase().includes(filtros.nome.toLowerCase()));
    if (filtros.localizacao) filtrados = filtrados.filter(c => c.localizacao.toLowerCase().includes(filtros.localizacao.toLowerCase()));
    if (filtros.area) filtrados = filtrados.filter(c => c.area.toLowerCase().includes(filtros.area.toLowerCase()));
    if (filtros.experiencia) filtrados = filtrados.filter(c => c.experiencia === filtros.experiencia);
    if (filtros.idiomas) filtrados = filtrados.filter(c => c.idiomas.toLowerCase().includes(filtros.idiomas.toLowerCase()));
    if (filtros.disponibilidade) filtrados = filtrados.filter(c => c.disponibilidade === filtros.disponibilidade);
    setResultados(filtrados);
  }, [filtros]);

  function limparFiltros() {
    setFiltros({ nome: '', localizacao: '', area: '', experiencia: '', idiomas: '', disponibilidade: '' });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-6xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Filtros de Busca de Candidatos</h2>
      <div className="mb-6">
        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">
          Seu plano atual: {planoObj.nome}
        </span>
      </div>
      {planoAtual === 'gratuito' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Gratuito</b> você pode filtrar candidatos apenas por nome e localização.</p>
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <label className="block mb-2 font-semibold text-gray-700">Nome do candidato</label>
            <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por nome" disabled />
            <label className="block mb-2 font-semibold text-gray-700">Localização</label>
            <input type="text" className="w-full border rounded p-2" placeholder="Buscar por localização" disabled />
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm">Fazer upgrade para filtros avançados</button>
          </div>
        </div>
      )}
      {planoAtual === 'basico' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Básico</b> você pode filtrar candidatos por nome, localização e área de atuação.</p>
          <div className="bg-blue-50 rounded-lg p-4 shadow">
            <label className="block mb-2 font-semibold text-gray-700">Nome do candidato</label>
            <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por nome" disabled />
            <label className="block mb-2 font-semibold text-gray-700">Localização</label>
            <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por localização" disabled />
            <label className="block mb-2 font-semibold text-gray-700">Área de atuação</label>
            <input type="text" className="w-full border rounded p-2" placeholder="Buscar por área" disabled />
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm">Fazer upgrade para filtros avançados</button>
          </div>
        </div>
      )}
      {(planoAtual === 'premium' || planoAtual === 'empresarial') && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>{planoObj.nome}</b> você tem acesso a filtros avançados de busca de candidatos!</p>
          <div className="bg-green-50 rounded-lg p-4 shadow mb-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Filtros à esquerda */}
              <div className="md:w-1/3 w-full">
                <label className="block mb-2 font-semibold text-gray-700">Nome do candidato</label>
                <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por nome" value={filtros.nome} onChange={e => setFiltros({ ...filtros, nome: e.target.value })} />
                <label className="block mb-2 font-semibold text-gray-700">Localização</label>
                <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por localização" value={filtros.localizacao} onChange={e => setFiltros({ ...filtros, localizacao: e.target.value })} />
                <label className="block mb-2 font-semibold text-gray-700">Área de atuação</label>
                <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por área" value={filtros.area} onChange={e => setFiltros({ ...filtros, area: e.target.value })} />
                <label className="block mb-2 font-semibold text-gray-700">Nível de experiência</label>
                <select className="w-full border rounded p-2 mb-4" value={filtros.experiencia} onChange={e => setFiltros({ ...filtros, experiencia: e.target.value })}>
                  <option value="">Todos</option>
                  <option>Júnior</option>
                  <option>Pleno</option>
                  <option>Sênior</option>
                  <option>Especialista</option>
                </select>
                <label className="block mb-2 font-semibold text-gray-700">Idiomas</label>
                <input type="text" className="w-full border rounded p-2 mb-4" placeholder="Buscar por idiomas" value={filtros.idiomas} onChange={e => setFiltros({ ...filtros, idiomas: e.target.value })} />
                <label className="block mb-2 font-semibold text-gray-700">Disponibilidade</label>
                <select className="w-full border rounded p-2" value={filtros.disponibilidade} onChange={e => setFiltros({ ...filtros, disponibilidade: e.target.value })}>
                  <option value="">Todos</option>
                  <option>Imediata</option>
                  <option>15 dias</option>
                  <option>30 dias</option>
                </select>
                <button onClick={limparFiltros} className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-sm w-full">Limpar filtros</button>
                {isMobile && (
                  <button onClick={() => setShowResultadosMobile(true)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition text-sm w-full">Buscar</button>
                )}
              </div>
              {/* Resultados à direita (desktop) */}
              {!isMobile && (
                <div className="md:w-2/3 w-full">
                  <div className="bg-white rounded-lg p-4 shadow h-full">
                    <h3 className="font-semibold text-blue-800 mb-2">Resultados ({resultados.length})</h3>
                    {resultados.length === 0 ? (
                      <p className="text-gray-500">Nenhum candidato encontrado com os filtros atuais.</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {resultados.map((c, idx) => (
                          <li key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-bold text-blue-700">{c.nome}</span>
                            <span className="text-gray-600 text-sm">{c.area} - {c.localizacao}</span>
                            <span className="text-xs text-gray-500">{c.experiencia}</span>
                            <span className="text-xs text-gray-500">{c.idiomas}</span>
                            <span className="text-xs text-gray-500">{c.disponibilidade}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Modal de resultados no mobile */}
            {isMobile && (
              <Modal isOpen={showResultadosMobile} onClose={() => setShowResultadosMobile(false)} title={`Resultados (${resultados.length})`} size="md">
                {resultados.length === 0 ? (
                  <p className="text-gray-500">Nenhum candidato encontrado com os filtros atuais.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {resultados.map((c, idx) => (
                      <li key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-bold text-blue-700">{c.nome}</span>
                        <span className="text-gray-600 text-sm">{c.area} - {c.localizacao}</span>
                        <span className="text-xs text-gray-500">{c.experiencia}</span>
                        <span className="text-xs text-gray-500">{c.idiomas}</span>
                        <span className="text-xs text-gray-500">{c.disponibilidade}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Modal>
            )}
          </div>
          {planoAtual === 'premium' && (
            <div className="mt-4 text-center">
              <button onClick={() => navigate('/monetizacao')} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-orange-700 transition text-sm">Fazer upgrade para Empresarial</button>
            </div>
          )}
          {planoAtual === 'empresarial' && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded font-semibold shadow">Você já está no melhor plano!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 