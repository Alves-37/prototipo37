import api from './api';

export const notificationService = {
  async listar({ page = 1, limit = 20, somenteNaoLidas = false } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (somenteNaoLidas) params.set('somenteNaoLidas', 'true');
    const { data } = await api.get(`/notificacoes?${params.toString()}`);
    return data; // { notificacoes, total, naoLidas, page, totalPages }
  },

  async marcarComoLida(id) {
    try {
      await api.put(`/notificacoes/${id}/lida`);
    } catch (e) {
      if (e?.response?.status === 404) {
        // Endpoint não disponível no backend em produção; ignorar para não quebrar UX
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
      } else {
        throw e;
      }
    }
  },

  async limparTodas() {
    await api.delete('/notificacoes');
  },
};

export default notificationService;
