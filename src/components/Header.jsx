import { Link, useNavigate, useLocation, matchPath } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import notificationService from '../services/notificationService'
import { io as ioClient } from 'socket.io-client'
import api from '../services/api'

// Notificações agora sincronizadas com a API; utilitários de localStorage removidos

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const drawerTimeout = useRef(null);
  const drawerRef = useRef(null);
  const drawerCloseBtnRef = useRef(null);
  const [showMais, setShowMais] = useState(false);
  const maisRef = useRef(); // Ref para o dropdown 'Mais'

  // Notificações via API
  const [notificacoes, setNotificacoes] = useState([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [notifClosing, setNotifClosing] = useState(false);
  const notifTimer = useRef(null);
  // Contador independente para badge (vem do backend: data.naoLidas)
  const [badgeCount, setBadgeCount] = useState(0);
  const notificacoesRef = useRef();

  // Carregar notificações ao iniciar (quando logado)
  useEffect(() => {
    if (!user) { setNotificacoes([]); setBadgeCount(0); return; }
    let isCancelled = false;
    (async () => {
      try {
        const data = await notificationService.listar({ page: 1, limit: 20, somenteNaoLidas: false });
        if (isCancelled) return;
        setNotificacoes(data.notificacoes || []);
        const computed = Array.isArray(data.notificacoes) ? data.notificacoes.filter(n => !n.lida).length : undefined;
        const nextCount = (typeof data.naoLidas === 'number' && data.naoLidas >= 0)
          ? data.naoLidas
          : (typeof computed === 'number' ? computed : badgeCount);
        setBadgeCount(nextCount);
        console.debug('[Notificações] carregadas:', {
          total: data.total,
          naoLidas: data.naoLidas,
        });
      } catch (e) {
        console.error('Erro ao carregar notificações:', e);
      }
    })();
    return () => { isCancelled = true; };
  }, [user]);

  // Socket.IO: receber notificações em tempo real
  useEffect(() => {
    if (!user) return;

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

    socket.on('notification:new', (n) => {
      if (!n) return
      setNotificacoes(prev => {
        const exists = prev.some(x => String(x?.id) === String(n?.id))
        if (exists) return prev
        return [n, ...prev]
      })
      setBadgeCount(c => c + 1)
    })

    return () => {
      try { socket.disconnect() } catch {}
    }
  }, [user])

  // Recarregar notificações quando abrir o dropdown
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;
    if (showNotificacoes) {
      (async () => {
        try {
          const data = await notificationService.listar({ page: 1, limit: 20, somenteNaoLidas: false });
          if (isCancelled) return;
          setNotificacoes(data.notificacoes || []);
          const computed = Array.isArray(data.notificacoes) ? data.notificacoes.filter(n => !n.lida).length : undefined;
          const nextCount = (typeof data.naoLidas === 'number' && data.naoLidas >= 0)
            ? data.naoLidas
            : (typeof computed === 'number' ? computed : badgeCount);
          setBadgeCount(nextCount);
          console.debug('[Notificações] recarregadas (dropdown):', {
            total: data.total,
            naoLidas: data.naoLidas,
          });
        } catch (e) {
          console.error('Erro ao recarregar notificações:', e);
        }
      })();
    }
    return () => { isCancelled = true; };
  }, [showNotificacoes, user]);

  // Toggle do dropdown de notificações com animação de fechar
  const handleToggleNotificacoes = () => {
    if (!showNotificacoes) {
      setShowNotificacoes(true);
      setNotifClosing(false);
      return;
    }
    // já aberto -> iniciar fechamento com transição
    setNotifClosing(true);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => {
      setShowNotificacoes(false);
      setNotifClosing(false);
    }, 200);
  };

  useEffect(() => () => { if (notifTimer.current) clearTimeout(notifTimer.current); }, []);

  // Polling do badge para atualizar contagem em tempo real
  useEffect(() => {
    if (!user) return;

    let timer = null;
    let isCancelled = false;
    const fetchBadge = async () => {
      try {
        const data = await notificationService.listar({ page: 1, limit: 1, somenteNaoLidas: true });
        if (isCancelled) return;
        if (typeof data.naoLidas === 'number' && data.naoLidas >= 0) {
          setBadgeCount(data.naoLidas);
        } else if (Array.isArray(data.notificacoes)) {
          // Quando pedimos somenteNaoLidas=true, o backend pode devolver apenas as não lidas
          setBadgeCount(data.notificacoes.length);
        }
        // console.debug('[Notificações] polling badge naoLidas:', data.naoLidas);
      } catch (e) {
        // Silenciar para não poluir o console
      }
    };
    // primeira chamada imediata
    fetchBadge();
    // intervalos (10s para reduzir carga em dev)
    timer = setInterval(fetchBadge, 10000);
    // Atualiza imediatamente quando a aba ganhar foco
    const onFocus = () => fetchBadge();
    window.addEventListener('focus', onFocus);
    return () => { isCancelled = true; timer && clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [user]);

  async function marcarTodasComoLidas() {
    try {
      await notificationService.marcarTodasComoLidas();
      setNotificacoes(nots => nots.map(n => ({ ...n, lida: true })));
      setBadgeCount(0);
    } catch (e) {
      console.error('Erro ao marcar todas como lidas:', e);
    }
  }
  async function marcarComoLida(id) {
    try {
      await notificationService.marcarComoLida(id);
      setNotificacoes(nots => nots.map(n => n.id === id ? { ...n, lida: true } : n));
      setBadgeCount(c => Math.max(0, c - 1));
    } catch (e) {
      console.error('Erro ao marcar como lida:', e);
    }
  }

  const goToNotificationTarget = (n) => {
    const refType = n?.referenciaTipo
    const refId = n?.referenciaId

    if (refType === 'vaga' && refId) return navigate(`/vaga/${encodeURIComponent(refId)}`)
    if (refType === 'chamado' && refId) return navigate(`/chamado/${encodeURIComponent(refId)}`)
    if (refType === 'candidatura') return navigate('/candidaturas')

    if (refId) {
      return navigate(`/?post=${encodeURIComponent(refId)}`)
    }

    return navigate('/')
  }

  const handleNotificationClick = async (n, e) => {
    try {
      if (e?.stopPropagation) e.stopPropagation()
      if (!n) return

      if (!n.lida && n.id) {
        await marcarComoLida(n.id)
      }

      setShowNotificacoes(false)
      setNotifClosing(false)
      goToNotificationTarget(n)
    } catch (err) {
      console.error('Erro ao abrir notificação:', err)
    }
  }

  // Formatar data/hora para exibição nas notificações
  const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '';
    }
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

  useEffect(() => {
    if (!(drawerOpen || drawerClosing)) return;

    const prevOverflow = document?.body?.style?.overflow;
    try {
      document.body.style.overflow = 'hidden';
    } catch {}

    const onKeyDown = (e) => {
      try {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeDrawer();
          return;
        }

        if (e.key !== 'Tab') return;
        const root = drawerRef.current;
        if (!root) return;

        const focusables = Array.from(
          root.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.visibility !== 'hidden' && style.display !== 'none';
        });

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      } catch {}
    };

    document.addEventListener('keydown', onKeyDown);

    const focusTimer = setTimeout(() => {
      try {
        drawerCloseBtnRef.current?.focus?.();
      } catch {}
    }, 0);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      try {
        document.body.style.overflow = prevOverflow || '';
      } catch {}
    };
  }, [drawerOpen, drawerClosing]);

  useEffect(() => {
    if (!drawerOpen) return;
    closeDrawer();
  }, [location.pathname]);

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

  const mobileLinkClass = (to, extra = '') => {
    const active = isActive(to);
    return `py-3 px-3 rounded-xl text-base font-medium transition-colors ${active ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'text-gray-700 hover:bg-gray-50'} ${extra}`;
  };

  const userDisplayName = (() => {
    if (!user) return '';
    return user?.nome || user?.razaoSocial || user?.perfil?.razaoSocial || 'Usuário';
  })();

  return (
    <>
      <header className="bg-white shadow-md border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between sticky top-0 z-50 w-full">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/nevu.png" alt="Nevú" className="h-8 sm:h-10 w-auto notranslate" translate="no" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-blue-700 notranslate" translate="no">Nevú</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="relative" ref={notificacoesRef}>
            <button
              onClick={handleToggleNotificacoes}
              className="relative p-2 rounded hover:bg-gray-100 focus:outline-none"
              aria-label="Notificações"
            >
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[10px] px-1.5 font-bold shadow z-10">
                  {badgeCount > 10 ? '10+' : badgeCount}
                </span>
              )}
            </button>

            {showNotificacoes && (
              <div className={`fixed inset-0 z-50 flex items-start justify-center pt-16 transition-opacity duration-200 ${notifClosing ? 'bg-opacity-0' : 'bg-opacity-30'} bg-black`} onClick={handleToggleNotificacoes}>
                <div className={`w-11/12 max-w-sm bg-white shadow-lg rounded-lg p-4 border border-gray-100 transition duration-200 transform ${notifClosing ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'}`} onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-blue-700">Notificações</h4>
                    {badgeCount > 0 && (
                      <button
                        onClick={marcarTodasComoLidas}
                        onTouchEnd={marcarTodasComoLidas}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                    <button onClick={handleToggleNotificacoes} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
                  </div>
                  {notificacoes.length === 0 ? (
                    <div className="text-gray-500 text-sm">Nenhuma notificação</div>
                  ) : (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                      {notificacoes.map(n => (
                        <li
                          key={n.id}
                          className={`text-sm flex items-start gap-2 cursor-pointer transition-colors p-1 rounded ${n.lida ? 'text-gray-600' : 'text-blue-700 font-semibold hover:bg-blue-50'}`}
                          onClick={(e) => handleNotificationClick(n, e)}
                          onTouchEnd={(e) => handleNotificationClick(n, e)}
                        >
                          <span className="text-lg mt-0.5">🔔</span>
                          <div className="flex-1">
                            <div className="leading-4">{n.titulo || 'Notificação'}</div>
                            {n.mensagem && (
                              <div className="text-xs text-gray-600 font-normal leading-4">{n.mensagem}</div>
                            )}
                            <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(n.createdAt)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="p-2 rounded hover:bg-gray-100 focus:outline-none"
            onClick={openDrawer}
            aria-label="Abrir menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="hidden md:flex items-center space-x-4">
          {!isEmpresa ? (
            user ? (
              <>
                <Link to="/" className={`font-medium text-sm sm:text-base ${isActive('/') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Início</Link>
                <Link to="/candidaturas" className={`font-medium text-sm sm:text-base ${isActive('/candidaturas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Candidaturas</Link>
                <Link to="/perfil" className={`font-medium text-sm sm:text-base ${isActive('/perfil') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Perfil</Link>
                <Link to="/apoio" className={`font-medium text-sm sm:text-base ${isActive('/apoio') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Apoio</Link>
                <Link to="/denuncias" className="font-medium text-sm sm:text-base text-red-600 hover:text-red-800 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                  Denunciar
                </Link>
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
            <>
              <Link to="/empresa-home" className={`font-medium text-sm sm:text-base ${isActive('/empresa-home') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Dashboard</Link>
              <Link to="/publicar-vaga" className={`font-medium text-sm sm:text-base ${isActive('/publicar-vaga') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Publicar Vaga</Link>
              <Link to="/vagas-publicadas" className={`font-medium text-sm sm:text-base ${isActive('/vagas-publicadas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Minhas Vagas</Link>
              <Link to="/candidaturas" className={`font-medium text-sm sm:text-base ${isActive('/candidaturas') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Candidaturas</Link>
              <Link to="/perfil-empresa" className={`font-medium text-sm sm:text-base ${isActive('/perfil-empresa') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Perfil</Link>
              <Link to="/apoio" className={`font-medium text-sm sm:text-base ${isActive('/apoio') ? 'text-blue-700 font-bold underline underline-offset-4' : 'text-gray-700 hover:text-blue-600 transition-colors'}`}>Apoio</Link>
              <Link to="/denuncias" className="font-medium text-sm sm:text-base text-red-600 hover:text-red-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                Denunciar
              </Link>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="ml-2 px-3 py-1.5 rounded bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </>
          )}
        </nav>
      </header>

      {(drawerOpen || drawerClosing) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className={`fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ${drawerClosing ? 'opacity-0' : 'opacity-100'}`} onClick={closeDrawer}></div>
          <nav
            id="mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className={`relative bg-white w-80 max-w-[92vw] h-full shadow-2xl rounded-l-3xl p-0 flex flex-col transition-transform duration-300 ease-out ${drawerClosing ? 'translate-x-full' : 'translate-x-0'}`}
            style={{ padding: 0 }}
          >
            <div className="flex flex-col h-full">
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition"
                onClick={closeDrawer}
                aria-label="Fechar menu"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                ref={drawerCloseBtnRef}
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex-1 flex flex-col pb-8 overflow-y-auto">
                <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-bl-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-lg font-bold">
                      {user ? String(userDisplayName || 'U').trim().charAt(0).toUpperCase() : 'N'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm opacity-90">Bem-vindo(a)</div>
                      <div className="text-base font-semibold truncate">{user ? userDisplayName : 'Nevú'}</div>
                      {user?.email && (
                        <div className="text-xs opacity-90 truncate">{user.email}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 px-5 flex flex-col gap-3">
                  {user ? (
                    <>
                      {user.tipo === 'empresa' ? (
                        <>
                          <div className="text-xs font-semibold text-gray-400 px-2 mt-1">Principal</div>
                          <Link to="/empresa-home" className={mobileLinkClass('/empresa-home')} onClick={closeDrawer}>Dashboard</Link>
                          <Link to="/publicar-vaga" className={mobileLinkClass('/publicar-vaga')} onClick={closeDrawer}>Publicar Vaga</Link>
                          <Link to="/vagas-publicadas" className={mobileLinkClass('/vagas-publicadas')} onClick={closeDrawer}>Minhas Vagas</Link>
                          <Link to="/candidaturas" className={mobileLinkClass('/candidaturas')} onClick={closeDrawer}>Candidaturas</Link>
                          <Link to="/perfil-empresa" className={mobileLinkClass('/perfil-empresa')} onClick={closeDrawer}>Perfil</Link>

                          <div className="text-xs font-semibold text-gray-400 px-2 mt-3">Suporte</div>
                          <Link to="/apoio" className={mobileLinkClass('/apoio')} onClick={closeDrawer}>Apoio</Link>

                          <button
                            onClick={() => { logout(); navigate('/'); closeDrawer(); window.location.reload(); }}
                            className="mt-6 py-2 px-3 rounded-lg bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-base flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-semibold text-gray-400 px-2 mt-1">Principal</div>
                          <Link to="/" className={mobileLinkClass('/')} onClick={closeDrawer}>Início</Link>
                          <Link to="/chamados" className={mobileLinkClass('/chamados')} onClick={closeDrawer}>Chamados</Link>
                          <Link to="/candidaturas" className={mobileLinkClass('/candidaturas')} onClick={closeDrawer}>Candidaturas</Link>
                          <Link to="/perfil" className={mobileLinkClass('/perfil')} onClick={closeDrawer}>Perfil</Link>

                          <div className="text-xs font-semibold text-gray-400 px-2 mt-3">Suporte</div>
                          <Link to="/apoio" className={mobileLinkClass('/apoio')} onClick={closeDrawer}>Apoio</Link>

                          <button
                            onClick={() => { logout(); navigate('/'); closeDrawer(); window.location.reload(); }}
                            className="mt-6 py-2 px-3 rounded-lg bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-base flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-gray-400 px-2 mt-1">Começar</div>
                      <Link to="/" className={mobileLinkClass('/')} onClick={closeDrawer}>Início</Link>
                      <Link to="/apoio" className={mobileLinkClass('/apoio')} onClick={closeDrawer}>Apoio</Link>
                      <Link to="/login" className="py-3 px-3 rounded-xl text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition" onClick={closeDrawer}>Login</Link>
                      <Link to="/cadastro" className="py-3 px-3 rounded-xl text-base font-semibold bg-green-600 text-white hover:bg-green-700 transition" onClick={closeDrawer}>Cadastrar</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}