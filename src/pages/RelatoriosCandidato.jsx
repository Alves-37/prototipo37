import { useMonetizacao } from '../context/MonetizacaoContext';
import { useAuth } from '../context/AuthContext';
import FuncionalidadeEmProducao from './FuncionalidadeEmProducao';
import { useNavigate } from 'react-router-dom';

export default function RelatoriosCandidato() {
  const { user } = useAuth();
  const { planosCandidato } = useMonetizacao();
  const navigate = useNavigate();

  if (!user || user.tipo !== 'usuario') {
    return <FuncionalidadeEmProducao mensagem="Acesso restrito. Faça login como candidato." />;
  }

  const planoAtual = user.assinatura?.plano || 'gratuito';
  const planoObj = planosCandidato[planoAtual] || planosCandidato['gratuito'];

  // Mock de dados de candidatura
  const candidaturas = [
    { vaga: 'Desenvolvedor Frontend', empresa: 'TechMoç', status: 'Aprovada', data: '2024-05-01', feedback: 'Ótima experiência!' },
    { vaga: 'Designer UI/UX', empresa: 'DesignPro', status: 'Rejeitada', data: '2024-04-20', feedback: '' },
    { vaga: 'Analista de Dados', empresa: 'DataMoz', status: 'Entrevista', data: '2024-04-10', feedback: 'Aguardando resposta' },
    { vaga: 'Gestor de Projetos', empresa: 'Projeta', status: 'Pendente', data: '2024-03-28', feedback: '' },
  ];

  // Estatísticas mock
  const stats = {
    total: candidaturas.length,
    aprovadas: candidaturas.filter(c => c.status === 'Aprovada').length,
    rejeitadas: candidaturas.filter(c => c.status === 'Rejeitada').length,
    entrevistas: candidaturas.filter(c => c.status === 'Entrevista').length,
    pendentes: candidaturas.filter(c => c.status === 'Pendente').length,
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl md:max-w-4xl lg:max-w-5xl w-full mx-auto mt-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Relatórios de Candidatura</h2>
      <div className="mb-6">
        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">
          Seu plano atual: {planoObj.nome}
        </span>
      </div>
      {planoAtual === 'gratuito' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Gratuito</b> você tem acesso apenas a um resumo simples das suas candidaturas.</p>
          <div className="bg-gray-50 rounded-lg p-4 shadow text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Resumo</h3>
            <p className="text-gray-600">Total de candidaturas: <b>{stats.total}</b></p>
            <p className="text-gray-600">Aprovadas: <b>{stats.aprovadas}</b></p>
            <p className="text-gray-600">Rejeitadas: <b>{stats.rejeitadas}</b></p>
            <p className="text-gray-600">Entrevistas: <b>{stats.entrevistas}</b></p>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm">Fazer upgrade para ver mais</button>
          </div>
        </div>
      )}
      {planoAtual === 'basico' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Básico</b> você pode ver o histórico detalhado das suas candidaturas.</p>
          <div className="bg-blue-50 rounded-lg p-4 shadow">
            <h3 className="font-semibold text-blue-800 mb-2">Histórico de Candidaturas</h3>
            <ul className="text-sm text-blue-900 divide-y divide-blue-100">
              {candidaturas.map((c, idx) => (
                <li key={idx} className="py-2 flex flex-col md:flex-row md:items-center gap-2">
                  <span className="font-bold">{c.vaga}</span>
                  <span className="text-gray-600">{c.empresa}</span>
                  <span className="text-xs text-gray-500">{c.status}</span>
                  <span className="text-xs text-gray-400">{c.data}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm">Fazer upgrade para relatórios avançados</button>
          </div>
        </div>
      )}
      {planoAtual === 'premium' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Premium</b> você tem acesso a relatórios avançados, análises e destaque do seu CV.</p>
          <div className="bg-purple-50 rounded-lg p-4 shadow mb-4">
            <h3 className="font-semibold text-purple-800 mb-2">Histórico de Candidaturas</h3>
            <ul className="text-sm text-purple-900 divide-y divide-purple-100">
              {candidaturas.map((c, idx) => (
                <li key={idx} className="py-2 flex flex-col md:flex-row md:items-center gap-2">
                  <span className="font-bold">{c.vaga}</span>
                  <span className="text-gray-600">{c.empresa}</span>
                  <span className="text-xs text-gray-500">{c.status}</span>
                  <span className="text-xs text-gray-400">{c.data}</span>
                  {c.feedback && <span className="text-xs text-green-700">Feedback: {c.feedback}</span>}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold text-purple-700 mb-2">Análise de Performance</h4>
              <ul className="text-sm text-purple-900 list-disc ml-5">
                <li>Tempo médio para resposta: <b>5 dias</b></li>
                <li>Taxa de aprovação: <b>{Math.round((stats.aprovadas / stats.total) * 100)}%</b></li>
                <li>Feedbacks positivos: <b>80%</b></li>
              </ul>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold text-purple-700 mb-2">CV em Destaque</h4>
              <p className="text-purple-800">Seu currículo está em destaque para empresas! <span className="ml-2">⭐</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 