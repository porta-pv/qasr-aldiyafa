const CACHE = 'qasr-v3';
const ASSETS = ['./', './index.html', './icon.png', './icon-192.png', './icon-512.png', './icon-180.png', './manifest.json', './favicon.ico'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// ═══════════════ NOTIFICATIONS ═══════════════
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    const { delay, interval, notifications } = e.data;

    // Fire each notification after delay + i*interval
    notifications.forEach((notif, i) => {
      setTimeout(async () => {
        const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        const pageOpen   = allClients.some(c => c.visibilityState === 'visible');

        if (pageOpen) {
          // Page is open — send in-app message
          allClients.forEach(client => {
            client.postMessage({ type: 'SHOW_NOTIFICATION', title: notif.title, body: notif.body });
          });
        } else {
          // Page is closed — show system notification
          self.registration.showNotification(notif.title, {
            body: notif.body,
            icon: './icon-192.png',
            badge: './icon-192.png',
            dir: 'rtl',
            lang: 'ar',
            vibrate: [200, 100, 200],
            tag: 'qasr-notif-' + i,
          });
        }
      }, delay + i * interval);
    });
  }
});

// Click on system notification → open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })
  );
});
