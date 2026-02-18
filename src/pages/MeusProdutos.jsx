import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function MeusProdutos() {
  const { user } = useAuth()

  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState('')

  const [formOpenMobile, setFormOpenMobile] = useState(false)

  const [editingProdutoId, setEditingProdutoId] = useState(null)

  const [secDetalhesOpen, setSecDetalhesOpen] = useState(true)
  const [secLogisticaOpen, setSecLogisticaOpen] = useState(false)
  const [secFotosOpen, setSecFotosOpen] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [precoSobConsulta, setPrecoSobConsulta] = useState(false)
  const [tipoVenda, setTipoVenda] = useState('estoque')
  const [entregaDisponivel, setEntregaDisponivel] = useState(false)
  const [retiradaDisponivel, setRetiradaDisponivel] = useState(true)
  const [zonaEntrega, setZonaEntrega] = useState('')
  const [custoEntrega, setCustoEntrega] = useState('')
  const [localRetirada, setLocalRetirada] = useState('')

  const [imagensFiles, setImagensFiles] = useState([])
  const [imagensPreviews, setImagensPreviews] = useState([])
  const [imagensExistentes, setImagensExistentes] = useState([])

  const fileRef = useRef(null)
  const formRef = useRef(null)

  const canManage = user?.tipo === 'empresa'

  const currentEmpresaId = useMemo(() => {
    const id = user?.id ?? user?._id
    return id !== undefined && id !== null ? String(id) : ''
  }, [user?.id, user?._id])

  const fetchMyProdutos = async () => {
    if (!currentEmpresaId) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/produtos', { params: { empresaId: currentEmpresaId, page: 1, limit: 50 } })
      const list = Array.isArray(data?.produtos) ? data.produtos : []
      setProdutos(list)
    } catch (e) {
      console.error('Erro ao carregar meus produtos:', e)
      setError('Não foi possível carregar seus produtos.')
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canManage) return
    fetchMyProdutos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, currentEmpresaId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia ? window.matchMedia('(min-width: 768px)') : null
    if (!mq) return

    const apply = () => {
      if (mq.matches) {
        setFormOpenMobile(true)
      } else {
        setFormOpenMobile(false)
      }
    }

    apply()

    try {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    } catch {
      try {
        mq.addListener(apply)
        return () => mq.removeListener(apply)
      } catch {
        return undefined
      }
    }
  }, [])

  const resetForm = () => {
    setTitulo('')
    setDescricao('')
    setPreco('')
    setPrecoSobConsulta(false)
    setTipoVenda('estoque')
    setEntregaDisponivel(false)
    setRetiradaDisponivel(true)
    setZonaEntrega('')
    setCustoEntrega('')
    setLocalRetirada('')
    setImagensFiles([])
    setImagensExistentes([])
    setEditingProdutoId(null)
    try {
      if (fileRef.current) fileRef.current.value = ''
    } catch {}
  }

  const startEditProduto = (produto) => {
    if (!produto) return
    setEditingProdutoId(produto?.id ?? null)
    setTitulo(produto?.titulo || '')
    setDescricao(produto?.descricao || '')
    setPreco(produto?.preco || '')
    setPrecoSobConsulta(!!produto?.precoSobConsulta)
    setTipoVenda(produto?.tipoVenda === 'sob_encomenda' ? 'sob_encomenda' : 'estoque')
    setEntregaDisponivel(!!produto?.entregaDisponivel)
    setRetiradaDisponivel(produto?.retiradaDisponivel === undefined ? true : !!produto?.retiradaDisponivel)
    setZonaEntrega(produto?.zonaEntrega || '')
    setCustoEntrega(produto?.custoEntrega || '')
    setLocalRetirada(produto?.localRetirada || '')

    setImagensFiles([])
    setImagensExistentes(Array.isArray(produto?.imagens) ? produto.imagens : [])
    try {
      if (fileRef.current) fileRef.current.value = ''
    } catch {}

    setSecDetalhesOpen(true)
    setSecLogisticaOpen(false)
    setSecFotosOpen(false)
    setFormOpenMobile(true)
  }

  const cancelEditProduto = () => {
    resetForm()
  }

  const removeExistingImage = (idx) => {
    setImagensExistentes((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : []
      if (idx < 0 || idx >= arr.length) return arr
      arr.splice(idx, 1)
      return arr
    })
  }

  const toKeepRelativeUploadPath = (url) => {
    try {
      const s = String(url || '').trim()
      if (!s) return null
      const idx = s.indexOf('/uploads/')
      if (idx === -1) return null
      const rel = s.substring(idx)
      if (!rel.startsWith('/uploads/')) return null
      if (rel.includes('..')) return null
      return rel
    } catch {
      return null
    }
  }

  useEffect(() => {
    try {
      const urls = (Array.isArray(imagensFiles) ? imagensFiles : []).map((f) => URL.createObjectURL(f))
      setImagensPreviews(urls)
      return () => {
        urls.forEach((u) => {
          try { URL.revokeObjectURL(u) } catch {}
        })
      }
    } catch {
      setImagensPreviews([])
    }
  }, [imagensFiles])

  const onPickImages = (filesLike) => {
    const picked = Array.from(filesLike || []).filter(Boolean)
    if (picked.length === 0) return

    setImagensFiles((prev) => {
      const next = [...(Array.isArray(prev) ? prev : []), ...picked]
      return next.slice(0, 8)
    })
  }

  const removePickedImage = (idx) => {
    setImagensFiles((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : []
      if (idx < 0 || idx >= arr.length) return arr
      arr.splice(idx, 1)
      return arr
    })
  }

  const handleCreate = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!canManage) return

    const t = titulo.trim()
    if (!t) {
      setError('Informe o título do produto.')
      return
    }

    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const fd = new FormData()
      fd.append('titulo', t)
      if (descricao.trim()) fd.append('descricao', descricao.trim())
      if (!precoSobConsulta && preco.trim()) fd.append('preco', preco.trim())
      fd.append('precoSobConsulta', precoSobConsulta ? 'true' : 'false')
      fd.append('tipoVenda', tipoVenda)
      fd.append('entregaDisponivel', entregaDisponivel ? 'true' : 'false')
      fd.append('retiradaDisponivel', retiradaDisponivel ? 'true' : 'false')
      if (zonaEntrega.trim()) fd.append('zonaEntrega', zonaEntrega.trim())
      if (custoEntrega.trim()) fd.append('custoEntrega', custoEntrega.trim())
      if (localRetirada.trim()) fd.append('localRetirada', localRetirada.trim())

      if (editingProdutoId) {
        const keep = (Array.isArray(imagensExistentes) ? imagensExistentes : [])
          .map(toKeepRelativeUploadPath)
          .filter(Boolean)
        fd.append('imagensKeep', JSON.stringify(keep))
      }

      const files = Array.isArray(imagensFiles) ? imagensFiles : []
      if (files.length) files.slice(0, 8).forEach(f => fd.append('imagens', f))

      if (editingProdutoId) {
        await api.put(`/produtos/${encodeURIComponent(editingProdutoId)}`, fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        setSuccess('Produto atualizado com sucesso!')
      } else {
        await api.post('/produtos', fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        setSuccess('Produto criado com sucesso!')
      }

      resetForm()
      await fetchMyProdutos()
    } catch (e2) {
      console.error('Erro ao criar/atualizar produto:', e2)
      const msg = e2?.response?.data?.error || (editingProdutoId ? 'Não foi possível atualizar o produto.' : 'Não foi possível criar o produto.')
      setError(msg)
    } finally {
      setCreating(false)
      setTimeout(() => setSuccess(''), 3500)
    }
  }

  const handleSubmitLabel = editingProdutoId ? 'Atualizar produto' : 'Publicar produto'

  const handleSubmitLoadingLabel = editingProdutoId ? 'Atualizando...' : 'Publicando...'

  const handleRemove = async (produtoId) => {
    if (!produtoId) return
    if (!canManage) return

    if (!confirm('Remover este produto?')) return

    setError('')
    setSuccess('')
    try {
      await api.delete(`/produtos/${encodeURIComponent(produtoId)}`)
      setSuccess('Produto removido.')
      await fetchMyProdutos()
    } catch (e) {
      console.error('Erro ao remover produto:', e)
      setError('Não foi possível remover o produto.')
    } finally {
      setTimeout(() => setSuccess(''), 3500)
    }
  }

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-700 shadow-sm">
          Apenas empresas podem gerir produtos.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="sticky top-[56px] md:top-0 z-30 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xl md:text-2xl font-extrabold text-gray-900 truncate">Meus Produtos</div>
            <div className="text-xs md:text-sm text-gray-600">
              {produtos.length} produto(s)
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFormOpenMobile(v => !v)}
            className="md:hidden px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-extrabold"
          >
            {formOpenMobile ? 'Fechar' : '+ Novo'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>
      ) : null}
      {success ? (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-sm">{success}</div>
      ) : null}

      <div className={`mt-4 md:mt-5 ${formOpenMobile ? 'block' : 'hidden'} md:block`}>
        <form ref={formRef} onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-bold text-gray-900">{editingProdutoId ? 'Editar produto' : 'Novo produto'}</div>
          <div className="text-xs text-gray-500">Seções</div>
        </div>

        {editingProdutoId ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs text-gray-600">Editando: #{String(editingProdutoId)}</div>
            <button
              type="button"
              onClick={cancelEditProduto}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSecDetalhesOpen(v => !v)}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between"
            >
              <div className="text-sm font-extrabold text-gray-900">Detalhes</div>
              <div className="text-sm text-gray-500">{secDetalhesOpen ? '—' : '+'}</div>
            </button>
            <div className={`${secDetalhesOpen ? 'block' : 'hidden'} md:block p-4`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                  <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preço</label>
                  <input value={preco} onChange={(e) => setPreco(e.target.value)} disabled={precoSobConsulta} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white disabled:opacity-60" placeholder="Ex: 8500 MT" />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={precoSobConsulta} onChange={(e) => setPrecoSobConsulta(e.target.checked)} />
                    Sob consulta
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                  <select value={tipoVenda} onChange={(e) => setTipoVenda(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white">
                    <option value="estoque">Em estoque</option>
                    <option value="sob_encomenda">Sob encomenda</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSecLogisticaOpen(v => !v)}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between"
            >
              <div className="text-sm font-extrabold text-gray-900">Entrega / Retirada</div>
              <div className="text-sm text-gray-500">{secLogisticaOpen ? '—' : '+'}</div>
            </button>
            <div className={`${secLogisticaOpen ? 'block' : 'hidden'} md:block p-4`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={entregaDisponivel} onChange={(e) => setEntregaDisponivel(e.target.checked)} />
                    Entrega
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={retiradaDisponivel} onChange={(e) => setRetiradaDisponivel(e.target.checked)} />
                    Retirada
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Zona de entrega</label>
                  <input value={zonaEntrega} onChange={(e) => setZonaEntrega(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Custo de entrega</label>
                  <input value={custoEntrega} onChange={(e) => setCustoEntrega(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white" placeholder="Ex: 150 MT" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Local de retirada</label>
                  <input value={localRetirada} onChange={(e) => setLocalRetirada(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSecFotosOpen(v => !v)}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between"
            >
              <div className="text-sm font-extrabold text-gray-900">Fotos</div>
              <div className="text-sm text-gray-500">{secFotosOpen ? '—' : '+'}</div>
            </button>

            <div className={`${secFotosOpen ? 'block' : 'hidden'} md:block p-4`}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fotos (até 8)</label>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onPickImages(e.target.files)
                  try { e.target.value = '' } catch {}
                }}
              />

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {(editingProdutoId ? (Array.isArray(imagensExistentes) ? imagensExistentes : []) : []).map((src, idx) => (
                  <div key={`existing-${src}-${idx}`} className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="Remover foto"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {imagensPreviews.map((src, idx) => (
                  <div key={`${src}-${idx}`} className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePickedImage(idx)}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="Remover foto"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {((editingProdutoId ? (Array.isArray(imagensExistentes) ? imagensExistentes.length : 0) : 0) + imagensPreviews.length) < 8 ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current && fileRef.current.click()}
                    className="w-full aspect-square rounded-xl border border-dashed border-gray-300 bg-white text-gray-700 flex flex-col items-center justify-center hover:bg-gray-50 transition"
                  >
                    <div className="text-xl leading-none">+</div>
                    <div className="text-[10px] font-semibold mt-1">Adicionar</div>
                  </button>
                ) : null}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="w-full md:w-auto px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-semibold hover:bg-gray-100 transition"
                  disabled={((editingProdutoId ? (Array.isArray(imagensExistentes) ? imagensExistentes.length : 0) : 0) + imagensPreviews.length) >= 8}
                >
                  Escolher fotos
                </button>
                <div className="mt-1 text-xs text-gray-500">
                  {(editingProdutoId ? (Array.isArray(imagensExistentes) ? imagensExistentes.length : 0) : 0) + imagensPreviews.length}/8 no total
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 hidden md:flex justify-end">
          <button type="submit" disabled={creating} className="px-5 py-3 rounded-xl bg-gray-900 text-white font-extrabold disabled:opacity-60 hover:bg-black transition">
            {creating ? handleSubmitLoadingLabel : handleSubmitLabel}
          </button>
        </div>
        </form>
      </div>

      <div className="fixed md:hidden left-0 right-0 bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 z-40">
        <button
          type="button"
          onClick={() => {
            try {
              formRef.current?.requestSubmit?.()
            } catch {
              try {
                formRef.current?.dispatchEvent?.(new Event('submit', { bubbles: true, cancelable: true }))
              } catch {}
            }
          }}
          disabled={creating}
          className="w-full px-5 py-3 rounded-xl bg-gray-900 text-white font-extrabold disabled:opacity-60 hover:bg-black transition"
        >
          {creating ? handleSubmitLoadingLabel : handleSubmitLabel}
        </button>
      </div>

      <div className="mt-6">
        <div className="font-bold text-gray-900">Seus produtos</div>

        {loading ? (
          <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-600 shadow-sm">
            Carregando...
          </div>
        ) : produtos.length === 0 ? (
          <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-700 shadow-sm">
            <div className="text-base font-extrabold text-gray-900">Nenhum produto ainda</div>
            <div className="mt-1 text-sm text-gray-600">Crie seu primeiro produto para aparecer nas Vendas.</div>
            <button
              type="button"
              onClick={() => setFormOpenMobile(true)}
              className="mt-4 md:hidden px-4 py-3 rounded-xl bg-gray-900 text-white font-extrabold"
            >
              + Criar produto
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {produtos.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-stretch">
                  {Array.isArray(p.imagens) && p.imagens.length > 0 ? (
                    <div className="w-28 h-28 bg-gray-100 border-r border-gray-200 shrink-0">
                      <img src={p.imagens[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-gray-50 border-r border-gray-200 shrink-0" />
                  )}

                  <div className="flex-1 p-4 min-w-0">
                    <div className="font-extrabold text-gray-900 truncate">{p.titulo}</div>
                    <div className="mt-1 text-sm text-gray-700">
                      {p.preco || (p.precoSobConsulta ? 'Sob consulta' : '')}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        {p.tipoVenda === 'sob_encomenda' ? 'Sob encomenda' : 'Em estoque'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        Entrega: {p.entregaDisponivel ? 'Sim' : 'Não'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        Retirada: {p.retiradaDisponivel ? 'Sim' : 'Não'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => startEditProduto(p)}
                        className="mr-2 px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id)}
                        className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white text-red-700 border border-red-200 hover:bg-red-50 transition"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
