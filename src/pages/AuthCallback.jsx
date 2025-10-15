import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('Processando login com Google...');

  useEffect(() => {
    async function handleCallback() {
      try {
        // token vem no fragment: #token=...
        const hash = window.location.hash || '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const token = params.get('token');
        if (!token) {
          setStatus('Token não encontrado no callback.');
          return navigate('/login?error=google');
        }

        // Guardar token e configurar header
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Decodificar JWT para obter o id e buscar o usuário
        const payload = decodeJwt(token);
        const id = payload?.id;
        if (!id) {
          setStatus('JWT inválido no callback.');
          return navigate('/login?error=google');
        }

        // Buscar usuário e salvar no contexto
        const resp = await api.get(`/users/${id}`);
        const user = resp.data;
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        setStatus('Login realizado com sucesso! Redirecionando...');
        // Redirecionar para a página inicial ou perfil
        setTimeout(() => navigate('/'), 800);
      } catch (err) {
        console.error('Erro no AuthCallback:', err);
        setStatus('Falha ao concluir login com Google.');
        navigate('/login?error=google');
      }
    }

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow border border-gray-100">
        <img src="/nevu.png" alt="Nevú" className="w-12 h-12" />
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
