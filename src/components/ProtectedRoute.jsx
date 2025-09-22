import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLoading from './AuthLoading'

export default function ProtectedRoute({ children, allowedTypes = ['usuario', 'empresa'] }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <AuthLoading />
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se o tipo de usuário não for permitido, redirecionar para página apropriada
  if (user && !allowedTypes.includes(user.tipo)) {
    if (user.tipo === 'usuario') {
      return <Navigate to="/" replace />
    } else if (user.tipo === 'empresa') {
      return <Navigate to="/empresa-home" replace />
    }
  }

  return children
} 