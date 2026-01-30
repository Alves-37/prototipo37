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

export default api;