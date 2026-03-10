// import HeaderSimples from '../components/HeaderSimples'
import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  // Normaliza `from` para aceitar tanto string quanto objeto Location
  const rawFrom = location.state?.from
  const from = rawFrom ? (typeof rawFrom === 'string' ? rawFrom : rawFrom.pathname || null) : null
  const { login } = useAuth()

  // Redirecionar automaticamente se veio do OAuth com erro de conta suspensa
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('error') === 'suspended') {
      navigate('/conta-desativada', { replace: true })
    }
  }, [location.search, navigate])

  // Mostrar mensagem de sucesso se vier da redefinição de senha
  useEffect(() => {
    if (location.state?.message) {
      setSucesso(location.state.message)
      // Limpar a mensagem do estado para não aparecer novamente
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    // Validação simples no cliente para evitar requisição desnecessária
    if (!email || !senha) {
      setErro(!email && !senha ? 'Informe seu e-mail e senha.' : !email ? 'Informe seu e-mail.' : 'Informe sua senha.')
      return
    }
    setIsLoading(true)
    setLoadingMessage('Verificando credenciais...')
    try {
      // Login sem enviar tipo: o backend valida pelo email/senha e retorna user.tipo
      const user = await login({ email, senha })
      setLoadingMessage('Redirecionando...')
      setTimeout(() => {
        if (from) {
          navigate(from, { replace: true })
        } else {
          if (user.tipo === 'usuario') navigate('/', { replace: true })
          else navigate('/empresa-home', { replace: true })
        }
      }, 1000)
    } catch (error) {
      const status = error?.response?.status
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message
      const suspended = error?.response?.data?.suspended
      const diasRestantes = error?.response?.data?.diasRestantes
      const wrongType = error?.response?.data?.wrongType
      const actualType = error?.response?.data?.actualType

      if (status === 403 && suspended) {
        // Conta desativada/suspensa -> enviar para página amigável
        navigate('/conta-desativada', { replace: true })
      } else if (status === 403 && wrongType) {
        const label = actualType === 'empresa' ? 'Empresa' : 'Candidato'
        setErro(`Tipo de conta incorreto. Esta conta é: ${label}. Selecione o tipo correto e tente novamente.`)
      } else if (status === 401) {
        setErro('E-mail ou senha incorretos. Verifique seus dados e tente novamente.')
      } else if (status === 404) {
        setErro('Conta não encontrada. Verifique o e-mail informado ou cadastre-se.')
      } else if (status >= 500) {
        setErro('Servidor indisponível no momento. Tente novamente em instantes.')
      } else if (backendMsg) {
        setErro(backendMsg)
      } else if (error?.message === 'Network Error') {
        setErro('Falha de conexão. Verifique sua internet e tente novamente.')
      } else {
        setErro('Não foi possível entrar. Tente novamente.')
      }
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-2 sm:px-0">
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoading}
        title="Entrando..."
        message={loadingMessage}
      />

      {/* <HeaderSimples /> */}
      <div className="w-full flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col items-center transition-transform duration-200 hover:scale-[1.025] mx-auto">
          <img src="/nevu.png" alt="Nevú" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-4 drop-shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 mb-2 tracking-tight drop-shadow">Nevú</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-center text-base sm:text-lg">Bem-vindo de volta!<br/>Acesse sua conta para encontrar novas oportunidades.</p>

          {from && (
            <div className="w-full mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm">
              ⚠️ Você precisa estar logado para acessar esta página.
            </div>
          )}
          
          <form className="w-full" onSubmit={handleSubmit} autoComplete="on">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative mb-4 sm:mb-5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12A4 4 0 1 1 8 12a4 4 0 0 1 8 0ZM12 14v7m0 0H9m3 0h3" /></svg>
              </span>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={isLoading}
                className="pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                placeholder="Digite seu e-mail" 
              />
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative mb-6 sm:mb-8">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3Zm0 0v2m0 4h.01" /></svg>
              </span>
              <input 
                type={mostrarSenha ? "text" : "password"}
                value={senha} 
                onChange={e => setSenha(e.target.value)} 
                disabled={isLoading}
                className="pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                placeholder="Digite sua senha" 
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {mostrarSenha ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {erro && (
              <div className="text-red-500 text-sm mb-4 p-3 bg-red-100 border border-red-400 rounded-lg whitespace-pre-line">
                {erro}
              </div>
            )}
            
            {sucesso && (
              <div className="text-green-600 text-sm mb-4 p-3 bg-green-100 border border-green-400 rounded-lg whitespace-pre-line">
                {sucesso}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-400 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-green-500 transition flex items-center justify-center gap-2 text-base sm:text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                  Entrar
                </>
              )}
            </button>

            {/* Botão Entrar com Google */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                // Redireciona para o OAuth do Google no backend
                const backendUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://prototipo-production-7dde.up.railway.app');
                const params = new URLSearchParams(location.search)
                const tipo = params.get('tipo')
                const qs = (tipo === 'empresa' || tipo === 'usuario') ? `?tipo=${encodeURIComponent(tipo)}` : ''
                window.location.href = `${backendUrl}/auth/google${qs}`;
              }}
              className="w-full py-2 sm:py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold shadow hover:bg-gray-50 transition flex items-center justify-center gap-2 text-base sm:text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
          </form>
          
          <div className="flex flex-col items-center gap-2 mt-4">
            <Link to="/recuperar-senha" className="text-sm text-blue-600 hover:underline">
              Esqueci minha senha
            </Link>
            <p className="text-sm text-gray-600">Não tem conta? <Link to="/cadastro" className="text-blue-600 hover:underline">Cadastre-se</Link></p>
          </div>
          
          <div className="mt-6 text-center text-gray-400 text-sm select-none w-full">
            from <span className="font-semibold text-blue-700">Neotrix</span>
          </div>
        </div>
      </div>
    </div>
  )
} 