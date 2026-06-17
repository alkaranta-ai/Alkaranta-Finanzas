// Definimos un nombre para el caché (opcional, pero ayuda a la estabilidad)
const CACHE_NAME = 'alkaranta-v1';

// Evento de instalación: el navegador registra el service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
});

// Evento fetch: permite que la app funcione aunque no haya internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
