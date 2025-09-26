import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [tipo, setTipo] = useState('usuario')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || null
  const { register } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    if (!nome || !email || !senha) {
      setErro('Preencha todos os campos.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (!email.includes('@')) {
      setErro('Digite um email válido.')
      return
    }
    setIsLoading(true)
    setLoadingMessage('Criando conta...')
    try {
      // Usar a função register do contexto de autenticação
      const user = await register({ nome, email, senha, tipo })
      setLoadingMessage('Redirecionando...')
      setTimeout(() => {
        if (from) {
          navigate(from, { replace: true })
        } else {
          if (tipo === 'usuario') navigate('/', { replace: true })
          else navigate('/empresa-home', { replace: true })
        }
      }, 1200)
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErro(error.response.data.error)
      } else {
        setErro('Erro ao registrar. Tente novamente.')
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
        title="Criando conta..."
        message={loadingMessage}
      />

      <div className="w-full pt-8 sm:pt-12 md:flex md:items-center md:justify-center md:py-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-xs sm:max-w-md md:max-w-lg flex flex-col items-center transition-transform duration-200 hover:scale-[1.025] mx-auto">
          <img src="/nevu.png" alt="Nevú" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-4 drop-shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 mb-2 tracking-tight drop-shadow">Cadastro</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-center text-base sm:text-lg">Crie sua conta para acessar todas as oportunidades.</p>
          
          {from && (
            <div className="w-full mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm">
              ⚠️ Você precisa estar logado para acessar esta página.
            </div>
          )}
          {sucesso && (
            <div className="w-full mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {sucesso}
            </div>
          )}

          <form className="w-full" onSubmit={handleSubmit} autoComplete="on">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
            <input 
              type="text" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              disabled={isLoading}
              className="mb-4 sm:mb-5 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="Digite seu nome completo" 
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              disabled={isLoading}
              className="mb-4 sm:mb-5 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="Digite seu e-mail" 
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
            <div className="relative mb-4 sm:mb-5">
              <input 
                type={mostrarSenha ? "text" : "password"}
                value={senha} 
                onChange={e => setSenha(e.target.value)} 
                disabled={isLoading}
                className="px-3 py-2 sm:py-3 pr-10 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                placeholder="Digite sua senha (mín. 6 caracteres)" 
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
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de conta *</label>
            <select 
              value={tipo} 
              onChange={e => setTipo(e.target.value)} 
              disabled={isLoading}
              className="mb-6 sm:mb-8 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="usuario">Sou candidato</option>
              <option value="empresa">Sou empresa</option>
            </select>
            
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
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </button>

            {/* Separador social */}
            <div className="w-full flex items-center gap-3 mt-3 mb-3">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs uppercase tracking-wider text-gray-400">ou</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Botão Google abaixo do Cadastrar */}
            <button
              type="button"
              onClick={() => {
                const backendBase = import.meta?.env?.DEV
                  ? 'http://localhost:5000'
                  : 'https://prototipo-production-7dde.up.railway.app';
                window.location.href = `${backendBase}/auth/google`;
              }}
              disabled={isLoading}
              className="w-full mb-2 flex items-center justify-center gap-3 px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12 c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.082,4,24,4C12.954,4,4,12.954,4,24c0,11.046,8.954,20,20,20 c11.046,0,20-8.954,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.64,6.053,29.082,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.195-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.281-7.953l-6.54,5.036C9.495,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.24-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.195,5.238C35.246,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continuar com Google</span>
            </button>
          </form>
          
          <p className="text-sm text-gray-600 mt-2">Já tem conta? <a href="/login" className="text-blue-600 hover:underline">Entrar</a></p>
          
          <div className="mt-6 text-center text-gray-400 text-sm select-none w-full">
            from <span className="font-semibold text-blue-700">Neotrix</span>
          </div>
        </div>
      </div>
    </div>
  )
} 