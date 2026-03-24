import axios from 'axios';

// Define a baseURL baseada em variáveis de ambiente do Vite
// Prioriza VITE_API_BASE_URL; caso não exista, usa um fallback por ambiente
const baseURL =
  import.meta?.env?.VITE_API_BASE_URL ||
  (import.meta?.env?.DEV
    ? 'http://localhost:5000/api'
    : 'https://prototipo-production-7dde.up.railway.app/api');

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const headers = config.headers || {};
      if (!headers.Authorization && !headers.authorization) {
        headers.Authorization = `Bearer ${token}`;
      }
      config.headers = headers;
    }
  } catch {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    try {
      const status = error?.response?.status;
      if (status === 401) {
        try { localStorage.removeItem('token'); } catch {}
        try { localStorage.removeItem('user'); } catch {}
        try { localStorage.removeItem('auth_user'); } catch {}

        const current = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
        const next = `/login?next=${encodeURIComponent(current)}`;

        if (typeof window !== 'undefined') {
          if (!window.location.pathname.startsWith('/login')) {
            window.location.assign(next);
          }
        }
      }
    } catch {
      // ignore
    }
    return Promise.reject(error);
  }
);

export default api;