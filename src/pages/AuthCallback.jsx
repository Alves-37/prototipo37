import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

const STEPS = {
  idle: { label: 'A receber resposta do Google…' },
  token: { label: 'A validar a sua sessão…' },
  profile: { label: 'A carregar o seu perfil…' },
  success: { label: 'Sessão iniciada. A redirecionar…' },
  error: { label: 'Não foi possível concluir o login.' },
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [stepKey, setStepKey] = useState('idle')
  const [detail, setDetail] = useState('')

  const step = useMemo(() => STEPS[stepKey] || STEPS.idle, [stepKey])

  useEffect(() => {
    async function handleCallback() {
      try {
        setStepKey('idle')
        const hash = window.location.hash || ''
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
        const token = params.get('token')
        if (!token) {
          setStepKey('error')
          setDetail('Ligação incompleta. Tente entrar novamente.')
          setTimeout(() => navigate('/login?error=google'), 1600)
          return
        }

        setStepKey('token')
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        const payload = decodeJwt(token)
        const id = payload?.id
        if (!id) {
          setStepKey('error')
          setDetail('Sessão inválida.')
          setTimeout(() => navigate('/login?error=google'), 1600)
          return
        }

        setStepKey('profile')
        const resp = await api.get(`/users/${id}`)
        const user = resp.data
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)

        setStepKey('success')
        setTimeout(() => navigate('/'), 700)
      } catch (err) {
        console.error('Erro no AuthCallback:', err)
        setStepKey('error')
        setDetail('Verifique a ligação à internet e tente outra vez.')
        setTimeout(() => navigate('/login?error=google'), 2000)
      }
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isError = stepKey === 'error'
  const isSuccess = stepKey === 'success'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(1200px 600px at 10% 0%, rgba(59, 130, 246, 0.18), transparent 55%),
            radial-gradient(900px 500px at 100% 30%, rgba(234, 179, 8, 0.12), transparent 50%),
            radial-gradient(800px 400px at 50% 100%, rgba(34, 197, 94, 0.1), transparent 45%)
          `,
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/80 p-8 shadow-2xl shadow-gray-400/20 backdrop-blur-xl sm:p-10">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-tr from-emerald-400/15 to-transparent" />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div
                  className={`absolute inset-0 rounded-2xl blur-xl ${
                    isError ? 'bg-red-400/30' : isSuccess ? 'bg-emerald-400/35' : 'bg-blue-400/25'
                  } scale-150`}
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-lg">
                  <img src="/nevu.png" alt="Nevú" className="h-10 w-10 object-contain" />
                </div>
                {!isError && !isSuccess ? (
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white shadow-md">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                ) : null}
              </div>

              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
                {isError ? 'Algo correu mal' : 'Entrar com Google'}
              </h1>
              <p
                className={`mt-2 text-sm font-medium sm:text-base ${
                  isError ? 'text-red-600' : isSuccess ? 'text-emerald-700' : 'text-gray-600'
                }`}
              >
                {step.label}
              </p>
              {detail ? <p className="mt-2 text-xs text-gray-500 sm:text-sm">{detail}</p> : null}

              {!isError && !isSuccess ? (
                <div className="mt-8 flex w-full flex-col gap-2">
                  {(() => {
                    const phaseIdx = stepKey === 'idle' ? 0 : stepKey === 'token' ? 1 : stepKey === 'profile' ? 2 : 0
                    const rows = [
                      { key: 'g', title: 'Resposta do Google' },
                      { key: 't', title: 'Validação da sessão' },
                      { key: 'p', title: 'Perfil Nevú' },
                    ]
                    return rows.map((row, i) => {
                      const done = i < phaseIdx
                      const current = i === phaseIdx
                      return (
                        <div
                          key={row.key}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                            current
                              ? 'border-blue-200 bg-blue-50/90 text-blue-950 shadow-sm'
                              : done
                                ? 'border-emerald-100 bg-emerald-50/50 text-emerald-900'
                                : 'border-gray-100 bg-gray-50/40 text-gray-400'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              current ? 'bg-blue-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {done ? '✓' : i + 1}
                          </span>
                          <span className="font-semibold">{row.title}</span>
                          {current ? (
                            <svg
                              className="ml-auto h-5 w-5 shrink-0 animate-spin text-blue-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : null}
                        </div>
                      )
                    })
                  })()}
                </div>
              ) : null}

              {isSuccess ? (
                <div className="mt-8 flex items-center justify-center gap-2 text-emerald-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            A sua conta Nevú está protegida. Não partilhe links desta página.
          </p>
        </div>
      </div>
    </div>
  )
}
