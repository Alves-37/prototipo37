// import HeaderSimples from '../components/HeaderSimples'
import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || null
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setIsLoading(true)
    setLoadingMessage('Verificando credenciais...')
    try {
      // Usar a função login do contexto de autenticação (sem enviar tipo)
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
      if (error.response && error.response.data && error.response.data.error) {
        setErro(error.response.data.error)
      } else {
        setErro('Erro ao fazer login. Tente novamente.')
      }
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 px-2 sm:px-0">
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoading}
        title="Entrando..."
        message={loadingMessage}
      />

      {/* <HeaderSimples /> */}
      <div className="w-full pt-8 sm:pt-12 md:flex md:items-center md:justify-center md:py-16">
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
                type="password" 
                value={senha} 
                onChange={e => setSenha(e.target.value)} 
                disabled={isLoading}
                className="pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                placeholder="Digite sua senha" 
              />
            </div>
            
            {erro && (
              <div className="text-red-500 text-sm mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                {erro}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-400 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-green-500 transition flex items-center justify-center gap-2 text-base sm:text-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>
          
          <p className="text-sm text-gray-600 mt-2">Não tem conta? <Link to="/cadastro" className="text-blue-600 hover:underline">Cadastre-se</Link></p>
          
          <div className="mt-6 text-center text-gray-400 text-sm select-none w-full">
            from <span className="font-semibold text-blue-700">Neotrix</span>
          </div>
        </div>
      </div>
    </div>
  )
} 