import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário e token do localStorage ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  // Função para login
  async function login({ email, senha }) {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, user } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setLoading(false);
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }

  // Função para registro + login automático
  async function register({ nome, email, senha, tipo }) {
    setLoading(true);
    try {
      await api.post('/auth/register', { nome, email, senha, tipo });
      // Login automático após registro (sem enviar tipo)
      const user = await login({ email, senha });
      setLoading(false);
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }

  // Função para atualizar perfil
  async function updateProfile(updates) {
    if (!user) return;
    setLoading(true);
    
    console.log('=== DEBUG: AuthContext - updateProfile ===');
    console.log('Usuário atual:', user);
    console.log('Dados para atualizar:', updates);
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      console.log('Token:', token ? 'Presente' : 'Ausente');
      
      const response = await api.put(`/users/${user.id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Resposta da API:', response.data);
      
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      setUser(response.data);
      
      console.log('Usuário atualizado no contexto:', response.data);
      
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Erro no updateProfile:', error);
      console.error('Detalhes do erro:', error.response?.data);
      setLoading(false);
      throw error;
    }
  }

  // Função para upgrade de plano (empresas)
  async function upgradePlano(selectedPlan) {
    if (!user) return;
    try {
      const planoId = selectedPlan.id || selectedPlan;
      const planoNome = selectedPlan.nome || selectedPlan;
      const planoPreco = selectedPlan.preco || 0;
      const hoje = new Date();
      const proximo = new Date();
      proximo.setMonth(proximo.getMonth() + 1);

      const updatedAssinatura = {
        plano: planoId,
        nome: planoNome,
        preco: planoPreco,
        status: 'ativa',
        dataInicio: hoje.toISOString(),
        proximoPagamento: proximo.toISOString()
      };

      const updatedUser = { ...user, assinatura: updatedAssinatura };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Erro no upgradePlano:', err);
      throw err;
    }
  }

  // Função para solicitar exclusão de conta (suspende por 30 dias)
  async function deleteAccount() {
    if (!user) return;
    setLoading(true);
    
    console.log('=== DEBUG: AuthContext - deleteAccount ===');
    console.log('Usuário solicitando exclusão:', user);
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      console.log('Token:', token ? 'Presente' : 'Ausente');
      
      // Solicitar exclusão (suspende por 30 dias)
      const response = await api.delete(`/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Resposta da solicitação:', response.data);
      
      // Limpar dados locais e fazer logout
      logout();
      
      console.log('Conta suspensa com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar exclusão:', error);
      console.error('Detalhes do erro:', error.response?.data);
      setLoading(false);
      throw error;
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      login, 
      logout, 
      register, 
      updateProfile,
      deleteAccount,
      upgradePlano,
      isAuthenticated: !!user,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}