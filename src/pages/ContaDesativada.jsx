import { Link } from 'react-router-dom'

export default function ContaDesativada() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sua conta está desativada</h1>
        <p className="text-gray-600 mb-6">
          No momento, seu acesso está bloqueado. Se acredita que isso é um engano ou deseja solicitar a reativação, entre em contacto com o nosso suporte.
        </p>

        <div className="grid gap-3">
          <Link
            to="/apoio"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Falar com o Suporte
          </Link>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
          >
            Voltar ao Login
          </Link>
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
          >
            Ir para a Página Inicial
          </Link>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          Código: ACC-403
        </div>
      </div>
    </div>
  )
}
