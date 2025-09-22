import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLoading from './AuthLoading'

export default function PublicRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <AuthLoading />
  }

  // Se estiver logado, redirecionar para página apropriada
  if (isAuthenticated && user) {
    if (user.tipo === 'usuario') {
      return <Navigate to="/" replace />
    } else if (user.tipo === 'empresa') {
      return <Navigate to="/empresa-home" replace />
    }
  }

  return children
} 