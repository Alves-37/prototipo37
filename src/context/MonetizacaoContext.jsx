import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const MonetizacaoContext = createContext()

export const useMonetizacao = () => {
  const context = useContext(MonetizacaoContext)
  if (!context) {
    throw new Error('useMonetizacao deve ser usado dentro de um MonetizacaoProvider')
  }
  return context
}

export const MonetizacaoProvider = ({ children }) => {
  const { user } = useAuth()
  const [assinatura, setAssinatura] = useState(null)

  const [loading, setLoading] = useState(true)

  // Planos disponíveis
  const planos = {
    gratuito: {
      id: 'gratuito',
      nome: 'Gratuito',
      preco: 0,
      limiteVagas: 3,
      limiteMensagens: 50,
      comissao: 0,
      recursos: [
        'Até 3 vagas por mês',
        '50 mensagens por mês',
        'Acesso básico a candidatos',
        'Suporte por email',
        'Perfil empresa básico'
      ],
      popular: false,
      periodo: 'Mensal'
    },
    basico: {
      id: 'basico',
      nome: 'Básico',
      preco: 2500,
      limiteVagas: 10,
      limiteMensagens: -1,
      comissao: 0.05,
      recursos: [
        'Até 10 vagas por mês',
        'Mensagens ilimitadas',
        'Acesso completo a candidatos',
        'Suporte prioritário',
        'Perfil empresa destacado',
        'Relatórios básicos',
        'Notificações avançadas'
      ],
      popular: true,
      periodo: 'Mensal'
    },
    premium: {
      id: 'premium',
      nome: 'Premium',
      preco: 4500,
      limiteVagas: -1,
      limiteMensagens: -1,
      comissao: 0.03,
      recursos: [
        'Vagas ilimitadas',
        'Mensagens ilimitadas',
        'Acesso premium a candidatos',
        'Suporte 24/7',
        'Perfil empresa premium',
        'Relatórios avançados',
        'Notificações prioritárias',
        'Filtros avançados',
        'Integração com ATS'
      ],
      popular: false,
      periodo: 'Mensal'
    },
    empresarial: {
      id: 'empresarial',
      nome: 'Empresarial',
      preco: 8500,
      limiteVagas: -1,
      limiteMensagens: -1,
      comissao: 0.02,
      recursos: [
        'Vagas ilimitadas',
        'Mensagens ilimitadas',
        'Acesso empresarial a candidatos',
        'Suporte dedicado 24/7',
        'Perfil empresa premium',
        'Relatórios empresariais',
        'Notificações prioritárias',
        'Filtros avançados',
        'Integração com ATS',
        'API personalizada',
        'Gerente de conta',
        'Treinamento da equipe'
      ],
      popular: false,
      periodo: '2 meses'
    }
  }

  // Adicionar definição de planos para candidatos
  const planosCandidato = {
    gratuito: {
      id: 'gratuito',
      nome: 'Gratuito',
      preco: 0,
      limiteCandidaturas: 5,
      limiteMensagens: 10,
      destaque: false,
      recursos: [
        'Até 5 candidaturas simultâneas',
        '10 mensagens por mês',
        'Perfil básico',
        'Acesso a vagas públicas',
        'Suporte por email'
      ],
      popular: false
    },
    basico: {
      id: 'basico',
      nome: 'Básico',
      preco: 500,
      limiteCandidaturas: 20,
      limiteMensagens: 50,
      destaque: true,
      recursos: [
        'Até 20 candidaturas simultâneas',
        '50 mensagens por mês',
        'Perfil em destaque',
        'Acesso a todas as vagas',
        'Suporte prioritário',
        'Notificações avançadas',
        'Relatórios de candidatura'
      ],
      popular: true
    },
    premium: {
      id: 'premium',
      nome: 'Premium',
      preco: 1500,
      limiteCandidaturas: -1,
      limiteMensagens: -1,
      destaque: true,
      recursos: [
        'Candidaturas ilimitadas',
        'Mensagens ilimitadas',
        'Perfil premium em destaque',
        'Acesso exclusivo a vagas',
        'Suporte 24/7',
        'Notificações prioritárias',
        'Relatórios avançados',
        'CV destacado',
        'Acesso a vagas premium'
      ],
      popular: false
    }
  }

  // Sempre sincronizar assinatura com user.assinatura
  useEffect(() => {
    if (user) {
      if (user.tipo === 'empresa') {
        setAssinatura(user.assinatura || { plano: 'gratuito', nome: 'Gratuito', preco: 0 });
      } else {
        setAssinatura(user.assinatura || { plano: 'gratuito', nome: 'Gratuito', preco: 0, destaque: false });
      }
      setLoading(false);
    }
  }, [user]);

  // Verificar se o usuário pode publicar mais vagas
  const podePublicarVaga = () => {
    if (!assinatura) return false
    const plano = planos[assinatura.plano]
    if (plano.limiteVagas === -1) return true
    return assinatura.vagasUsadas < plano.limiteVagas
  }

  // Verificar se o usuário pode enviar mais mensagens
  const podeEnviarMensagem = () => {
    if (!assinatura) return false
    const plano = planos[assinatura.plano]
    if (plano.limiteMensagens === -1) return true
    return assinatura.mensagensUsadas < plano.limiteMensagens
  }

  // Adicionar funções para candidatos
  const podeCandidatar = () => {
    if (!assinatura || user?.tipo !== 'usuario') return false
    const plano = planosCandidato[assinatura.plano]
    if (plano.limiteCandidaturas === -1) return true
    return assinatura.candidaturasUsadas < plano.limiteCandidaturas
  }
  const podeEnviarMensagemCandidato = () => {
    if (!assinatura || user?.tipo !== 'usuario') return false
    const plano = planosCandidato[assinatura.plano]
    if (plano.limiteMensagens === -1) return true
    return assinatura.mensagensUsadas < plano.limiteMensagens
  }
  const fazerUpgradeCandidato = async (novoPlano) => {
    try {
      setAssinatura(prev => ({
        ...prev,
        plano: novoPlano,
        nome: planosCandidato[novoPlano].nome,
        preco: planosCandidato[novoPlano].preco,
        destaque: planosCandidato[novoPlano].destaque // Corrige o campo destaque
      }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Calcular comissão por contratação
  const calcularComissao = (salario) => {
    if (!assinatura) return 0
    const plano = planos[assinatura.plano]
    return salario * plano.comissao
  }

  // Atualizar uso de vagas
  const incrementarVagasUsadas = () => {
    setAssinatura(prev => ({
      ...prev,
      vagasUsadas: prev.vagasUsadas + 1
    }))
  }

  // Atualizar uso de mensagens
  const incrementarMensagensUsadas = () => {
    setAssinatura(prev => ({
      ...prev,
      mensagensUsadas: prev.mensagensUsadas + 1
    }))
  }

  // Fazer upgrade do plano
  const fazerUpgrade = async (novoPlano) => {
    try {
      // Aqui seria feita a integração com gateway de pagamento
      console.log('Fazendo upgrade para:', novoPlano)
      
      setAssinatura(prev => ({
        ...prev,
        plano: novoPlano,
        nome: planos[novoPlano].nome,
        preco: planos[novoPlano].preco
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error)
      return { success: false, error: error.message }
    }
  }

  // Cancelar assinatura
  const cancelarAssinatura = async () => {
    try {
      console.log('Cancelando assinatura')
      
      setAssinatura(prev => ({
        ...prev,
        status: 'cancelada'
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      return { success: false, error: error.message }
    }
  }

  // Helper para checar acesso a funcionalidades por plano
  function temAcessoA(feature) {
    if (!assinatura) return false;
    const plano = planos[assinatura.plano];
    switch (feature) {
      case 'relatorios':
        return plano.id === 'premium' || plano.id === 'empresarial';
      case 'filtrosAvancados':
        return plano.id === 'premium' || plano.id === 'empresarial';
      case 'notificacoesPrioritarias':
        return plano.id === 'premium' || plano.id === 'empresarial';
      case 'api':
      case 'gerenteConta':
      case 'treinamento':
        return plano.id === 'empresarial';
      default:
        return false;
    }
  }

  const value = {
    assinatura,
    planos,
    loading,
    podePublicarVaga,
    podeEnviarMensagem,
    calcularComissao,
    incrementarVagasUsadas,
    incrementarMensagensUsadas,
    fazerUpgrade,
    cancelarAssinatura,
    podeCandidatar,
    podeEnviarMensagemCandidato,
    fazerUpgradeCandidato,
    planosCandidato,
    temAcessoA, // exporta helper
  }

  return (
    <MonetizacaoContext.Provider value={value}>
      {children}
    </MonetizacaoContext.Provider>
  )
} 