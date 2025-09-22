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
import Cadastro from './pages/Cadastro';
import Perfil from './pages/Perfil';
import Candidaturas from './pages/Candidaturas';
import HomeEmpresa from './pages/HomeEmpresa';
import PainelEmpresa from './pages/PainelEmpresa';
import PerfilEmpresa from './pages/PerfilEmpresa';
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
import RelatoriosEmpresa from './pages/RelatoriosEmpresa';
import FiltrosAvancadosEmpresa from './pages/FiltrosAvancadosEmpresa';
import RelatoriosCandidato from './pages/RelatoriosCandidato';
import Denuncias from './pages/Denuncias';
import './App.css';

export default function AppRoutes() {
  const location = useLocation();
  const hideHeader = ["/login", "/cadastro"].includes(location.pathname);
  const [loading, setLoading] = useState(false);
  const [visitedPages, setVisitedPages] = useState(() => new Set());

  useEffect(() => {
    setLoading(true);
    let timeout = 900;
    setVisitedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(location.pathname)) {
        timeout = 200;
      } else {
        timeout = 900;
        newSet.add(location.pathname);
      }
      const timer = setTimeout(() => setLoading(false), timeout);
      return newSet;
    });
    // O timer precisa ser limpo fora do setVisitedPages
    const timer = setTimeout(() => setLoading(false), timeout);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && <Header />}
      <main className={!hideHeader ? "pt-16" : ""}>
        {loading ? (
          <div className="route-loader flex items-center justify-center min-h-[60vh]">
            <div className="brand-spinner">
              <div className="spinner"></div>
              <div className="logo">
                <img src="/nevu.png" alt="Nevú" />
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
            <Route path="/cadastro" element={
              <PublicRoute>
                <Cadastro />
              </PublicRoute>
            } />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/apoio" element={<Apoio />} />
            <Route path="/em-producao" element={<FuncionalidadeEmProducao />} />
            <Route path="/denuncias" element={<Denuncias />} />

            {/* Rotas Protegidas - Ambos os tipos para Candidaturas, Chamados e Mensagens */}
            <Route path="/candidaturas" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Candidaturas />
              </ProtectedRoute>
            } />
            <Route path="/chamados" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Chamados />
              </ProtectedRoute>
            } />
            <Route path="/mensagens" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <Mensagens />
              </ProtectedRoute>
            } />
            {/* Rotas Protegidas - Apenas Usuários */}
            <Route path="/vagas" element={
              <ProtectedRoute allowedTypes={['usuario']}>
                <Vagas />
              </ProtectedRoute>
            } />
            <Route path="/novo-chamado" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <NovoChamado />
              </ProtectedRoute>
            } />
            <Route path="/chamado/:id" element={
              <ProtectedRoute allowedTypes={['usuario', 'empresa']}>
                <DetalheChamado />
              </ProtectedRoute>
            } />
            <Route path="/vaga/:id" element={
              <ProtectedRoute allowedTypes={['usuario']}>
                <DetalheVaga />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute allowedTypes={['usuario']}>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/perfil/:id" element={
              <ProtectedRoute allowedTypes={['usuario']}>
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
              <ProtectedRoute allowedTypes={['empresa']}>
                <PerfilEmpresa />
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