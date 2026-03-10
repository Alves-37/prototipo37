import api from './api';

// Retorna a URL absoluta para um arquivo em /uploads no backend atual (local ou produção)
export function uploadsUrl(filename) {
  if (!filename) return '';
  // Se já for uma URL absoluta (ex.: Cloudinary), retornar como está
  if (/^https?:\/\//i.test(filename)) return filename;

  const normalized = (() => {
    const raw = String(filename || '').trim().replace(/\\/g, '/');
    if (!raw) return '';
    const noLeading = raw.replace(/^\/+/, '');
    if (/^uploads\//i.test(noLeading)) return noLeading.replace(/^uploads\//i, '');
    return noLeading;
  })();

  if (!normalized) return '';
  try {
    const base = new URL(api.defaults.baseURL);
    // base é algo como http://localhost:5000/api -> pegamos somente a origem
    const origin = `${base.protocol}//${base.hostname}${base.port ? `:${base.port}` : ''}`;
    return `${origin}/uploads/${normalized}`;
  } catch {
    // Fallback: tenta remover "/api" manualmente
    const base = (api.defaults.baseURL || '').replace(/\/?api\/?$/, '');
    return `${base}/uploads/${normalized}`;
  }
}

export function normalizeExternalUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  if (!raw) return '';
  if (/^(https?:\/\/)/i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
}
