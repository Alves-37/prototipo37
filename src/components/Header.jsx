import { Link, useNavigate, useLocation, matchPath } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

// Funções utilitárias para localStorage
const NOTIFICACOES_KEY = 'nevu_notificacoes';
function getNotificacoesLS() {
  const data = localStorage.getItem(NOTIFICACOES_KEY);
  if (data) return JSON.parse(data);
  // Mock inicial
  const mock = [
    { id: 1, texto: 'Sua candidatura foi aprovada!', lida: false },
    { id: 2, texto: 'Nova vaga: Desenvolvedor React', lida: true },
    { id: 3, texto: 'Mensagem recebida de TechCorp', lida: false },
  ];
  localStorage.setItem(NOTIFICACOES_KEY, JSON.stringify(mock));
  return mock;
}
function saveNotificacoesLS(nots) {
  localStorage.setItem(NOTIFICACOES_KEY, JSON.stringify(nots));
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const drawerTimeout = useRef(null);
  const [showMais, setShowMais] = useState(false);
  const maisRef = useRef(); // Ref para o dropdown 'Mais'

  // Notificações com localStorage
  const [notificacoes, setNotificacoes] = useState(getNotificacoesLS());
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  // Certifique-se de que notificacoesNaoLidas é sempre derivado do estado atual:
  const notificacoesNaoLidas = (notificacoes || []).filter(n => !n.lida).length;
  const notificacoesRef = useRef();

  // Atualizar localStorage sempre que notificacoes mudar
  useEffect(() => {
    saveNotificacoesLS(notificacoes);
  }, [notificacoes]);

  function marcarTodasComoLidas() {
    setNotificacoes(nots => nots.map(n => ({ ...n, lida: true })));
  }
  function marcarComoLida(id) {
    setNotificacoes(nots => nots.map(n => n.id === id ? { ...n, lida: true } : n));
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificacoesRef.current && !notificacoesRef.current.contains(event.target)) {
        setShowNotificacoes(false);
      }
    }
    if (showNotificacoes) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificacoes]);

  // Fechar dropdown 'Mais' ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (maisRef.current && !maisRef.current.contains(event.target)) {
        setShowMais(false);
      }
    }
    if (showMais) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMais]);

  const openDrawer = () => {
    setDrawerOpen(true);
    setDrawerClosing(false);
  };
  const closeDrawer = () => {
    setDrawerClosing(true);
    drawerTimeout.current = setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 320);
  };

  const isEmpresa = user && user.tipo === 'empresa';
  // Função utilitária para saber se a rota está ativa (inclui subrotas)
  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    if (to === '/chamados') {
      // Ativo em /chamados e em qualquer /chamado/:id
      return !!matchPath({ path: '/chamados', end: true }, location.pathname) ||
             !!matchPath({ path: '/chamado/:id', end: true }, location.pathname);
    }
    return !!matchPath({ path: to + '/*', end: false }, location.pathname);
  };
  return (
    <>
      <header className="bg-white shadow-md border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between sticky top-0 z-50 w-full">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/nevu.png" alt="Nevú" className="h-8 sm:h-10 w-auto" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-blue-700">Nevú</span>
          </Link>
        </div>
        {/* Botão menu mobile à direita */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Sino de notificações (mobile) */}
          <div className="relative" ref={notificacoesRef}>
            <button
              onClick={() => setShowNotificacoes(v => !v)}
              className="relative p-2 rounded hover:bg-gray-100 focus:outline-none"
              aria-label="Notificações"
            >
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1.5 font-bold shadow">{notificacoesNaoLidas}</span>
              )}
            </button>
            {showNotificacoes && (
              <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-start justify-center pt-16" onClick={() => setShowNotificacoes(false)}>
                <div className="w-11/12 max-w-sm bg-white shadow-lg rounded-lg p-4 border border-gray-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-blue-700">Notificações</h4>
                    {notificacoesNaoLidas > 0 && (
                      <button
                        onClick={marcarTodasComoLidas}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                    <button onClick={() => setShowNotificacoes(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
                  </div>
                  {notificacoes.length === 0 ? (
                    <div className="text-gray-500 text-sm">Nenhuma notificação</div>
                  ) : (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                      {notificacoes.map(n => (
                        <li
                          key={n.id}
                          className={`text-sm flex items-center gap-2 cursor-pointer transition-colors ${n.lida ? 'text-gray-500' : 'text-blue-700 font-semibold hover:bg-blue-50'}`}
                          onClick={() => marcarComoLida(n.id)}
                        >
                          <span className="text-lg">🔔</span> {n.texto}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Botão menu mobile */}
          <button
            className="p-2 rounded hover:bg-gray-100 focus:outline-none"
            onClick={openDrawer}
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Menu desktop */}
        <nav className="hidden md:flex items-center space-x-4">
          {!isEmpresa ? (
            // Menu desktop para candidatos
            user ? (
              <>
                <Link to="/" className={`font-medium text-sm sm:text-base ${isActive('/') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Início</Link>
                <Link to="/vagas" className={`font-medium text-sm sm:text-base ${isActive('/vagas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Vagas</Link>
                <Link to="/candidaturas" className={`font-medium text-sm sm:text-base ${isActive('/candidaturas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Candidaturas</Link>
                <Link
                  to={user?.tipo === 'empresa' ? '/relatorios' : '/relatorios-candidato'}
                  className={`font-medium text-sm sm:text-base ${isActive(user?.tipo === 'empresa' ? '/relatorios' : '/relatorios-candidato') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}
                >
                  Relatórios
                </Link>
                <Link to="/mensagens" className={`font-medium text-sm sm:text-base ${isActive('/mensagens') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Mensagens</Link>
                <Link to="/chamados" className={`font-medium text-sm sm:text-base ${isActive('/chamados') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Chamados</Link>
                <Link to="/perfil" className={`font-medium text-sm sm:text-base ${isActive('/perfil') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Perfil</Link>
                <Link to="/monetizacao" className={`font-medium text-sm sm:text-base ${isActive('/monetizacao') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Planos</Link>
                <Link to="/assinaturas" className={`font-medium text-sm sm:text-base ${isActive('/assinaturas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Assinatura</Link>
                <Link to="/apoio" className={`font-medium text-sm sm:text-base ${isActive('/apoio') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Apoio</Link>
                <Link to="/denuncias" className="font-medium text-sm sm:text-base text-red-600 hover:text-red-800 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                  Denunciar
                </Link>
                {/* Sino de notificações para usuários logados */}
                <div className="relative" ref={notificacoesRef}>
                  <button
                    onClick={() => setShowNotificacoes(v => !v)}
                    className="relative p-2 rounded hover:bg-gray-100 focus:outline-none"
                    aria-label="Notificações"
                  >
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notificacoesNaoLidas > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1.5 font-bold shadow">{notificacoesNaoLidas}</span>
                    )}
                  </button>
                  {showNotificacoes && (
                    <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-100 animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-blue-700">Notificações</h4>
                        {notificacoesNaoLidas > 0 && (
                          <button
                            onClick={marcarTodasComoLidas}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                        <button onClick={() => setShowNotificacoes(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
                      </div>
                      {notificacoes.length === 0 ? (
                        <div className="text-gray-500 text-sm">Nenhuma notificação</div>
                      ) : (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {notificacoes.map(n => (
                            <li key={n.id} className={`text-sm flex items-center gap-2 ${n.lida ? 'text-gray-500' : 'text-blue-700 font-semibold'}`}>
                              <span className="text-lg">🔔</span> {n.texto}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { logout(); navigate('/'); window.location.reload(); }}
                  className="ml-2 px-3 py-1.5 rounded bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/" className={`font-medium text-sm sm:text-base ${isActive('/') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Início</Link>
                <Link to="/apoio" className={`font-medium text-sm sm:text-base ${isActive('/apoio') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Apoio</Link>
                <Link to="/login" className="px-3 sm:px-4 py-1 sm:py-1.5 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-sm sm:text-base">Login</Link>
              </>
            )
          ) : (
            // Menu desktop para empresas
            <>
              <Link to="/empresa-home" className={`font-medium text-sm sm:text-base ${isActive('/empresa-home') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Dashboard</Link>
              <Link to="/publicar-vaga" className={`font-medium text-sm sm:text-base ${isActive('/publicar-vaga') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Publicar Vaga</Link>
              <Link to="/vagas-publicadas" className={`font-medium text-sm sm:text-base ${isActive('/vagas-publicadas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Minhas Vagas</Link>
              <Link to="/mensagens" className={`font-medium text-sm sm:text-base ${isActive('/mensagens') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Mensagens</Link>
              <Link to="/chamados" className={`font-medium text-sm sm:text-base ${isActive('/chamados') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Chamados</Link>
              {/* Sino de notificações aqui */}
              <Link to="/perfil-empresa" className={`font-medium text-sm sm:text-base ${isActive('/perfil-empresa') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Perfil</Link>
              <Link to="/monetizacao" className={`font-medium text-sm sm:text-base ${isActive('/monetizacao') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Planos</Link>
              <Link to="/apoio" className={`font-medium text-sm sm:text-base ${isActive('/apoio') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Apoio</Link>
              
              {/* Dropdown 'Mais' */}
              <div className="relative" ref={maisRef}>
                <button onClick={() => setShowMais(v => !v)} className="relative px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-1">
                  <span>Mais</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showMais && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg p-2 z-50 border border-gray-100 animate-fade-in">
                    <Link to="/candidaturas" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded" onClick={() => setShowMais(false)}>Candidaturas</Link>
                    <Link to="/chamados" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded" onClick={() => setShowMais(false)}>Chamados</Link>
                    <Link to="/relatorios" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded" onClick={() => setShowMais(false)}>Relatórios</Link>
                    <Link to="/assinaturas" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded" onClick={() => setShowMais(false)}>Assinatura</Link>
                    <Link to="/denuncias" className="block px-4 py-2 text-red-600 hover:bg-red-50 rounded" onClick={() => setShowMais(false)}>Denunciar</Link>
                  </div>
                )}
              </div>

              {/* Sino de notificações para empresas */}
              <div className="relative" ref={notificacoesRef}>
                <button
                  onClick={() => setShowNotificacoes(v => !v)}
                  className="relative p-2 rounded hover:bg-gray-100 focus:outline-none"
                  aria-label="Notificações"
                >
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1.5 font-bold shadow">{notificacoesNaoLidas}</span>
                  )}
                </button>
                {showNotificacoes && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-100 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-blue-700">Notificações</h4>
                      {notificacoesNaoLidas > 0 && (
                        <button
                          onClick={marcarTodasComoLidas}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                      <button onClick={() => setShowNotificacoes(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
                    </div>
                    {notificacoes.length === 0 ? (
                      <div className="text-gray-500 text-sm">Nenhuma notificação</div>
                    ) : (
                      <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {notificacoes.map(n => (
                          <li key={n.id} className={`text-sm flex items-center gap-2 ${n.lida ? 'text-gray-500' : 'text-blue-700 font-semibold'}`}>
                            <span className="text-lg">🔔</span> {n.texto}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="ml-2 px-3 py-1.5 rounded bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Drawer lateral mobile */}
      {(drawerOpen || drawerClosing) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div className={`fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ${drawerClosing ? 'opacity-0' : 'opacity-100'}`} onClick={closeDrawer}></div>
          {/* Drawer à direita com efeito personalizado */}
          <nav className={`relative bg-white w-72 max-w-full h-full shadow-2xl rounded-l-3xl p-0 flex flex-col animate-drawer-fade-slide-${drawerClosing ? 'out' : 'in'} transition-all duration-400`}
            style={{padding: 0}}>
            <div className="flex flex-col h-full">
          <button 
                className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow-md transition"
                onClick={closeDrawer}
                aria-label="Fechar menu"
                style={{boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
              {/* Navegação */}
              <div className="flex-1 flex flex-col gap-3 mt-20 px-7 pb-8 overflow-y-auto">
          {user ? (
            <>
                    {/* Menu para empresa */}
                    {user.tipo === 'empresa' ? (
                      <>
                        <Link to="/empresa-home" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Dashboard</Link>
                        <Link to="/publicar-vaga" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Publicar Vaga</Link>
                        <Link to="/vagas-publicadas" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Minhas Vagas</Link>
                        <Link to="/candidaturas" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Candidaturas</Link>
                        <Link to="/relatorios" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Relatórios</Link>
                        <Link to="/mensagens" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Mensagens</Link>
                        <Link to="/chamados" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Chamados</Link>
                        <Link to="/perfil-empresa" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Perfil</Link>
                        <Link to="/monetizacao" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Planos</Link>
                        <Link to="/assinaturas" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Assinatura</Link>
                        <Link to="/apoio" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Apoio</Link>
                        <Link to="/denuncias" className="py-2 px-3 rounded text-base font-medium flex items-center gap-1 text-red-600 hover:text-red-800" onClick={() => setDrawerOpen(false)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                          Denunciar
                        </Link>
                      </>
                    ) : (
                      <>
                        {/* Menu para candidato */}
                        <Link to="/" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Início</Link>
                        <Link to="/vagas" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Vagas</Link>
                        <Link to="/candidaturas" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Candidaturas</Link>
                        <Link to="/relatorios-candidato" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Relatórios</Link>
                        <Link to="/mensagens" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Mensagens</Link>
                        <Link to="/chamados" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Chamados</Link>
                        <Link to="/perfil" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Perfil</Link>
                        <Link to="/monetizacao" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Planos</Link>
                        <Link to="/assinaturas" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Assinatura</Link>
                        <Link to="/apoio" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Apoio</Link>
                        <Link to="/denuncias" className="py-2 px-3 rounded text-base font-medium flex items-center gap-1 text-red-600 hover:text-red-800" onClick={() => setDrawerOpen(false)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                          Denunciar
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Início</Link>
                    <Link to="/apoio" className="py-2 px-3 rounded text-base font-medium hover:bg-blue-50 text-gray-700" onClick={() => setDrawerOpen(false)}>Apoio</Link>
                    <Link to="/login" className="py-2 px-3 rounded text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition" onClick={() => setDrawerOpen(false)}>Login</Link>
                    <Link to="/cadastro" className="py-2 px-3 rounded text-base font-medium bg-green-600 text-white hover:bg-green-700 transition" onClick={() => setDrawerOpen(false)}>Cadastrar</Link>
                  </>
                )}
                {user && (
                  <button
                    onClick={() => { logout(); navigate('/'); closeDrawer(); window.location.reload(); }}
                    className="mt-6 py-2 px-3 rounded-lg bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-base flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    Sair
                  </button>
                )}
              </div>
            </div>
        </nav>
      </div>
      )}

      {/* Remover menu fixo inferior mobile */}
      {/* (menu mobile removido) */}
      {/* Drawer animação fade + slide personalizada com bounce forte */}
      <style>{`
        @keyframes drawer-fade-slide-in {
          0% { opacity: 0; transform: translateX(100%) scale(0.96); }
          80% { opacity: 1; transform: translateX(-8%) scale(1.04); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes drawer-fade-slide-out {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(100%) scale(0.96); }
        }
        .animate-drawer-fade-slide-in {
          animation: drawer-fade-slide-in 0.65s cubic-bezier(0.68,-0.55,0.27,1.25);
        }
        .animate-drawer-fade-slide-out {
          animation: drawer-fade-slide-out 0.38s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease;
        }
      `}</style>
    </>
  )
}
 