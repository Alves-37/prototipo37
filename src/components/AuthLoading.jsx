export default function AuthLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <div className="text-center">
        <div className="brand-spinner mb-4 mx-auto">
          <div className="spinner"></div>
          <div className="logo">
            <img src="/nevu.png" alt="Nevú" className="w-16 h-16" />
          </div>
        </div>
        <p className="text-gray-700 text-lg font-medium">Verificando autenticação...</p>
      </div>
    </div>
  )
}