import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'nevú_welcome_seen_v1'

/**
 * Modal de primeira visita: o que é a Nevú, funcionalidades e como criar perfil.
 */
export default function WelcomeNevuModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-nevu-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar fundo"
        onClick={dismiss}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/nevu.png" alt="" className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0" />
            <h2 id="welcome-nevu-title" className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">
              Bem-vindo à Nevú
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 text-sm text-gray-700 space-y-4 leading-relaxed">
          <p>
            A <strong className="text-gray-900">Nevú</strong> é uma plataforma para <strong>candidatos</strong> e{' '}
            <strong>empresas</strong> em Moçambique: partilhar oportunidades, construir rede e comunicar de forma simples.
          </p>

          <div>
            <h3 className="font-bold text-gray-900 mb-1.5">O que pode fazer aqui</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ver e interagir com publicações no <strong>feed</strong></li>
              <li>Criar e editar o seu <strong>perfil</strong> (foto, informações, capa)</li>
              <li>Candidatos: <strong>candidaturas</strong> a vagas</li>
              <li>Empresas: <strong>publicar vagas</strong>, <strong>serviços</strong> e gerir <strong>vendas/produtos</strong></li>
              <li>Vendas: <strong>vender</strong> produtos/serviços e acompanhar a sua atividade (quando disponível)</li>
              <li>Conectar-se a outras pessoas e empresas</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-1.5">Benefícios</h3>
            <p>
              Mais visibilidade profissional, contacto direto com quem procura talento, <strong>serviços</strong> e <strong>produtos</strong>,
              e tudo num só lugar pensado para o contexto moçambicano.
            </p>
          </div>

          <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-2.5">
            <h3 className="font-bold text-blue-950 mb-1">Como criar o seu perfil</h3>
            <ol className="list-decimal pl-5 space-y-1 text-blue-950/90">
              <li>Registe-se com e-mail ou utilize o acesso rápido disponível</li>
              <li>Complete o nome e os dados no menu <strong>Perfil</strong></li>
              <li>Adicione foto e, se quiser, foto de capa — ajuda a sua página a destacar-se</li>
            </ol>
          </div>

          <p className="text-xs text-gray-500">
            Pode voltar a ver esta informação nas páginas <strong>Termos</strong> e <strong>Apoio</strong> no menu, quando
            estiver ligado.
          </p>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/90 px-4 py-3 sm:px-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={dismiss}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Ficar no início
          </button>
          <Link
            to="/cadastro"
            onClick={dismiss}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition text-center"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  )
}
