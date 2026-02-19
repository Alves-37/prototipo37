import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function DetalheServico() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [servico, setServico] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('ID do serviço não informado.')
      setLoading(false)
      return
    }
    const fetchServico = async () => {
      try {
        const { data } = await api.get(`/chamados/${encodeURIComponent(id)}`)
        const raw = data && typeof data === 'object' ? data : null

        const imagens = (() => {
          try {
            if (Array.isArray(raw?.imagens)) return raw.imagens
            if (typeof raw?.imagens === 'string' && raw.imagens.trim()) {
              const parsed = JSON.parse(raw.imagens)
              return Array.isArray(parsed) ? parsed : []
            }
          } catch {}
          return []
        })()

        const author = raw?.usuario || raw?.author || null
        const avatarUrl = author?.logo || author?.foto || null

        setServico({
          ...raw,
          titulo: raw?.titulo ?? raw?.title ?? '',
          descricao: raw?.descricao ?? raw?.texto ?? raw?.content ?? '',
          categoria: raw?.categoria ?? null,
          tags: raw?.tags ?? null,
          empresa: author?.tipo === 'empresa' ? author?.nome : null,
          nome: author?.tipo !== 'empresa' ? author?.nome : null,
          localizacao: raw?.localizacao ?? null,
          provincia: raw?.provincia ?? null,
          distrito: raw?.distrito ?? null,
          imageUrl: imagens?.[0] || null,
          imagens,
          avatarUrl,
          contato: raw?.telefone || raw?.email || null,
        })
      } catch (err) {
        console.error('Erro ao buscar serviço:', err)
        setError('Serviço não encontrado ou erro ao carregar.')
      } finally {
        setLoading(false)
      }
    }
    fetchServico()
  }, [id])

  const absoluteAssetUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url
    return `${import.meta.env.VITE_API_URL || ''}/uploads/${url.replace(/^\/+/, '')}`
  }

  if (loading) {
    return (
      <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-52 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
        <div className="bg-white border border-red-200 rounded-2xl p-6 text-center text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!servico) {
    return (
      <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-600 shadow-sm">
          Serviço não encontrado.
        </div>
      </div>
    )
  }

  const {
    titulo,
    descricao,
    categoria,
    tags,
    empresa,
    nome,
    localizacao,
    provincia,
    distrito,
    imageUrl,
    avatarUrl,
    contato,
    createdAt,
    updatedAt,
  } = servico

  return (
    <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {imageUrl ? (
          <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-100">
            <img src={absoluteAssetUrl(imageUrl)} alt={titulo} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
              {avatarUrl ? (
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img src={absoluteAssetUrl(avatarUrl)} alt={empresa || nome} className="w-full h-full object-cover" />
                </div>
              ) : (
                (empresa || nome || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{titulo || 'Serviço'}</h1>
              <div className="text-sm text-gray-600 mt-1">{empresa || nome} {localizacao ? `· ${localizacao}` : ''}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoria ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {categoria}
                  </span>
                ) : null}
                {(Array.isArray(tags) ? tags : []).slice(0, 8).map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {descricao ? (
            <div className="mt-6">
              <h2 className="font-bold text-gray-900 mb-2">Descrição</h2>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{descricao}</div>
            </div>
          ) : null}

          {contato ? (
            <div className="mt-6">
              <h2 className="font-bold text-gray-900 mb-2">Contato</h2>
              <div className="text-sm text-gray-800">{contato}</div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
            <div>Criado em {new Date(createdAt || Date.now()).toLocaleDateString()}</div>
            {updatedAt && updatedAt !== createdAt ? (
              <div>Atualizado em {new Date(updatedAt).toLocaleDateString()}</div>
            ) : null}
          </div>

          {isAuthenticated ? (
            <div className="mt-6 flex gap-2">
              <Link
                to="/mensagens"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 transition"
              >
                Enviar mensagem
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-200 text-sm font-extrabold hover:bg-gray-50 transition"
              >
                Voltar
              </button>
            </div>
          ) : (
            <div className="mt-6 flex gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700 transition"
              >
                Entrar para contactar
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-200 text-sm font-extrabold hover:bg-gray-50 transition"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
