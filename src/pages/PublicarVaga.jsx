import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMonetizacao } from '../context/MonetizacaoContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PublicarVaga = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    requisitos: '',
    beneficios: '',
    salario: '',
    localizacao: '',
    tipoContrato: 'Efetivo',
    nivelExperiencia: 'JUNIOR',
    modalidade: 'PRESENCIAL',
    area: '',
    dataExpiracao: '',
    premium: false,
    capacidadeVagas: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [error, setError] = useState(null);
  const isEditando = Boolean(id);
  const { assinatura } = useMonetizacao();
  const isPremiumEmpresa = assinatura?.plano === 'premium' || assinatura?.plano === 'empresarial';

  // Carregar vaga se for edição
  useEffect(() => {
    if (isEditando && id) {
      loadVaga();
    }
  }, [id, isEditando]);

  const loadVaga = async () => {
    try {
      const response = await api.get(`/vagas/${id}`);
      const vaga = response.data;
      
      setFormData({
        titulo: vaga.titulo || '',
        descricao: vaga.descricao || '',
        requisitos: vaga.requisitos || '',
        beneficios: vaga.beneficios || '',
        salario: vaga.salario || '',
        localizacao: vaga.localizacao || '',
        tipoContrato: vaga.tipoContrato || 'Efetivo',
        nivelExperiencia: vaga.nivelExperiencia || 'JUNIOR',
        modalidade: vaga.modalidade || 'PRESENCIAL',
        area: vaga.area || '',
        dataExpiracao: vaga.dataExpiracao ? vaga.dataExpiracao.split('T')[0] : '',
        premium: vaga.premium || false,
        capacidadeVagas: vaga.capacidadeVagas || 1
      });
    } catch (error) {
      console.error('Erro ao carregar vaga:', error);
      setError('Erro ao carregar dados da vaga');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const vagaData = {
        ...formData,
        dataExpiracao: formData.dataExpiracao || null
      };

      console.log('Dados sendo enviados para API:', vagaData);

      let response;
      if (isEditando) {
        response = await api.put(`/vagas/${id}`, vagaData);
        setShowToast({ type: 'success', message: 'Vaga editada com sucesso!' });
      } else {
        response = await api.post('/vagas', vagaData);
        setShowToast({ type: 'success', message: 'Vaga publicada com sucesso!' });
      }

      setTimeout(() => setShowToast(null), 2200);
      setTimeout(() => navigate('/vagas-publicadas'), 2300);
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar vaga';
      setError(errorMessage);
      setShowToast({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📢 {isEditando ? 'Editar Vaga' : 'Publicar Nova Vaga'}
            </h1>
            <p className="text-gray-600">
              {isEditando ? 'Edite os dados da vaga' : 'Preencha os dados da vaga para encontrar o candidato ideal'}
            </p>
          </div>

          {/* Alertas de erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 pb-8">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Vaga *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Desenvolvedor React Senior"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização *
                </label>
                <input
                  type="text"
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cidade, Estado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área de Atuação *
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tecnologia, Marketing, Vendas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salário (opcional)
                </label>
                <input
                  type="text"
                  name="salario"
                  value={formData.salario}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 15.000 - 25.000 MT"
                />
              </div>
            </div>

            {/* Detalhes da Vaga */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato
                </label>
                <select
                  name="tipoContrato"
                  value={formData.tipoContrato}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Efetivo">Efetivo</option>
                  <option value="Prestador">Prestador</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Estagio">Estágio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Experiência
                </label>
                <select
                  name="nivelExperiencia"
                  value={formData.nivelExperiencia}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="JUNIOR">Júnior</option>
                  <option value="PLENO">Pleno</option>
                  <option value="SENIOR">Sênior</option>
                  <option value="ESPECIALISTA">Especialista</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalidade
                </label>
                <select
                  name="modalidade"
                  value={formData.modalidade}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="REMOTO">Remoto</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
            </div>

            {/* Checkbox Vaga Premium */}
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="premium"
                name="premium"
                checked={formData.premium}
                onChange={handleInputChange}
                className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded mr-2"
                disabled={!isPremiumEmpresa}
              />
              <label htmlFor="premium" className="text-sm font-medium text-gray-700 select-none">
                Tornar esta vaga <span className="font-bold text-yellow-600">Premium</span> (apenas candidatos premium poderão se candidatar)
              </label>
              {!isPremiumEmpresa && (
                <span className="ml-2 text-xs text-gray-400" title="Disponível apenas para empresas com plano Premium ou Empresarial.">
                  (Disponível apenas para empresas premium)
                </span>
              )}
            </div>

            {/* Capacidade de Vagas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidade de Candidatos Aprovados *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  name="capacidadeVagas"
                  value={formData.capacidadeVagas}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  required
                  className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                <span className="text-sm text-gray-600">
                  Quantos candidatos aprovados você precisa para esta vaga?
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Defina quantos candidatos aprovados você quer para esta posição. A vaga será fechada automaticamente quando atingir este limite de aprovados.
              </p>
            </div>

            {/* Prazo de Inscrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo de Inscrição
              </label>
              <input
                type="date"
                name="dataExpiracao"
                value={formData.dataExpiracao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Vaga *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva as responsabilidades, atividades e objetivos da vaga..."
              />
            </div>

            {/* Requisitos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requisitos *
              </label>
              <textarea
                name="requisitos"
                value={formData.requisitos}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Liste os requisitos técnicos, formação, experiência necessária..."
              />
            </div>

            {/* Benefícios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefícios (opcional)
              </label>
              <textarea
                name="beneficios"
                value={formData.beneficios}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Liste os benefícios oferecidos: seguro de saúde, subsídio de alimentação, etc..."
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/vagas-publicadas')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditando ? 'Salvando...' : 'Publicando...'}
                  </span>
                ) : (
                  isEditando ? '💾 Salvar Alterações' : '📢 Publicar Vaga'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Toast visual */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg text-white ${
          showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}
          style={{ fontSize: '1rem', maxWidth: '90vw', left: '50%', right: 'auto', transform: 'translateX(-50%)', bottom: '1.5rem', zIndex: 9999 }}
        >
          {showToast.message}
        </div>
      )}
    </div>
  );
};

export default PublicarVaga; 