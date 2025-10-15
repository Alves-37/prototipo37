import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import pushService from '../services/pushNotificationService';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Verificar suporte e permissão
    if (pushService.isSupported()) {
      setPermission(pushService.getPermission());
      
      // Verificar se já está inscrito
      checkSubscription();
      
      // Mostrar prompt após 5 segundos se ainda não tiver permissão
      if (pushService.getPermission() === 'default') {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const subscription = await pushService.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      await pushService.subscribe();
      setPermission('granted');
      setIsSubscribed(true);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      if (error.message.includes('negada')) {
        setPermission('denied');
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Não mostrar novamente nesta sessão
    sessionStorage.setItem('push-prompt-dismissed', 'true');
  };

  // Não mostrar se já foi dispensado nesta sessão
  if (sessionStorage.getItem('push-prompt-dismissed')) {
    return null;
  }

  // Não mostrar se não há suporte
  if (!pushService.isSupported()) {
    return null;
  }

  // Não mostrar se já tem permissão ou foi negada
  if (permission !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              🔔 Ativar Notificações
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Receba alertas de novas vagas e chamados mesmo quando não estiver usando a plataforma!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnableNotifications}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Ativar
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
