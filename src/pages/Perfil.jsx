import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useMonetizacao } from '../context/MonetizacaoContext';
import NotificacoesSwitch from '../components/NotificacoesSwitch';
import api from '../services/api'

export default function Perfil() {
  const { user, updateProfile } = useAuth()
  const { assinatura, planosCandidato } = useMonetizacao();
  const { id } = useParams()
  const navigate = useNavigate();
  const [secaoAtiva, setSecaoAtiva] = useState('pessoal')
  const [editando, setEditando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [formData, setFormData] = useState({
    // Informações pessoais
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.perfil?.telefone || '',
    dataNascimento: user?.perfil?.dataNascimento || '',
    endereco: user?.perfil?.endereco || '',
    bio: user?.perfil?.bio || '',
    
    // Informações profissionais
    formacao: user?.perfil?.formacao || '',
    instituicao: user?.perfil?.instituicao || '',
    experiencia: user?.perfil?.experiencia || '',
    habilidades: Array.isArray(user?.perfil?.habilidades) ? user.perfil.habilidades.join(', ') : '',
    resumo: user?.perfil?.resumo || '',
    
    // Redes sociais
    linkedin: user?.perfil?.linkedin || '',
    github: user?.perfil?.github || '',
    portfolio: user?.perfil?.portfolio || '',
    behance: user?.perfil?.behance || '',
    instagram: user?.perfil?.instagram || '',
    twitter: user?.perfil?.twitter || '',
    
    // Preferências
    tipoTrabalho: user?.perfil?.tipoTrabalho || 'remoto',
    faixaSalarial: user?.perfil?.faixaSalarial || '15000-25000',
    localizacaoPreferida: user?.perfil?.localizacaoPreferida || 'Maputo',
    disponibilidade: user?.perfil?.disponibilidade || 'imediata',
    
    // CV
    cv: user?.perfil?.cv || '',
    
    // Privacidade
    perfilPublico: user?.perfil?.perfilPublico !== undefined ? user.perfil.perfilPublico : true,
    mostrarTelefone: user?.perfil?.mostrarTelefone !== undefined ? user.perfil.mostrarTelefone : false,
    mostrarEndereco: user?.perfil?.mostrarEndereco !== undefined ? user.perfil.mostrarEndereco : false,
    
    // Notificações
    alertasVagas: user?.perfil?.alertasVagas !== undefined ? user.perfil.alertasVagas : true,
    frequenciaAlertas: user?.perfil?.frequenciaAlertas || 'diario',
    vagasInteresse: user?.perfil?.vagasInteresse || ['desenvolvedor', 'frontend', 'react'],
    foto: user?.perfil?.foto || '',
  })

  // Atualizar formData e idiomas quando user mudar
  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.perfil?.telefone || '',
        dataNascimento: user.perfil?.dataNascimento || '',
        endereco: user.perfil?.endereco || '',
        bio: user.perfil?.bio || '',
        formacao: user.perfil?.formacao || '',
        instituicao: user.perfil?.instituicao || '',
        experiencia: user.perfil?.experiencia || '',
        habilidades: Array.isArray(user.perfil?.habilidades) ? user.perfil.habilidades.join(', ') : '',
        resumo: user.perfil?.resumo || '',
        linkedin: user.perfil?.linkedin || '',
        github: user.perfil?.github || '',
        portfolio: user.perfil?.portfolio || '',
        behance: user.perfil?.behance || '',
        instagram: user.perfil?.instagram || '',
        twitter: user.perfil?.twitter || '',
        tipoTrabalho: user.perfil?.tipoTrabalho || 'remoto',
        faixaSalarial: user.perfil?.faixaSalarial || '15000-25000',
        localizacaoPreferida: user.perfil?.localizacaoPreferida || 'Maputo',
        disponibilidade: user.perfil?.disponibilidade || 'imediata',
        cv: user.perfil?.cv || '',
        perfilPublico: user.perfil?.perfilPublico !== undefined ? user.perfil.perfilPublico : true,
        mostrarTelefone: user.perfil?.mostrarTelefone !== undefined ? user.perfil.mostrarTelefone : false,
        mostrarEndereco: user.perfil?.mostrarEndereco !== undefined ? user.perfil.mostrarEndereco : false,
        alertasVagas: user.perfil?.alertasVagas !== undefined ? user.perfil.alertasVagas : true,
        frequenciaAlertas: user.perfil?.frequenciaAlertas || 'diario',
        vagasInteresse: user.perfil?.vagasInteresse || ['desenvolvedor', 'frontend', 'react'],
        foto: user.perfil?.foto || '',
      });
      setIdiomas(Array.isArray(user.perfil?.idiomas) ? user.perfil.idiomas : []);
    }
  }, [user]);

  // Dados mockados para certificações
  const [certificacoes, setCertificacoes] = useState([
    { id: 1, nome: 'React Developer', instituicao: 'Meta', data: '2023-06-15', link: 'https://example.com' },
    { id: 2, nome: 'JavaScript ES6+', instituicao: 'Udemy', data: '2023-03-20', link: 'https://example.com' }
  ])

  // Dados mockados para idiomas
  const [idiomas, setIdiomas] = useState(Array.isArray(user?.perfil?.idiomas) ? user.perfil.idiomas : []);
  // Corrigir: adicionar useState para novoIdioma
  const [novoIdioma, setNovoIdioma] = useState({ idioma: '', nivel: 'básico' });

  // Dados mockados para projetos
  const [projetos, setProjetos] = useState([
    { 
      id: 1, 
      nome: 'E-commerce React', 
      descricao: 'Plataforma completa de e-commerce com React e Node.js',
      tecnologias: ['React', 'Node.js', 'MongoDB'],
      link: 'https://github.com/joaosilva/ecommerce',
      imagem: '/nevu.png' // Substituir placeholder
    },
    { 
      id: 2, 
      nome: 'App de Finanças', 
      descricao: 'Aplicativo para controle de finanças pessoais',
      tecnologias: ['React Native', 'Firebase'],
      link: 'https://github.com/joaosilva/financas',
      imagem: '/nevu.png' // Substituir placeholder
    }
  ])

  // Dados mockados para estatísticas
  const [estatisticas] = useState({
    candidaturas: { total: 8, esteMes: 3, aprovadas: 2 },
    entrevistas: { total: 3, agendadas: 1, realizadas: 2 },
    vagasSalvas: 5,
    visualizacoes: 12
  })

  // Mock de busca por id
  const mockUsuarios = {
    '1': { nome: 'João Silva', email: 'joao@email.com', tipo: 'candidato' },
    '2': { nome: 'Maria Santos', email: 'maria@email.com', tipo: 'candidato' },
    '3': { nome: 'Pedro Costa', email: 'pedro@email.com', tipo: 'candidato' }
  }
  const usuarioExibido = id ? mockUsuarios[id] : null;

  // Estados para modais de adição
  const [modalCert, setModalCert] = useState(false)
  const [modalIdioma, setModalIdioma] = useState(false)
  const [modalProjeto, setModalProjeto] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos formulários
  const [novaCert, setNovaCert] = useState({ nome: '', instituicao: '', data: '', link: '', arquivo: null, arquivoUrl: '' })
  const [novoProjeto, setNovoProjeto] = useState({ nome: '', descricao: '', tecnologias: '', link: '', imagem: '', imagemFile: null, imagemUrl: '' })

  // Funções para adicionar
  const adicionarCertificacao = () => {
    setCertificacoes(prev => [
      ...prev,
      { id: Date.now(), ...novaCert, arquivo: novaCert.arquivoUrl || '' }
    ])
    setNovaCert({ nome: '', instituicao: '', data: '', link: '', arquivo: null, arquivoUrl: '' })
    setModalCert(false)
  }
  const adicionarIdioma = () => {
    if (!novoIdioma.idioma) return;
    const novos = [...idiomas, { ...novoIdioma, id: Date.now() }];
    setIdiomas(novos);
    setNovoIdioma({ idioma: '', nivel: 'básico' });
  }
  const adicionarProjeto = () => {
    setProjetos(prev => [
      ...prev,
      { id: Date.now(), ...novoProjeto, tecnologias: novoProjeto.tecnologias.split(',').map(t => t.trim()), imagem: novoProjeto.imagemUrl || novoProjeto.imagem }
    ])
    setNovoProjeto({ nome: '', descricao: '', tecnologias: '', link: '', imagem: '', imagemFile: null, imagemUrl: '' })
    setModalProjeto(false)
  }

  // Remover idioma
  function removerIdioma(id) {
    setIdiomas(idiomas.filter(i => i.id !== id));
  }

  // Remover foto
  function removerFoto() {
    setFormData({ ...formData, foto: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setIsLoading(true);
    try {
      // Estruturar dados para o backend
      const dadosParaEnviar = {
        nome: formData.nome,
        email: formData.email,
        perfil: {
          telefone: formData.telefone,
          dataNascimento: formData.dataNascimento,
          endereco: formData.endereco,
          bio: formData.bio,
          formacao: formData.formacao,
          instituicao: formData.instituicao,
          experiencia: formData.experiencia,
          habilidades: formData.habilidades ? formData.habilidades.split(',').map(h => h.trim()) : [],
          linkedin: formData.linkedin,
          github: formData.github,
          portfolio: formData.portfolio,
          behance: formData.behance,
          instagram: formData.instagram,
          twitter: formData.twitter,
          tipoTrabalho: formData.tipoTrabalho,
          faixaSalarial: formData.faixaSalarial,
          localizacaoPreferida: formData.localizacaoPreferida,
          disponibilidade: formData.disponibilidade,
          cv: formData.cv,
          perfilPublico: formData.perfilPublico,
          mostrarTelefone: formData.mostrarTelefone,
          mostrarEndereco: formData.mostrarEndereco,
          alertasVagas: formData.alertasVagas,
          frequenciaAlertas: formData.frequenciaAlertas,
          vagasInteresse: Array.isArray(formData.vagasInteresse) ? formData.vagasInteresse : formData.vagasInteresse.split(',').map(v => v.trim()),
          foto: formData.foto,
          idiomas: idiomas,
          // Campos adicionais para garantir que tudo seja salvo
          resumo: formData.resumo,
          certificacoes: certificacoes,
          projetos: projetos
        }
      };

      console.log('Dados sendo enviados:', dadosParaEnviar);

      const response = await api.put(`/users/${user.id}`, dadosParaEnviar);
      const userAtualizado = response.data;
      
      // Atualizar o contexto de autenticação
      updateProfile(userAtualizado);
      
      setSucesso('Perfil atualizado com sucesso!');
      setEditando(false);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      alert(`Currículo "${file.name}" enviado com sucesso! (Funcionalidade mockada)`)
    }
  }

  function handleFotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      // Verificar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErro('Formato não suportado. Use apenas JPG, PNG ou WebP.');
        setTimeout(() => setErro(''), 4000);
        return;
      }

      // Limite aumentado para 200MB como solicitado
      const maxSize = 200 * 1024 * 1024; // 200MB
      if (file.size > maxSize) {
        setErro('A foto é muito grande. Escolha uma imagem de até 200MB.');
        setTimeout(() => setErro(''), 4000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        // Comprimir a imagem antes de salvar
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Definir tamanho máximo (400x400px para perfil)
          const maxWidth = 400;
          const maxHeight = 400;
          let { width, height } = img;
          
          // Calcular proporções
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para base64 com qualidade 0.8
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          setFormData({ ...formData, foto: compressedImage });
          setSucesso('Foto de perfil atualizada e otimizada!');
        setTimeout(() => setSucesso(''), 2500);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Definir o array de idiomas disponíveis no início do componente Perfil
  const idiomasDisponiveis = [
    'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Mandarim', 'Árabe', 'Russo', 'Japonês', 'Outro'
  ];

  // Definir os níveis de idioma disponíveis
  const niveis = ['básico', 'intermediário', 'avançado', 'fluente', 'nativo'];

  // Se não houver usuário logado, mostrar mensagem de acesso restrito
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg text-center px-4">Você precisa estar logado para acessar o perfil.</div>
      </div>
    )
  }

  const renderSecaoPessoal = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800">Informações Pessoais</h2>
          {/* Badge de destaque do plano */}
          {assinatura && user?.tipo === 'usuario' && (
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2
              ${assinatura.plano === 'premium' ? 'bg-yellow-400 text-white border-yellow-500' :
                assinatura.plano === 'basico' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                'bg-gray-100 text-gray-500 border-gray-300'}`}
            >
              {assinatura.plano === 'premium' ? 'Perfil Premium' :
                assinatura.plano === 'basico' ? 'Perfil em Destaque' :
                'Perfil Gratuito'}
              <span className="ml-2 text-green-600 font-bold">• Ativo</span>
            </span>
          )}
        </div>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm mt-2 sm:mt-0"
        >
            Editar
        </button>
        )}
      </div>
      
      {sucesso && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {sucesso}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <img
            src={formData.foto || user.perfil?.foto || '/nevu.png'}
            alt="Foto de perfil"
            className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 shadow"
          />
          {editando && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Foto de Perfil
                </label>
                <input 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/webp" 
                  onChange={handleFotoChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
                    </svg>
                    <span className="font-medium">Requisitos:</span>
                  </div>
                  <ul className="text-xs space-y-0.5 ml-4">
                    <li>• Formatos: JPG, PNG, WebP</li>
                    <li>• Tamanho máximo: 200MB</li>
                    <li>• Será redimensionada automaticamente</li>
                  </ul>
                </div>
              </div>
              {formData.foto && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Foto selecionada
                  </span>
                  <button 
                    type="button" 
                    onClick={removerFoto} 
                    className="text-red-600 text-xs underline hover:text-red-800 transition"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
            <input
              type="date"
              name="dataNascimento"
              value={formData.dataNascimento ? new Date(formData.dataNascimento).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>


      </div>
    </div>
  )

  const renderSecaoProfissional = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Informações Profissionais</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formação</label>
            <input
              type="text"
              name="formacao"
              value={formData.formacao}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instituição</label>
            <input
              type="text"
              name="instituicao"
              value={formData.instituicao}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experiência</label>
            <input
              type="text"
              name="experiencia"
              value={formData.experiencia}
              onChange={handleChange}
              disabled={!editando}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Habilidades</label>
          <input
            type="text"
            name="habilidades"
            value={formData.habilidades}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Ex: React, JavaScript, TypeScript, Node.js"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Resumo Profissional</label>
          <textarea
            name="resumo"
            value={formData.resumo}
            onChange={handleChange}
            disabled={!editando}
            rows={4}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  )

  const renderSecaoCurriculo = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">CV</h2>
        <button
          onClick={() => document.getElementById('curriculo-upload').click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Atualizar CV
        </button>
      </div>
      
      <input
        id="curriculo-upload"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 mb-2">CV atual: {formData.cv}</p>
        <div className="flex gap-2 justify-center">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm">
            Visualizar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
            Baixar
          </button>
        </div>
      </div>
    </div>
  )

  const renderSecaoRedesSociais = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Redes Sociais</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
          <input
            type="url"
            name="github"
            value={formData.github}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Portfólio</label>
          <input
            type="url"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Behance</label>
          <input
            type="url"
            name="behance"
            value={formData.behance}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
          <input
            type="text"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X</label>
          <input
            type="text"
            name="twitter"
            value={formData.twitter}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  )

  const renderSecaoPreferencias = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Preferências de Trabalho</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Trabalho</label>
          <select
            name="tipoTrabalho"
            value={formData.tipoTrabalho}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>
        {/* Campo de faixa salarial removido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Localização Preferida</label>
          <input
            type="text"
            name="localizacaoPreferida"
            value={formData.localizacaoPreferida}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidade</label>
          <select
            name="disponibilidade"
            value={formData.disponibilidade}
            onChange={handleChange}
            disabled={!editando}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="imediata">Imediata</option>
            <option value="15dias">15 dias</option>
            <option value="30dias">30 dias</option>
            <option value="60dias">60 dias</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderSecaoCertificacoes = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Certificações</h2>
        <button
          onClick={() => setModalCert(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Adicionar
        </button>
      </div>
      {/* Modal de adicionar certificação */}
      <Modal isOpen={modalCert} onClose={() => setModalCert(false)} title="Adicionar Certificação">
        <div className="space-y-3">
          <input type="text" placeholder="Nome da Certificação" value={novaCert.nome} onChange={e => setNovaCert(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Instituição" value={novaCert.instituicao} onChange={e => setNovaCert(v => ({...v, instituicao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link (opcional)" value={novaCert.link} onChange={e => setNovaCert(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Anexar Certificado (PDF/JPG/PNG)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setNovaCert(v => ({...v, arquivo: file, arquivoUrl: url}))
              }
            }} />
            {novaCert.arquivoUrl && (
              <div className="mt-1 text-xs text-green-700">Arquivo selecionado: {novaCert.arquivo?.name || 'visualizar'} <a href={novaCert.arquivoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalCert(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={adicionarCertificacao} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>
      <div className="space-y-4">
        {Array.isArray(certificacoes) && certificacoes.map((cert) => (
          <div key={cert.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{cert.nome}</h3>
                <p className="text-sm text-gray-600">{cert.instituicao}</p>
                {cert.link && <a href={cert.link} className="text-blue-600 underline text-xs" target="_blank" rel="noopener noreferrer">Ver certificado</a>}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">
                  Verificar
                </button>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSecaoIdiomas = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Idiomas</h2>
        <button
          onClick={() => setModalIdioma(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Adicionar
        </button>
      </div>
      {/* Modal de adicionar idioma */}
      <Modal isOpen={modalIdioma} onClose={() => setModalIdioma(false)} title="Adicionar Idioma">
        <div className="space-y-3">
          <select
            value={novoIdioma.idioma}
            onChange={e => setNovoIdioma(v => ({...v, idioma: e.target.value}))}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione o idioma</option>
                          {Array.isArray(idiomasDisponiveis) && idiomasDisponiveis.map(idioma => (
                <option key={idioma} value={idioma}>{idioma}</option>
              ))}
          </select>
          <select value={novoIdioma.nivel} onChange={e => setNovoIdioma(v => ({...v, nivel: e.target.value}))} className="w-full p-2 border rounded">
            <option value="básico">Básico</option>
            <option value="intermediário">Intermediário</option>
            <option value="avançado">Avançado</option>
            <option value="nativo">Nativo</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalIdioma(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={adicionarIdioma} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Idiomas</h2>
        {/* Substituir a lista de idiomas adicionados por uma visualização mais "viva": */}
        <ul className="flex flex-wrap gap-3 mb-2">
          {Array.isArray(idiomas) && idiomas.map(i => (
            <li key={i.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-blue-600 text-lg mr-1">🌐</span>
              <span className="font-semibold text-gray-800">{i.idioma}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                i.nivel === 'básico' ? 'bg-gray-200 text-gray-700' :
                i.nivel === 'intermediário' ? 'bg-yellow-100 text-yellow-800' :
                i.nivel === 'avançado' ? 'bg-blue-100 text-blue-700' :
                i.nivel === 'fluente' ? 'bg-green-100 text-green-700' :
                i.nivel === 'nativo' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {i.nivel.charAt(0).toUpperCase() + i.nivel.slice(1)}
              </span>
              {editando && (
                <button type="button" onClick={() => removerIdioma(i.id)} className="ml-2 text-red-500 text-xs hover:text-red-700 transition" title="Remover">
                  ✖
                </button>
              )}
            </li>
          ))}
        </ul>
        {editando && (
          <div className="flex gap-2 items-end">
            <select
              value={novoIdioma.idioma}
              onChange={e => setNovoIdioma({ ...novoIdioma, idioma: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">Selecione o idioma</option>
              {Array.isArray(idiomasDisponiveis) && idiomasDisponiveis.map(idioma => (
                <option key={idioma} value={idioma}>{idioma}</option>
              ))}
            </select>
            <select
              value={novoIdioma.nivel}
              onChange={e => setNovoIdioma({ ...novoIdioma, nivel: e.target.value })}
              className="border p-2 rounded"
            >
              {Array.isArray(niveis) && niveis.map(nivel => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
            </select>
            <button type="button" onClick={adicionarIdioma} className="bg-blue-600 text-white px-3 py-1 rounded">Adicionar</button>
          </div>
        )}
      </div>
    </div>
  )

  const renderSecaoProjetos = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Projetos</h2>
        <button
          onClick={() => setModalProjeto(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Adicionar
        </button>
      </div>
      {/* Modal de adicionar projeto */}
      <Modal isOpen={modalProjeto} onClose={() => setModalProjeto(false)} title="Adicionar Projeto">
        <div className="space-y-3">
          <input type="text" placeholder="Nome do Projeto" value={novoProjeto.nome} onChange={e => setNovoProjeto(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <textarea placeholder="Descrição" value={novoProjeto.descricao} onChange={e => setNovoProjeto(v => ({...v, descricao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Tecnologias (separadas por vírgula)" value={novoProjeto.tecnologias} onChange={e => setNovoProjeto(v => ({...v, tecnologias: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link do Projeto" value={novoProjeto.link} onChange={e => setNovoProjeto(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Imagem do Projeto (JPG/PNG)</label>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setNovoProjeto(v => ({...v, imagemFile: file, imagemUrl: url}))
              }
            }} />
            {novoProjeto.imagemUrl && (
              <div className="mt-1 text-xs text-green-700">Imagem selecionada: {novoProjeto.imagemFile?.name || 'visualizar'} <a href={novoProjeto.imagemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalProjeto(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={adicionarProjeto} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>
      <div className="grid md:grid-cols-2 gap-6">
        {Array.isArray(projetos) && projetos.map((projeto) => (
          <div key={projeto.id} className="border rounded-lg overflow-hidden">
            <img src={projeto.imagem} alt={projeto.nome} className="w-full h-32 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{projeto.nome}</h3>
              <p className="text-sm text-gray-600 mb-3">{projeto.descricao}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {Array.isArray(projeto.tecnologias) && projeto.tecnologias.map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">
                  Ver Projeto
                </button>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSecaoEstatisticas = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Estatísticas</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{estatisticas.candidaturas.total}</div>
          <div className="text-sm text-gray-600">Candidaturas</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{estatisticas.entrevistas.total}</div>
          <div className="text-sm text-gray-600">Entrevistas</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{estatisticas.vagasSalvas}</div>
          <div className="text-sm text-gray-600">Vagas Salvas</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{estatisticas.visualizacoes}</div>
          <div className="text-sm text-gray-600">Visualizações</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Candidaturas este mês</span>
          <span className="font-semibold">{estatisticas.candidaturas.esteMes}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Candidaturas aprovadas</span>
          <span className="font-semibold text-green-600">{estatisticas.candidaturas.aprovadas}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Entrevistas agendadas</span>
          <span className="font-semibold text-blue-600">{estatisticas.entrevistas.agendadas}</span>
        </div>
      </div>
    </div>
  )

  const isPlanoPago = assinatura?.plano === 'basico' || assinatura?.plano === 'premium';
  const renderSecaoNotificacoes = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações</h3>
      <NotificacoesSwitch />
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Alertas de vagas</h3>
            <p className="text-sm text-gray-600">Receber notificações de novas vagas</p>
          </div>
            <input
              type="checkbox"
              checked={formData.alertasVagas}
            onChange={e => setFormData({...formData, alertasVagas: e.target.checked})}
            className="w-5 h-5"
            disabled={!isPlanoPago}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de alertas</label>
          <select
            name="frequenciaAlertas"
            value={formData.frequenciaAlertas}
            onChange={handleChange}
            disabled={!isPlanoPago}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Palavras-chave de interesse</label>
          <input
            type="text"
            name="vagasInteresse"
            value={Array.isArray(formData.vagasInteresse) ? formData.vagasInteresse.join(', ') : ''}
            onChange={e => setFormData({...formData, vagasInteresse: e.target.value.split(', ')})}
            disabled={!isPlanoPago}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Ex: desenvolvedor, frontend, react"
          />
        </div>
      </div>
    </div>
  );

  const renderSecaoPrivacidade = () => (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Privacidade</h2>
        {!editando && (
        <button
            onClick={() => setEditando(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
            Editar
        </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Perfil público</h3>
            <p className="text-sm text-gray-600">Permitir que empresas vejam seu perfil</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.perfilPublico}
              onChange={(e) => setFormData({...formData, perfilPublico: e.target.checked})}
              disabled={!editando}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Mostrar telefone</h3>
            <p className="text-sm text-gray-600">Exibir telefone no perfil público</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.mostrarTelefone}
              onChange={(e) => setFormData({...formData, mostrarTelefone: e.target.checked})}
              disabled={!editando}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Mostrar endereço</h3>
            <p className="text-sm text-gray-600">Exibir endereço no perfil público</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.mostrarEndereco}
              onChange={(e) => setFormData({...formData, mostrarEndereco: e.target.checked})}
              disabled={!editando}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl w-full mx-auto min-h-screen py-8 px-4 pb-32 overflow-x-hidden">
      {id && usuarioExibido && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded text-center">
          <strong>Perfil de outro usuário:</strong><br/>
          Nome: {usuarioExibido.nome}<br/>
          Email: {usuarioExibido.email}<br/>
          Tipo: {usuarioExibido.tipo}
        </div>
      )}
      {id && !usuarioExibido && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded text-center">
          Usuário não encontrado!
        </div>
      )}
      
      {/* Foto de perfil */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          {formData.foto || user.perfil?.foto ? (
          <img
              src={formData.foto || user.perfil?.foto}
            alt="Foto de perfil"
            className="w-28 h-28 rounded-full object-cover border-4 border-blue-200 shadow"
          />
          ) : (
            <div className="w-28 h-28 rounded-full bg-blue-200 flex items-center justify-center border-4 border-blue-200 shadow">
              <span className="text-4xl font-bold text-blue-800 select-none">
                {formData.nome
                  ? formData.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
                  : 'U'}
              </span>
            </div>
          )}
          <button
            onClick={() => navigate('/em-producao')}
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
            title="Trocar foto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4zM7 17h.01M7 17a4 4 0 005.657 0M7 17a4 4 0 010-5.657M7 17H5a2 2 0 01-2-2v-2a2 2 0 012-2h2m0 0a4 4 0 015.657 0m0 0a4 4 0 010 5.657" /></svg>
          </button>
        </div>
        <div className="mt-2 text-lg font-semibold text-blue-700">{formData.nome}</div>
        <div className="text-gray-500 text-sm">{formData.email}</div>
      </div>

      {/* Botões de navegação */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSecaoAtiva('pessoal')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'pessoal' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pessoal
        </button>
        <button
          onClick={() => setSecaoAtiva('profissional')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'profissional' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Profissional
        </button>
        <button
          onClick={() => setSecaoAtiva('curriculo')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'curriculo' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          CV
        </button>
        <button
          onClick={() => setSecaoAtiva('redes')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'redes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Redes Sociais
        </button>
        <button
          onClick={() => setSecaoAtiva('preferencias')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'preferencias' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Preferências
        </button>
        <button
          onClick={() => setSecaoAtiva('certificacoes')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'certificacoes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Certificações
        </button>
        <button
          onClick={() => setSecaoAtiva('idiomas')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'idiomas' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Idiomas
        </button>
        <button
          onClick={() => setSecaoAtiva('projetos')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'projetos' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Projetos
        </button>
        <button
          onClick={() => setSecaoAtiva('estatisticas')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'estatisticas' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Estatísticas
        </button>
        <button
          onClick={() => setSecaoAtiva('notificacoes')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'notificacoes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Notificações
        </button>
        <button
          onClick={() => setSecaoAtiva('privacidade')}
          className={`px-4 py-2 rounded-lg transition ${
            secaoAtiva === 'privacidade' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Privacidade
        </button>
      </div>

      {/* Formulário único para todas as seções */}
      <form onSubmit={handleSubmit} className="space-y-8">
      {/* Conteúdo da seção ativa */}
      <div className="mb-8">
        {secaoAtiva === 'pessoal' && renderSecaoPessoal()}
        {secaoAtiva === 'profissional' && renderSecaoProfissional()}
        {secaoAtiva === 'curriculo' && renderSecaoCurriculo()}
        {secaoAtiva === 'redes' && renderSecaoRedesSociais()}
        {secaoAtiva === 'preferencias' && renderSecaoPreferencias()}
        {secaoAtiva === 'certificacoes' && renderSecaoCertificacoes()}
        {secaoAtiva === 'idiomas' && renderSecaoIdiomas()}
        {secaoAtiva === 'projetos' && renderSecaoProjetos()}
        {secaoAtiva === 'estatisticas' && renderSecaoEstatisticas()}
        {secaoAtiva === 'notificacoes' && renderSecaoNotificacoes()}
        {secaoAtiva === 'privacidade' && renderSecaoPrivacidade()}
      </div>

        {/* Botões de ação globais */}
        {editando && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <div className="flex gap-4 items-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold ${
                  isLoading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar Alterações
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg transition font-semibold ${
                  isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Botão de excluir conta - mover para o final */}
      <div className="flex justify-end mb-8 mt-8">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
        >
          Excluir Conta
        </button>
      </div>
      
      {/* Modais */}
      <Modal isOpen={modalCert} onClose={() => setModalCert(false)} title="Adicionar Certificação">
        <div className="space-y-3">
          <input type="text" placeholder="Nome da Certificação" value={novaCert.nome} onChange={e => setNovaCert(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Instituição" value={novaCert.instituicao} onChange={e => setNovaCert(v => ({...v, instituicao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link (opcional)" value={novaCert.link} onChange={e => setNovaCert(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Anexar Certificado (PDF/JPG/PNG)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setNovaCert(v => ({...v, arquivo: file, arquivoUrl: url}))
              }
            }} />
            {novaCert.arquivoUrl && (
              <div className="mt-1 text-xs text-green-700">Arquivo selecionado: {novaCert.arquivo?.name || 'visualizar'} <a href={novaCert.arquivoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalCert(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={adicionarCertificacao} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalIdioma} onClose={() => setModalIdioma(false)} title="Adicionar Idioma">
        <div className="space-y-3">
          <select
            value={novoIdioma.idioma}
            onChange={e => setNovoIdioma(v => ({...v, idioma: e.target.value}))}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione o idioma</option>
            {Array.isArray(idiomasDisponiveis) && idiomasDisponiveis.map(idioma => (
              <option key={idioma} value={idioma}>{idioma}</option>
            ))}
          </select>
          <select value={novoIdioma.nivel} onChange={e => setNovoIdioma(v => ({...v, nivel: e.target.value}))} className="w-full p-2 border rounded">
            <option value="básico">Básico</option>
            <option value="intermediário">Intermediário</option>
            <option value="avançado">Avançado</option>
            <option value="nativo">Nativo</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalIdioma(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={adicionarIdioma} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalProjeto} onClose={() => setModalProjeto(false)} title="Adicionar Projeto">
        <div className="space-y-3">
          <input type="text" placeholder="Nome do Projeto" value={novoProjeto.nome} onChange={e => setNovoProjeto(v => ({...v, nome: e.target.value}))} className="w-full p-2 border rounded" />
          <textarea placeholder="Descrição" value={novoProjeto.descricao} onChange={e => setNovoProjeto(v => ({...v, descricao: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Tecnologias (separadas por vírgula)" value={novoProjeto.tecnologias} onChange={e => setNovoProjeto(v => ({...v, tecnologias: e.target.value}))} className="w-full p-2 border rounded" />
          <input type="url" placeholder="Link do Projeto" value={novoProjeto.link} onChange={e => setNovoProjeto(v => ({...v, link: e.target.value}))} className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm mb-1">Imagem do Projeto (JPG/PNG)</label>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setNovoProjeto(v => ({...v, imagemFile: file, imagemUrl: url}))
              }
            }} />
            {novoProjeto.imagemUrl && (
              <div className="mt-1 text-xs text-green-700">Imagem selecionada: {novoProjeto.imagemFile?.name || 'visualizar'} <a href={novoProjeto.imagemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver</a></div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalProjeto(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={adicionarProjeto} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar</button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir Conta">
        <div className="space-y-4">
          {!deleting ? (
            <>
              <p className="text-red-700 font-semibold">Tem certeza que deseja excluir sua conta? Esta ação é irreversível.</p>
              <div className="flex gap-4 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button
                  onClick={() => {
                    setDeleting(true);
                    setProgress(0);
                    let pct = 0;
                    const interval = setInterval(() => {
                      pct += 1;
                      setProgress(pct);
                      if (pct >= 100) {
                        clearInterval(interval);
                        // Remover usuário do localStorage
                        const users = JSON.parse(localStorage.getItem('nevu_users') || '{}');
                        if (users[user.email]) {
                          delete users[user.email];
                          localStorage.setItem('nevu_users', JSON.stringify(users));
                        }
                        localStorage.removeItem('nevu_current_user');
                        window.location.href = '/';
                      }
                    }, 100);
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
              <div className="text-center text-gray-700 font-semibold">Excluindo sua conta... ({progress}%)<br/>Sentiremos sua falta!</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Reportar */}
      {/* {modalReportar && (
        <Modal isOpen={modalReportar} onClose={() => setModalReportar(false)} title="Reportar Chamado" size="sm">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Motivo do reporte</label>
            <textarea value={motivoReport} onChange={e => setMotivoReport(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva o motivo..." />
            <button onClick={enviarReport} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Enviar Reporte</button>
          </div>
        </Modal>
      )} */}

      {/* Toast de erro */}
      {erro && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg text-white bg-red-600 animate-fade-in">
          {erro}
        </div>
      )}
    </div>
  )
} 