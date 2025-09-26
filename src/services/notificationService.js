import api from './api';

export const notificationService = {
  async listar({ page = 1, limit = 20, somenteNaoLidas = false } = {}) {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page || 1));
      params.set('limit', String(limit || 20));
      if (somenteNaoLidas) params.set('somenteNaoLidas', 'true');
      const { data } = await api.get(`/notificacoes?${params.toString()}`);
      return data; // { notificacoes, total, naoLidas, page, totalPages }
    } catch (e) {
      // Silenciar erros de notificações (ex: usuário não autenticado ou backend sem suporte)
      return { notificacoes: [], total: 0, naoLidas: 0, page: 1, totalPages: 0 };
    }
  },

  async marcarComoLida(id) {
    try {
      await api.put(`/notificacoes/${id}/lida`);
    } catch (e) {
      if (e?.response?.status === 404) {
        // Endpoint não disponível no backend em produção; ignorar para não quebrar UX
        return;
      }
      if (e?.response?.status === 401) {
        // Não autenticado: ignorar
        return;
      }
      throw e;
    }
  },

  async marcarTodasComoLidas() {
    try {
      await api.put('/notificacoes/lidas');
    } catch (e) {
      // Fallback: se o endpoint bulk não existir no backend (404), marcar uma a uma
      if (e?.response?.status === 404) {
        try {
          const data = await this.listar({ page: 1, limit: 100, somenteNaoLidas: true });
          const itens = data?.notificacoes || [];
          await Promise.all(itens.map(n => this.marcarComoLida(n.id).catch(() => {})));
        } catch (_) {
          // Silencia fallback
        }
      } else if (e?.response?.status === 401) {
        // Não autenticado: ignorar
        return;
      } else {
        throw e;
      }
    }
  },

  async limparTodas() {
    try {
      await api.delete('/notificacoes');
    } catch (e) {
      if (e?.response?.status === 401 || e?.response?.status === 404) return;
      throw e;
    }
  },
};

export default notificationService;
