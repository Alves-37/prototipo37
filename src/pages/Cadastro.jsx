import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
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
    if (!nome || !email || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
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
            <input 
              type="password" 
              value={senha} 
              onChange={e => setSenha(e.target.value)} 
              disabled={isLoading}
              className="mb-4 sm:mb-5 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="Digite sua senha (mín. 6 caracteres)" 
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha *</label>
            <input 
              type="password" 
              value={confirmarSenha} 
              onChange={e => setConfirmarSenha(e.target.value)} 
              disabled={isLoading}
              className="mb-4 sm:mb-5 px-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
              placeholder="Confirme sua senha" 
            />
            
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