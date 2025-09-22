import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MonetizacaoProvider } from './context/MonetizacaoContext'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <AuthProvider>
      <MonetizacaoProvider>
        <Router>
          <AppRoutes />
        </Router>
      </MonetizacaoProvider>
    </AuthProvider>
  )
}

export default App
