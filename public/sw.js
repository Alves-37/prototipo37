// Service Worker para notificações push
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(clients.claim());
});

// Receber notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let data = {};
  if (event.data) {
    console.log('Raw push data:', event.data);
    console.log('Push data text():', event.data.text());
    try {
      data = event.data.json();
      console.log('Parsed push data:', data);
    } catch (e) {
      console.error('Erro ao fazer parse do JSON:', e);
      data = { title: 'Nova Notificação', body: event.data.text() };
    }
  } else {
    console.log('Push sem dados!');
    // Mesmo sem dados, mostrar notificação genérica
    data = { title: 'Nevú', body: 'Você tem uma nova atividade na plataforma' };
  }

  const title = data.title || 'Nevú';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/nevu.png',
    badge: '/nevu.png',
    image: data.image || null,
    data: { 
      url: data.url || '/',
      receivedAt: Date.now()
    },
    tag: data.tag || 'nevu-notification',
    requireInteraction: true, // Forçar a notificação a ficar visível até o usuário interagir
    vibrate: [200, 100, 200],
    actions: data.actions || [],
    silent: false,
    renotify: true
  };

  console.log('Preparando para exibir notificação:', title, options);

  event.waitUntil((async () => {
    try {
      // Verificar se temos permissão (apesar de estarmos no SW)
      if (self.Notification && self.Notification.permission === 'denied') {
        console.warn('Permissão de notificação negada no Service Worker');
        return;
      }

      console.log('Chamando self.registration.showNotification...');
      await self.registration.showNotification(title, options);
      console.log('showNotification chamado com sucesso');

      // Notificar todas as abas abertas
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      console.log(`Notificando ${allClients.length} abas abertas`);
      
      for (const client of allClients) {
        client.postMessage({ 
          type: 'PUSH_RECEIVED', 
          payload: { 
            title, 
            body: options.body,
            url: options.data.url
          } 
        });
      }
    } catch (err) {
      console.error('Falha crítica ao exibir notificação no SW:', err);
    }
  })());
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já existe uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Caso contrário, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
