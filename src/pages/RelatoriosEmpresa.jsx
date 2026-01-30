import { useMonetizacao } from '../context/MonetizacaoContext';
import { useAuth } from '../context/AuthContext';
import FuncionalidadeEmProducao from './FuncionalidadeEmProducao';
import { useNavigate } from 'react-router-dom';

export default function RelatoriosEmpresa() {
  const { user } = useAuth();
  const { planos } = useMonetizacao();
  const navigate = useNavigate();

  if (!user || user.tipo !== 'empresa') {
    return <FuncionalidadeEmProducao mensagem="Acesso restrito. Faça login como empresa." />;
  }

  const planoAtual = user.assinatura?.plano || 'gratuito';
  const planoObj = planos[planoAtual] || planos['gratuito'];

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-6xl w-full mx-auto mt-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Relatórios da Empresa</h2>
      <div className="mb-6">
        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">
          Seu plano atual: {planoObj.nome}
        </span>
      </div>
      {planoAtual === 'gratuito' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Gratuito</b> você tem acesso apenas a um resumo simples das suas vagas.</p>
          <div className="bg-gray-50 rounded-lg p-4 shadow text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Resumo de Vagas</h3>
            <p className="text-gray-600">Total de vagas publicadas: <b>3</b></p>
            <p className="text-gray-600">Vagas ativas: <b>1</b></p>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm">Fazer upgrade para ver mais</button>
          </div>
        </div>
      )}
      {planoAtual === 'basico' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Básico</b> você pode ver relatórios de vagas e candidaturas.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-blue-800 mb-2">Resumo de Vagas</h3>
              <ul className="text-sm text-blue-900 list-disc ml-5">
                <li>Total de vagas publicadas: <b>10</b></li>
                <li>Vagas ativas: <b>4</b></li>
                <li>Vagas expiradas: <b>2</b></li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-green-800 mb-2">Candidaturas</h3>
              <ul className="text-sm text-green-900 list-disc ml-5">
                <li>Total de candidaturas: <b>30</b></li>
                <li>Candidatos aprovados: <b>3</b></li>
                <li>Entrevistas agendadas: <b>2</b></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition text-sm">Fazer upgrade para relatórios avançados</button>
          </div>
        </div>
      )}
      {planoAtual === 'premium' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Premium</b> você tem acesso a relatórios avançados de desempenho.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-blue-800 mb-2">Resumo de Vagas</h3>
              <ul className="text-sm text-blue-900 list-disc ml-5">
                <li>Total de vagas publicadas: <b>25</b></li>
                <li>Vagas ativas: <b>7</b></li>
                <li>Vagas expiradas: <b>3</b></li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-green-800 mb-2">Candidaturas</h3>
              <ul className="text-sm text-green-900 list-disc ml-5">
                <li>Total de candidaturas: <b>80</b></li>
                <li>Candidatos aprovados: <b>10</b></li>
                <li>Entrevistas agendadas: <b>5</b></li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 shadow md:col-span-2">
              <h3 className="font-semibold text-purple-800 mb-2">Desempenho</h3>
              <ul className="text-sm text-purple-900 list-disc ml-5">
                <li>Tempo médio para contratação: <b>14 dias</b></li>
                <li>Taxa de resposta a candidatos: <b>89%</b></li>
                <li>Feedbacks positivos: <b>80%</b></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => navigate('/monetizacao')} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-orange-700 transition text-sm">Fazer upgrade para Empresarial</button>
          </div>
        </div>
      )}
      {planoAtual === 'empresarial' && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">No plano <b>Empresarial</b> você tem acesso a relatórios empresariais completos, integração com API, gerente de conta e mais!</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-blue-800 mb-2">Resumo de Vagas</h3>
              <ul className="text-sm text-blue-900 list-disc ml-5">
                <li>Total de vagas publicadas: <b>100</b></li>
                <li>Vagas ativas: <b>30</b></li>
                <li>Vagas expiradas: <b>5</b></li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-green-800 mb-2">Candidaturas</h3>
              <ul className="text-sm text-green-900 list-disc ml-5">
                <li>Total de candidaturas: <b>500</b></li>
                <li>Candidatos aprovados: <b>60</b></li>
                <li>Entrevistas agendadas: <b>20</b></li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 shadow md:col-span-2">
              <h3 className="font-semibold text-purple-800 mb-2">Desempenho Empresarial</h3>
              <ul className="text-sm text-purple-900 list-disc ml-5">
                <li>Tempo médio para contratação: <b>10 dias</b></li>
                <li>Taxa de resposta a candidatos: <b>97%</b></li>
                <li>Feedbacks positivos: <b>95%</b></li>
                <li>API de relatórios empresariais: <span className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs ml-2">Exclusivo</span></li>
                <li>Gerente de conta dedicado: <span className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs ml-2">Exclusivo</span></li>
                <li>Treinamento da equipe: <span className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs ml-2">Exclusivo</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded font-semibold shadow">Você já está no melhor plano!</span>
          </div>
        </div>
      )}
    </div>
  );
} 