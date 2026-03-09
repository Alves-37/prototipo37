import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'
import api from '../services/api'

export default function RecuperarSenha() {
  const [step, setStep] = useState(1) // 1: solicitar código, 2: verificar código, 3: redefinir senha
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const navigate = useNavigate()

  async function handleRequestCode(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    
    if (!email && !phoneNumber) {
      setErro('Informe seu e-mail ou número de telefone.')
      return
    }

    setIsLoading(true)
    setLoadingMessage('Enviando código...')

    try {
      const payload = email ? { email } : { phoneNumber }
      const response = await api.post('/auth/forgot-password', payload)
      const data = response?.data || {}

      setSucesso(data.message)
      if (data.developmentMode) {
        setSucesso(`${data.message} Código (desenvolvimento): ${data.code}`)
      }
      setStep(2)
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message
      setErro(msg || 'Falha de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setErro('')
    
    if (!code) {
      setErro('Informe o código recebido.')
      return
    }

    setIsLoading(true)
    setLoadingMessage('Verificando código...')

    try {
      const response = await api.post('/auth/verify-reset-code', { code })
      const data = response?.data || {}

      setSucesso(data.message)
      setStep(3)
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message
      setErro(msg || 'Falha de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    
    if (!newPassword || !confirmPassword) {
      setErro('Preencha todos os campos.')
      return
    }

    if (newPassword.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErro('As senhas não coincidem.')
      return
    }

    setIsLoading(true)
    setLoadingMessage('Redefinindo senha...')

    try {
      const response = await api.post('/auth/reset-password', {
        code,
        newPassword,
        email,
      })

      const data = response?.data || {}

      setSucesso(data.message)
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' },
        })
      }, 2000)
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message
      setErro(msg || 'Falha de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-2 sm:px-0">
      <LoadingOverlay 
        isVisible={isLoading}
        title="Processando..."
        message={loadingMessage}
      />

      <div className="w-full flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col items-center transition-transform duration-200 hover:scale-[1.025] mx-auto">
          <img src="/nevu.png" alt="Nevú" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-4 drop-shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 mb-2 tracking-tight drop-shadow">Nevú</h1>
          
          {step === 1 && (
            <>
              <p className="text-gray-600 mb-6 sm:mb-8 text-center text-base sm:text-lg">Recuperar Senha<br/>Digite seu e-mail ou número para receber um código de recuperação via WhatsApp.</p>
              
              <form className="w-full" onSubmit={handleRequestCode}>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative mb-4 sm:mb-5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12A4 4 0 1 1 8 12a4 4 0 0 1 8 0ZM12 14v7m0 0H9m3 0h3" />
                    </svg>
                  </span>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    disabled={isLoading}
                    className="pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    placeholder="Digite seu e-mail" 
                    autoComplete="email"
                  />
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Número (opcional)</label>
                <div className="relative mb-4 sm:mb-5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l3 7-1.35 2.7a1 1 0 0 0 .9 1.45H19a1 1 0 0 0 0-2H8.42l.93-1.87a1 1 0 0 0 .03-.92L6.1 5H3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Ex: +25884xxxxxxx ou 84xxxxxxx"
                    autoComplete="tel"
                  />
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
                  className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-400 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-green-500 transition flex items-center justify-center gap-2 text-base sm:text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar Código
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-gray-600 mb-6 sm:mb-8 text-center text-base sm:text-lg">Verificar Código<br/>Digite o código de 6 dígitos que recebeu via WhatsApp.</p>
              
              <form className="w-full" onSubmit={handleVerifyCode}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Recuperação</label>
                <div className="relative mb-4 sm:mb-5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    value={code} 
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    disabled={isLoading}
                    className="pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed text-center text-lg font-mono" 
                    placeholder="000000" 
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
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
                
                <div className="flex gap-2 mb-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setErro('')
                      setSucesso('')
                    }}
                    disabled={isLoading}
                    className="flex-1 py-2 sm:py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold shadow hover:bg-gray-50 transition flex items-center justify-center gap-2 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                  </button>
                  
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-400 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-green-500 transition flex items-center justify-center gap-2 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verificar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-gray-600 mb-6 sm:mb-8 text-center text-base sm:text-lg">Redefinir Senha<br/>Digite sua nova senha abaixo.</p>
              
              <form className="w-full" onSubmit={handleResetPassword}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <div className="relative mb-4 sm:mb-5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3Zm0 0v2m0 4h.01" />
                    </svg>
                  </span>
                  <input 
                    type={mostrarSenha ? "text" : "password"}
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    disabled={isLoading}
                    className="pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    placeholder="Digite sua nova senha" 
                    autoComplete="new-password"
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

                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                <div className="relative mb-4 sm:mb-5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3Zm0 0v2m0 4h.01" />
                    </svg>
                  </span>
                  <input 
                    type={mostrarSenha ? "text" : "password"}
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    disabled={isLoading}
                    className="pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition text-base shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    placeholder="Confirme sua nova senha" 
                    autoComplete="new-password"
                  />
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
                
                <div className="flex gap-2 mb-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setStep(2)
                      setErro('')
                      setSucesso('')
                    }}
                    disabled={isLoading}
                    className="flex-1 py-2 sm:py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold shadow hover:bg-gray-50 transition flex items-center justify-center gap-2 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                  </button>
                  
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-400 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-green-500 transition flex items-center justify-center gap-2 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Redefinindo...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Redefinir Senha
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
          
          <p className="text-sm text-gray-600 mt-4">
            <Link to="/login" className="text-blue-600 hover:underline">← Voltar para o login</Link>
          </p>
          
          <div className="mt-6 text-center text-gray-400 text-sm select-none w-full">
            from <span className="font-semibold text-blue-700">Neotrix</span>
          </div>
        </div>
      </div>
    </div>
  )
}
