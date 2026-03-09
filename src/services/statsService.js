import api from './api';

const statsService = {
  // Buscar estatísticas do usuário logado (seguidores e seguindo)
  async getUserStats(userId) {
    try {
      const response = await api.get('/stats/user');
      return response.data;
    } catch (error) {
      try {
        const status = error?.response?.status;
        const data = error?.response?.data;
        const url = error?.config?.url;
        console.error('Erro ao buscar estatísticas do usuário:', { status, data, url, error });
      } catch {
        console.error('Erro ao buscar estatísticas do usuário:', error);
      }

      try {
        const id = Number(userId);
        if (id) {
          const resp = await api.get(`/public/users/${id}`);
          const followers = Number(resp?.data?.stats?.followers || 0);
          const following = Number(resp?.data?.stats?.following || 0);
          return { followers, following };
        }
      } catch (fallbackError) {
        try {
          const status = fallbackError?.response?.status;
          const data = fallbackError?.response?.data;
          const url = fallbackError?.config?.url;
          console.error('Fallback stats público falhou:', { status, data, url, fallbackError });
        } catch {
          console.error('Fallback stats público falhou:', fallbackError);
        }
      }

      // Retorna valores padrão em caso de erro
      return {
        followers: 0,
        following: 0
      };
    }
  }
};

export default statsService;
