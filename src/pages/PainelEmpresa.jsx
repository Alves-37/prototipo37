import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ModalCandidaturasRecebidas } from '../components/Modal'
import api from '../services/api';

export default function PainelEmpresa() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Proteger rota
  useEffect(() => {
    if (!user || user.tipo !== 'empresa') {
      navigate('/')
    }
  }, [user, navigate])

  // Buscar vagas reais da API
  const [vagas, setVagas] = useState([])
  useEffect(() => {
    async function fetchVagas() {
      const response = await api.get('/vagas/empresa/minhas-vagas');
      setVagas(response.data);
    }
    if (user) fetchVagas();
  }, [user]);

  // Buscar candidaturas reais da API
  const [candidaturasRecebidas, setCandidaturasRecebidas] = useState([]);
  useEffect(() => {
    async function fetchCandidaturas() {
      const response = await api.get('/candidaturas/empresa');
      setCandidaturasRecebidas(response.data);
    }
    if (user) fetchCandidaturas();
  }, [user]);

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [local, setLocal] = useState('')
  const [tipoVaga, setTipoVaga] = useState('Tempo Integral')
  const [erro, setErro] = useState('')
  const [showModalCandidaturas, setShowModalCandidaturas] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo || !descricao || !local) {
      setErro('Preencha todos os campos.')
      return
    }
    // Aqui você pode implementar o POST real para criar vaga, se desejar
    setTitulo('')
    setDescricao('')
    setLocal('')
    setTipoVaga('Tempo Integral')
    setErro('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header fixo */}
      <header className="sticky top-0 z-30 bg-white shadow-md flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <span className="font-bold text-lg text-blue-700">Painel da Empresa</span>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Estatísticas reais */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-md border flex gap-8 justify-center">
            <div className="text-center">
              <div className="text-2xl mb-1">📋</div>
              <div className="font-bold text-lg">Vagas publicadas</div>
              <div className="text-blue-700 text-2xl">{vagas.length}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">👥</div>
              <div className="font-bold text-lg">Candidaturas recebidas</div>
              <div className="text-green-700 text-2xl">{candidaturasRecebidas.length}</div>
            </div>
          </div>
        </section>
        {/* Botão para abrir modal de candidaturas recebidas */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowModalCandidaturas(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm shadow hover:bg-green-700 transition"
          >
            📥 Ver candidaturas recebidas
          </button>
        </div>
        {/* Card para publicar nova vaga */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-md border">
            <div className="text-center">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Publicar Nova Vaga</h3>
              <p className="text-gray-600 mb-6">Crie uma nova vaga para encontrar os melhores candidatos</p>
              <Link 
                to="/publicar-vaga"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition shadow-md"
              >
                <span>📝</span>
                Criar Nova Vaga
              </Link>
            </div>
          </div>
        </section>
        {/* Vagas publicadas */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Vagas publicadas</h3>
          {vagas.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-md border">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">Nenhuma vaga publicada ainda.</p>
              <p className="text-gray-400 text-sm mt-2">Publique sua primeira vaga usando o formulário acima.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vagas.map(vaga => (
                <div key={vaga.id} className="bg-white border rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">💼</span>
                        <h4 className="font-bold text-blue-700 text-lg">{vaga.titulo}</h4>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">📍</span>
                          <span>{vaga.localizacao || vaga.local}</span>
                        </div>
                        <span className="hidden sm:inline mx-2">•</span>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                          {vaga.tipoContrato || vaga.tipo}
                        </span>
                      </div>
                      <div className="text-gray-700 text-sm leading-relaxed">
                        {vaga.descricao}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition">
                        ✏️ Editar
                      </button>
                      <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition">
                        👥 Candidatos
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {/* Modal de candidaturas recebidas */}
      <ModalCandidaturasRecebidas
        isOpen={showModalCandidaturas}
        onClose={() => setShowModalCandidaturas(false)}
        candidaturas={candidaturasRecebidas}
      />
    </div>
  )
}
  