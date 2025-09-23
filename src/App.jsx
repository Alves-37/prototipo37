import { BrowserRouter as Router } from 'react-router-dom'
import { MonetizacaoProvider } from './context/MonetizacaoContext'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <MonetizacaoProvider>
      <Router>
        <AppRoutes />
      </Router>
    </MonetizacaoProvider>
  )
}

export default App
