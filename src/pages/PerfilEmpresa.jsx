import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal';

export default function PerfilEmpresa() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const { id } = useParams()
  const [editando, setEditando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    nuit: '',
    email: '',
    telefone: '',
    endereco: '',
    descricao: '',
    setor: '',
    tamanho: '',
    website: '',
    alvara: '',
    registroComercial: '',
    inscricaoFiscal: '',
    anoFundacao: '',
    capitalSocial: '',
    moedaCapital: 'MT',
    logo: '',
  })
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Atualizar formData quando user mudar
  useEffect(() => {
    if (user && user.tipo === 'empresa') {
      setFormData({
        nome: user.nome || '',
        razaoSocial: user.razaoSocial || user.perfil?.razaoSocial || '',
        nuit: user.nuit || user.perfil?.nuit || '',
        email: user.email || '',
        telefone: user.telefone || user.perfil?.telefone || '',
        endereco: user.endereco || user.perfil?.endereco || '',
        descricao: user.descricao || user.perfil?.descricao || '',
        setor: user.setor || user.perfil?.setor || '',
        tamanho: user.tamanho || user.perfil?.tamanho || '',
        website: user.website || user.perfil?.website || '',
        alvara: user.alvara || user.perfil?.alvara || '',
        registroComercial: user.registroComercial || user.perfil?.registroComercial || '',
        inscricaoFiscal: user.inscricaoFiscal || user.perfil?.inscricaoFiscal || '',
        anoFundacao: user.anoFundacao || user.perfil?.anoFundacao || '',
        capitalSocial: user.capitalSocial || user.perfil?.capitalSocial || '',
        moedaCapital: user.moedaCapital || user.perfil?.moedaCapital || 'MT',
        logo: user.logo || user.perfil?.logo || '',
      })
    }
  }, [user])

  // Se não estiver logado como empresa, mostrar acesso restrito
  if (!user || user.tipo !== 'empresa') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg text-center px-4">Acesso restrito. Faça login como empresa para visualizar o perfil.</div>
      </div>
    )
  }

  // Card de perfil da empresa
  const renderCard = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-2">
      <div className="w-full max-w-2xl md:max-w-3xl bg-white rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center border border-blue-100">
        <div className="relative mb-5">
          {formData.logo || user.logo ? (
            <img
              src={formData.logo || user.logo}
              alt="Logo da empresa"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-5xl text-blue-700 font-extrabold select-none">
                {(formData.nome || user.nome || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </span>
            </div>
          )}
              <button
            onClick={() => setEditando(true)}
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
            title="Editar perfil"
              >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4zM7 17h.01M7 17a4 4 0 005.657 0M7 17a4 4 0 010-5.657M7 17H5a2 2 0 01-2-2v-2a2 2 0 012-2h2m0 0a4 4 0 015.657 0m0 0a4 4 0 010 5.657" /></svg>
              </button>
        </div>
        
        {/* Badge de destaque do plano da empresa */}
        {user.plano && (
          <span className={`mb-2 px-3 py-1 rounded-full text-xs font-semibold border block
            ${user.plano === 'empresarial' ? 'bg-orange-100 text-orange-700 border-orange-300' :
              user.plano === 'premium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
              user.plano === 'basico' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              'bg-gray-100 text-gray-500 border-gray-300'}`}
          >
            {user.plano === 'empresarial' ? 'Empresa Empresarial' :
              user.plano === 'premium' ? 'Empresa Premium' :
              user.plano === 'basico' ? 'Empresa em Destaque' :
              'Empresa Básica'}
            <span className="ml-2 text-green-600 font-bold">• Ativo</span>
          </span>
        )}
        
        <h1 className="text-3xl font-extrabold text-blue-800 mb-1 text-center tracking-tight">{formData.nome || user.nome || 'Empresa'}</h1>
        <p className="text-gray-500 text-center mb-6 text-lg font-medium">{formData.descricao || 'Perfil da sua empresa. Edite suas informações aqui.'}</p>
        
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-700"><span className="text-blue-600 text-xl">🏢</span> <span className="font-semibold">Setor:</span> {formData.setor || 'N/D'}</div>
          <div className="flex items-center gap-2 text-gray-700"><span className="text-green-600 text-xl">👥</span> <span className="font-semibold">Funcionários:</span> {formData.tamanho || 'N/D'}</div>
          <div className="flex items-center gap-2 text-gray-700"><span className="text-purple-600 text-xl">📍</span> <span className="font-semibold">Localização:</span> {formData.endereco || 'N/D'}</div>
          <div className="flex items-center gap-2 text-gray-700"><span className="text-yellow-600 text-xl">📅</span> <span className="font-semibold">Fundada em:</span> {formData.anoFundacao || 'N/D'}</div>
          <div className="flex items-center gap-2 text-gray-700 col-span-1 sm:col-span-2"><span className="text-indigo-600 text-xl">🌐</span> <span className="font-semibold">Website:</span> <a href={`https://${formData.website || 'www.suaempresa.co.mz'}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 break-all hover:text-blue-900 transition">{formData.website || 'www.suaempresa.co.mz'}</a></div>
            </div>
        
            <button
              onClick={() => setEditando(true)}
              className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition w-full sm:w-auto text-lg"
            >
              ✏️ Editar Perfil
            </button>
        
        {/* Botão de excluir conta */}
            <div className="w-full flex justify-end mt-4">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
              >
                Excluir Conta
              </button>
            </div>
          </div>
        </div>
  )

  // Upload de logo
  const fileInputRef = useRef();
  const [logoFileName, setLogoFileName] = useState('');

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData({ ...formData, logo: ev.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  // Formulário de edição
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-4 md:p-8 space-y-6 md:space-y-8 max-w-3xl mx-auto w-full border border-blue-100">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-3 flex flex-col items-center gap-2">
          {formData.logo ? (
            <img
              src={formData.logo}
              alt="Logo da empresa"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-5xl text-blue-700 font-extrabold select-none">
                {(formData.nome || user.nome || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleLogoChange}
            className="hidden"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition text-sm"
            >
              {formData.logo ? 'Trocar logo' : 'Carregar logo'}
            </button>
            {formData.logo && (
              <button
                type="button"
                onClick={() => { setFormData({ ...formData, logo: '' }); setLogoFileName(''); }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-red-700 transition text-sm"
              >
                Remover
              </button>
            )}
          </div>
          {logoFileName && (
            <div className="text-xs text-gray-500 mt-1">{logoFileName}</div>
          )}
        </div>
      </div>
      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Nome Fantasia *</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Razão Social</label>
              <input type="text" name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">NUIT</label>
              <input type="text" name="nuit" value={formData.nuit} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">E-mail *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Telefone</label>
              <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Endereço</label>
              <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-base font-semibold text-gray-700 mb-2">Descrição</label>
          <textarea name="descricao" value={formData.descricao} onChange={handleChange} className="w-full p-3 md:p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg resize-none" rows={3} placeholder="Descreva sua empresa..." />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Setor</label>
          <input type="text" name="setor" value={formData.setor} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="Ex: Tecnologia, Saúde, Educação..." />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Número de Funcionários</label>
          <input type="text" name="tamanho" value={formData.tamanho} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="Ex: 10-50, 50-100..." />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Website</label>
          <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="www.suaempresa.co.mz" />
        </div>
        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Alvará</label>
          <input type="text" name="alvara" value={formData.alvara} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Registro Comercial</label>
              <input type="text" name="registroComercial" value={formData.registroComercial} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Inscrição Fiscal</label>
              <input type="text" name="inscricaoFiscal" value={formData.inscricaoFiscal} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">Ano de Fundação</label>
          <input type="text" name="anoFundacao" value={formData.anoFundacao} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="Ex: 2020" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Capital Social</label>
              <input type="text" name="capitalSocial" value={formData.capitalSocial} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">Moeda do Capital</label>
          <select name="moedaCapital" value={formData.moedaCapital} onChange={handleChange} className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg">
            <option value="MT">Meticais (MT)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition text-lg disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-400 transition text-lg"
        >
          Cancelar
        </button>
      </div>
    </form>
  )

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value ?? '',
    })
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setIsLoading(true);
    
    console.log('=== DEBUG: PerfilEmpresa - Enviando dados ===');
    console.log('Dados do formulário:', JSON.stringify(formData, null, 2));
    console.log('Usuário atual:', user);
    
    try {
      // Usar a função updateProfile do contexto de autenticação
      console.log('Chamando updateProfile...');
      const result = await updateProfile(formData);
      console.log('Resultado da atualização:', result);
      
      setSucesso('Perfil da empresa atualizado com sucesso!');
      setEditando(false);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      console.error('Erro na atualização:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      if (error.response && error.response.data && error.response.data.error) {
        setErro(error.response.data.error);
      } else {
        setErro('Erro ao atualizar perfil. Tente novamente.');
      }
      setTimeout(() => setErro(''), 4000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl w-full mx-auto py-6 px-4 pb-24 md:pb-6 min-h-screen">
      {/* Notificações */}
      {sucesso && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">✅ {sucesso}</p>
            </div>
            <div className="ml-auto pl-3">
              <button onClick={() => setSucesso('')} className="text-green-100 hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {erro && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">❌ {erro}</p>
            </div>
            <div className="ml-auto pl-3">
              <button onClick={() => setErro('')} className="text-red-100 hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500 text-lg text-center px-4">Carregando...</div>
        </div>
      ) : !editando ? (
        <>
          <div className="mb-8">
            {renderCard()}
          </div>
          
          {/* Modal de confirmação de exclusão */}
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir Conta">
            <div className="space-y-4">
              {!deleting ? (
                <>
                  <p className="text-red-700 font-semibold">Tem certeza que deseja excluir sua conta? Esta ação é irreversível.</p>
                  <div className="flex gap-4 justify-end">
                    <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button
                      onClick={async () => {
                        setDeleting(true);
                        setProgress(0);
                        
                        try {
                          // Simular progresso
                        let pct = 0;
                        const interval = setInterval(() => {
                            pct += 10;
                          setProgress(pct);
                            if (pct >= 90) {
                            clearInterval(interval);
                            }
                          }, 100);
                          
                          // Chamar função real de exclusão
                          await deleteAccount();
                          
                          // Completar progresso
                          setProgress(100);
                          
                          // Aguardar um pouco e redirecionar
                          setTimeout(() => {
                            navigate('/');
                            window.location.reload();
                          }, 1000);
                          
                        } catch (error) {
                          console.error('Erro ao excluir conta:', error);
                          setErro(error.response?.data?.error || 'Erro ao excluir conta');
                          setDeleting(false);
                          setProgress(0);
                          setTimeout(() => setErro(''), 5000);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <span className="text-6xl animate-bounce">😭</span>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-red-500 h-4 rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-gray-700 font-semibold">
                    Excluindo sua conta... ({progress}%)<br/>
                    Sentiremos sua falta!
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </>
      ) : renderForm()}
    </div>
  )
} 