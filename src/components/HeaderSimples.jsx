import { useNavigate } from 'react-router-dom'

export default function HeaderSimples() {
  const navigate = useNavigate();
  return (
    <header className="bg-white shadow-md border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between sticky top-0 z-50 w-full">
      <div className="flex items-center gap-2">
        <img src="/nevu.png" alt="Nevú" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
        <span className="text-xl sm:text-2xl font-extrabold text-blue-700 tracking-tight">Nevú</span>
      </div>
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition text-sm sm:text-base"
      >
        ← Voltar
      </button>
    </header>
  )
} 