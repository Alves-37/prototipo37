import { BrowserRouter as Router } from 'react-router-dom'
import { MonetizacaoProvider } from './context/MonetizacaoContext'
import AppRoutes from './AppRoutes'
import PushNotificationManager from './components/PushNotificationManager'

function App() {
  return (
    <MonetizacaoProvider>
      <Router>
        <AppRoutes />
        <PushNotificationManager />
      </Router>
    </MonetizacaoProvider>
  )
}

export default App
