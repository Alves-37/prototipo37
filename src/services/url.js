import api from './api';

// Retorna a URL absoluta para um arquivo em /uploads no backend atual (local ou produção)
export function uploadsUrl(filename) {
  if (!filename) return '';
  // Se já for uma URL absoluta (ex.: Cloudinary), retornar como está
  if (/^https?:\/\//i.test(filename)) return filename;
  try {
    const base = new URL(api.defaults.baseURL);
    // base é algo como http://localhost:5000/api -> pegamos somente a origem
    const origin = `${base.protocol}//${base.hostname}${base.port ? `:${base.port}` : ''}`;
    return `${origin}/uploads/${filename}`;
  } catch {
    // Fallback: tenta remover "/api" manualmente
    const base = (api.defaults.baseURL || '').replace(/\/?api\/?$/, '');
    return `${base}/uploads/${filename}`;
  }
}
