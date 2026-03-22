import { Link } from 'react-router-dom'

/**
 * Página temporária: área de mensagens ainda em desenvolvimento.
 */
export default function MensagensEmConstrucao() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] overflow-hidden bg-[#0a0a0f] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.45), transparent),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(236, 72, 153, 0.35), transparent),
            radial-gradient(ellipse 50% 60% at 70% 80%, rgba(34, 211, 238, 0.25), transparent)
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M60%200H0v60%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.04)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          Em construção
        </div>

        <h1 className="font-['Georgia',_'Times_New_Roman',_serif] text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Mensagens
          <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
            a caminho
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
          Estamos a preparar uma experiência de conversas mais rápida, segura e agradável. Volte em breve — ou explore o feed enquanto tanto.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-sm font-extrabold text-gray-900 shadow-lg shadow-indigo-500/20 transition hover:bg-cyan-50"
          >
            Ir para o início
          </Link>
          <Link
            to="/perfil"
            className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Ver perfil
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-md grid-cols-3 gap-4 text-left text-sm text-white/50">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="mb-1 font-bold text-cyan-300/90">01</div>
            Interface
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="mb-1 font-bold text-fuchsia-300/90">02</div>
            Notificações
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="mb-1 font-bold text-amber-300/90">03</div>
            Estabilidade
          </div>
        </div>
      </div>
    </div>
  )
}
