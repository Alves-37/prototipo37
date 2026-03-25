// Service Worker para notificações push
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Receber notificações push
self.addEventListener('push', (event) => {
  let data = {};
  event.waitUntil((async () => {
    try {
      if (event.data) {
        let rawText = '';
        try {
          rawText = await event.data.text();
        } catch (e) {
          console.warn('Falha ao ler push data como texto:', e);
        }

        try {
          data = await event.data.json();
        } catch (e) {
          console.error('Erro ao fazer parse do JSON:', e);
          data = { title: 'Nova Notificação', body: rawText || 'Você tem uma nova atividade na plataforma' };
        }
      } else {
        data = { title: 'Nevú', body: 'Você tem uma nova atividade na plataforma' };
      }

      const title = data.title || 'Nevú';
      const receivedAt = Date.now();
      const options = {
        body: data.body || 'Você tem uma nova notificação',
        icon: '/nevu.png',
        badge: '/nevu.png',
        image: data.image || null,
        data: {
          url: data.url || '/',
          receivedAt
        },
        tag: data.tag ? String(data.tag) : `nevu-notification-${receivedAt}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: data.actions || [],
        silent: false,
        renotify: true
      };

      if (self.Notification && self.Notification.permission === 'denied') {
        console.warn('Permissão de notificação negada no Service Worker');
        return;
      }

      await self.registration.showNotification(title, options);

      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      
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
