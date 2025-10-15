import { useState, useEffect, useCallback } from 'react';
import { mensagemService } from '../services/mensagemService';

export const useMensagens = () => {
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Carregar conversas
  const carregarConversas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mensagemService.listarConversas();
      setConversas(data);
    } catch (err) {
      setError('Erro ao carregar conversas');
      console.error('Erro ao carregar conversas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar mensagens de uma conversa
  const carregarMensagens = useCallback(async (conversaId) => {
    try {
      setLoadingMensagens(true);
      setError(null);
      const data = await mensagemService.obterMensagens(conversaId);
      setMensagens(data);
      
      // Marcar como lidas
      await mensagemService.marcarComoLidas(conversaId);
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoadingMensagens(false);
    }
  }, []);

  // Enviar mensagem
  const enviarMensagem = useCallback(async (texto, destinatarioId) => {
    if (!texto.trim() || !conversaAtiva) return false;

    try {
      setEnviando(true);
      setError(null);
      
      const dados = {
        destinatarioId,
        texto: texto.trim(),
        conversaId: conversaAtiva
      };

      const mensagemEnviada = await mensagemService.enviarMensagem(dados);
      
      // Adicionar mensagem à lista
      setMensagens(prev => [...prev, mensagemEnviada]);
      
      // Recarregar conversas para atualizar última mensagem
      await carregarConversas();
      
      return true;
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', err);
      return false;
    } finally {
      setEnviando(false);
    }
  }, [conversaAtiva, carregarConversas]);

  // Selecionar conversa
  const selecionarConversa = useCallback((conversaId) => {
    setConversaAtiva(conversaId);
    if (conversaId) {
      carregarMensagens(conversaId);
    } else {
      setMensagens([]);
    }
  }, [carregarMensagens]);

  // Silenciar conversa
  const silenciarConversa = useCallback(async (conversaId) => {
    try {
      await mensagemService.silenciarConversa(conversaId);
      await carregarConversas();
    } catch (err) {
      setError('Erro ao silenciar conversa');
      console.error('Erro ao silenciar conversa:', err);
    }
  }, [carregarConversas]);

  // Bloquear usuário
  const bloquearUsuario = useCallback(async (conversaId) => {
    try {
      await mensagemService.bloquearUsuario(conversaId);
      await carregarConversas();
    } catch (err) {
      setError('Erro ao bloquear usuário');
      console.error('Erro ao bloquear usuário:', err);
    }
  }, [carregarConversas]);

  // Apagar conversa
  const apagarConversa = useCallback(async (conversaId) => {
    try {
      await mensagemService.apagarConversa(conversaId);
      if (conversaAtiva === conversaId) {
        setConversaAtiva(null);
        setMensagens([]);
      }
      await carregarConversas();
    } catch (err) {
      setError('Erro ao apagar conversa');
      console.error('Erro ao apagar conversa:', err);
    }
  }, [conversaAtiva, carregarConversas]);

  // Carregar conversas ao montar
  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  return {
    // Estado
    conversas,
    conversaAtiva,
    mensagens,
    loading,
    loadingMensagens,
    enviando,
    error,
    
    // Ações
    carregarConversas,
    carregarMensagens,
    enviarMensagem,
    selecionarConversa,
    silenciarConversa,
    bloquearUsuario,
    apagarConversa,
    
    // Utilitários
    getConversaAtiva: () => conversas.find(c => c.id === conversaAtiva),
    limparError: () => setError(null)
  };
}; 