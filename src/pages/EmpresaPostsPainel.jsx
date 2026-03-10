import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function EmpresaPostsPainel() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({ totals: { posts: 0, reactions: 0, views: 0 }, posts: [] })

  const isEmpresa = useMemo(() => user?.tipo === 'empresa', [user?.tipo])

  useEffect(() => {
    let cancelled = false

    async function fetchMetrics() {
      if (!isEmpresa) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const resp = await api.get('/posts/company/metrics')
        if (cancelled) return
        setData(resp.data || { totals: { posts: 0, reactions: 0, views: 0 }, posts: [] })
      } catch (e) {
        console.error('Erro ao carregar painel de posts da empresa:', e)
        if (cancelled) return
        setError('Não foi possível carregar o painel de posts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMetrics()
    return () => {
      cancelled = true
    }
  }, [isEmpresa])

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('pt-BR')
    } catch {
      return ''
    }
  }

  const postPreview = (p) => {
    const t = String(p?.texto || '').trim()
    if (!t) return p?.postType === 'servico' ? 'Serviço publicado' : 'Publicação'
    if (t.length <= 90) return t
    return `${t.slice(0, 90)}...`
  }

  const reactionBadge = (label, value, className) => {
    const n = Number(value || 0)
    if (!n) return null
    return (
      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
        {label}: {n}
      </div>
    )
  }

  if (!isEmpresa) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 pb-24 md:pb-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center text-gray-700">
          Este painel é exclusivo para empresas.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 pb-24 md:pb-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Painel de Posts</h1>
          <div className="text-sm text-gray-600 mt-1">Acompanhe reações e visualizações das suas publicações.</div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 shadow-sm"
        >
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-400 tracking-[0.2em]">POSTS</div>
          {loading ? (
            <div className="mt-3 h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
          ) : (
            <div className="text-3xl font-extrabold text-gray-900 mt-2">{Number(data?.totals?.posts || 0)}</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-400 tracking-[0.2em]">REAÇÕES</div>
          {loading ? (
            <div className="mt-3 h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
          ) : (
            <div className="text-3xl font-extrabold text-gray-900 mt-2">{Number(data?.totals?.reactions || 0)}</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-400 tracking-[0.2em]">VISUALIZAÇÕES</div>
          {loading ? (
            <div className="mt-3 h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
          ) : (
            <div className="text-3xl font-extrabold text-gray-900 mt-2">{Number(data?.totals?.views || 0)}</div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
            <div className="mt-4 text-base font-bold text-gray-900">Carregando métricas…</div>
            <div className="mt-1 text-sm text-gray-600">Estamos a buscar reações e visualizações dos seus posts.</div>
            <div className="mt-6 w-full max-w-md">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                <div className="h-full w-1/2 bg-blue-600 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6 text-center text-red-700">
          {error}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="font-bold text-gray-900">Suas publicações</div>
            <div className="text-sm text-gray-500">{data?.posts?.length || 0} itens</div>
          </div>

          <div className="divide-y divide-gray-200">
            {(data?.posts || []).map((p) => {
              const reactions = p?.metrics?.reactions || {}
              const reactionsTotal = Number(p?.metrics?.reactionsTotal || 0)
              const views = Number(p?.metrics?.views || 0)

              return (
                <div key={p.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {String(p?.postType || 'post').toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(p?.createdAt)}</div>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-gray-900 break-words">{postPreview(p)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:w-[260px]">
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="text-[11px] text-gray-400 font-semibold tracking-widest">REAÇÕES</div>
                        <div className="text-xl font-extrabold text-gray-900 mt-1">{reactionsTotal}</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="text-[11px] text-gray-400 font-semibold tracking-widest">VIEWS</div>
                        <div className="text-xl font-extrabold text-gray-900 mt-1">{views}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {reactionBadge('Like', reactions.like, 'bg-green-50 text-green-700 border-green-100')}
                    {reactionBadge('Amei', reactions.love, 'bg-pink-50 text-pink-700 border-pink-100')}
                    {reactionBadge('Uau', reactions.wow, 'bg-yellow-50 text-yellow-700 border-yellow-100')}
                    {reactionBadge('Triste', reactions.sad, 'bg-indigo-50 text-indigo-700 border-indigo-100')}
                    {reactionBadge('Bravo', reactions.angry, 'bg-red-50 text-red-700 border-red-100')}
                  </div>
                </div>
              )
            })}

            {(data?.posts || []).length === 0 && (
              <div className="p-10 text-center text-gray-600">
                Você ainda não publicou nenhum post.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
