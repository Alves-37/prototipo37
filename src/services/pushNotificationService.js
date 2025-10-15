import api from './api';

// Chave pública VAPID (você precisará gerar uma - vou fornecer instruções)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDJo3QTnpC_2MYqXhVeY6VkJJQXJJQXJJQXJJQXJJQXI';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  // Converter chave VAPID para Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Verificar se notificações são suportadas
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Verificar permissão atual
  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  // Registrar Service Worker
  async registerServiceWorker() {
    if (!this.isSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', this.registration);
      
      // Aguardar o SW estar pronto
      await navigator.serviceWorker.ready;
      return this.registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      throw error;
    }
  }

  // Solicitar permissão
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Notificações não são suportadas');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Inscrever-se para notificações push
  async subscribe() {
    try {
      // Registrar SW se ainda não foi
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      // Solicitar permissão
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão de notificação negada');
      }

      // Criar inscrição push
      const convertedVapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Inscrição push criada:', this.subscription);

      // Enviar inscrição para o backend
      await this.sendSubscriptionToBackend(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      throw error;
    }
  }

  // Enviar inscrição para o backend
  async sendSubscriptionToBackend(subscription) {
    try {
      await api.post('/push/subscribe', {
        subscription: subscription.toJSON()
      });
      console.log('Inscrição enviada ao backend');
    } catch (error) {
      console.error('Erro ao enviar inscrição ao backend:', error);
      throw error;
    }
  }

  // Cancelar inscrição
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        
        // Notificar backend
        await api.post('/push/unsubscribe', {
          endpoint: this.subscription.endpoint
        });
        
        this.subscription = null;
        console.log('Inscrição cancelada');
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      throw error;
    }
  }

  // Obter inscrição atual
  async getSubscription() {
    try {
      if (!this.registration) {
        await this.registerServiceWorker();
      }
      
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Erro ao obter inscrição:', error);
      return null;
    }
  }

  // Testar notificação local
  async testNotification() {
    if (!this.isSupported()) {
      throw new Error('Notificações não são suportadas');
    }

    if (Notification.permission !== 'granted') {
      await this.requestPermission();
    }

    if (Notification.permission === 'granted') {
      new Notification('Teste - Nevú', {
        body: 'Esta é uma notificação de teste!',
        icon: '/nevu.png',
        badge: '/nevu.png'
      });
    }
  }
}

export default new PushNotificationService();
