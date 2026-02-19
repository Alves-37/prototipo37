import { Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useRef, useEffect, useState } from 'react';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Home from './pages/Home';
import Vagas from './pages/Vagas';
import Chamados from './pages/Chamados';
import NovoChamado from './pages/NovoChamado';
import DetalheChamado from './pages/DetalheChamado';
import DetalheVaga from './pages/DetalheVaga';
import Login from './pages/Login';
import ContaDesativada from './pages/ContaDesativada';
import Cadastro from './pages/Cadastro';
import AuthCallback from './pages/AuthCallback';
import Perfil from './pages/Perfil';
import Candidaturas from './pages/Candidaturas';
import HomeEmpresa from './pages/HomeEmpresa';
import PainelEmpresa from './pages/PainelEmpresa';
import PerfilEmpresa from './pages/PerfilEmpresa';
import MeusProdutos from './pages/MeusProdutos';
import VagasPublicadas from './pages/VagasPublicadas';
import PublicarVaga from './pages/PublicarVaga';
import Mensagens from './pages/MensagensMelhorada';
import TesteMensagens from './pages/TesteMensagens';
import Monetizacao from './components/Monetizacao';
import Assinaturas from './components/Assinaturas';
import Apoio from './pages/Apoio';
import Termos from './pages/Termos';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import FAQ from './pages/FAQ';
import FuncionalidadeEmProducao from './pages/FuncionalidadeEmProducao';
import DetalheServico from './pages/DetalheServico';
import RelatoriosEmpresa from './pages/RelatoriosEmpresa';
import FiltrosAvancadosEmpresa from './pages/FiltrosAvancadosEmpresa';
import RelatoriosCandidato from './pages/RelatoriosCandidato';
import Denuncias from './pages/Denuncias';
import EmpresaConversas from './pages/EmpresaConversas';
import EmpresaConfiguracoes from './pages/EmpresaConfiguracoes';
import EmpresaEquipe from './pages/EmpresaEquipe';
import './App.css';

export default function AppRoutes() {
  const location = useLocation();
  const hideHeader = ["/login", "/cadastro"].includes(location.pathname);
  const [loading, setLoading] = useState(false);
  const hasShownHomeLoaderRef = useRef(false);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      try { window.scrollTo(0, 0); } catch {}
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/') {
      setLoading(false);
      return;
    }

    if (hasShownHomeLoaderRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 900);
    hasShownHomeLoaderRef.current = true;
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && <Header />}
      <main>
        {loading ? (
          <div className="route-loader flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4 w-full max-w-md px-6">
              <div className="spinner" />
              <div className="text-sm font-semibold text-gray-700">A preparar o feed…</div>

              <div className="w-full space-y-3">
                <div className="h-3 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-3 bg-gray-200 rounded-full animate-pulse w-5/6" />
                <div className="h-3 bg-gray-200 rounded-full animate-pulse w-4/6" />
              </div>
            </div>
          </div>
        ) : (
          <Routes location={location}>
            {/* Rotas Públicas (não precisam de autenticação) */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/conta-desativada" element={<ContaDesativada />} />
            <Route path="/cadastro" element={
              <PublicRoute>
                <Cadastro />
              </PublicRoute>
            } />
            {/* Callback do OAuth (público) */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/apoio" element={<Apoio />} />
            <Route path="/em-producao" element={<FuncionalidadeEmProducao />} />
            <Route path="/denuncias" element={<Denuncias />} />

            {/* Rotas Públicas - Vagas e Chamados (visualização) */}
            <Route path="/vagas" element={<Vagas />} />
            <Route path="/vaga/:id" element={<DetalheVaga />} />
            <Route path="/servico/:id" element={<DetalheServico />} />
            <Route path="/chamados" element={<Chamados />} />
            <Route path="/chamado/:id" element={<DetalheChamado />} />

            {/* Rotas Protegidas - Ambos os tipos para Candidaturas, Chamados e Mensagens */}
            <Route path="/candidaturas" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Candidaturas />
              </ProtectedRoute>
            } />
            <Route path="/mensagens" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Mensagens />
              </ProtectedRoute>
            } />
            {/* Rotas Protegidas - Apenas Usuários */}
            <Route path="/novo-chamado" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <NovoChamado />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute allowedTypes={['usuario']}>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/perfil/:id" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/relatorios-candidato" element={
              <ProtectedRoute allowedTypes={['usuario']}>
                <RelatoriosCandidato />
              </ProtectedRoute>
            } />

            {/* Rotas Protegidas - Apenas Empresas */}
            <Route path="/empresa-home" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <HomeEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/empresa" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <PainelEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/perfil-empresa" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <PerfilEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/perfil-empresa/:id" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <PerfilEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/meus-produtos" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <MeusProdutos />
              </ProtectedRoute>
            } />
            <Route path="/vagas-publicadas" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <VagasPublicadas />
              </ProtectedRoute>
            } />
            <Route path="/publicar-vaga" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <PublicarVaga />
              </ProtectedRoute>
            } />
            <Route path="/publicar-vaga/:id" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <PublicarVaga />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <RelatoriosEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/filtros-avancados" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <FiltrosAvancadosEmpresa />
              </ProtectedRoute>
            } />
            {/* Mensageria da Empresa (mock) */}
            <Route path="/empresa/conversas" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <EmpresaConversas />
              </ProtectedRoute>
            } />
            <Route path="/empresa/config/mensagens" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <EmpresaConfiguracoes />
              </ProtectedRoute>
            } />
            <Route path="/empresa/equipe" element={
              <ProtectedRoute allowedTypes={['empresa']}>
                <EmpresaEquipe />
              </ProtectedRoute>
            } />

            {/* Rotas Protegidas - Ambos os tipos */}
            <Route path="/monetizacao" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Monetizacao />
              </ProtectedRoute>
            } />
            <Route path="/assinaturas" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Assinaturas />
              </ProtectedRoute>
            } />
          </Routes>
        )}
      </main>
    </div>
  );
} 