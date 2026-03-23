import { Link, useLocation } from 'react-router-dom'

/**
 * Navegação entre páginas legais (topo das rotas /termos e /privacidade).
 */
export default function LegalPageNav() {
  const { pathname } = useLocation()
  const onTermos = pathname === '/termos'
  const onPriv = pathname === '/privacidade' || pathname === '/politica-privacidade'

  const linkCls = (active) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
      active ? 'bg-blue-600 text-white shadow' : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
    }`

  return (
    <nav
      className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
      aria-label="Navegação entre documentos legais"
    >
      <Link to="/termos" className={linkCls(onTermos)}>
        Termos e condições
      </Link>
      <Link to="/privacidade" className={linkCls(onPriv)}>
        Política de privacidade
      </Link>
    </nav>
  )
}
