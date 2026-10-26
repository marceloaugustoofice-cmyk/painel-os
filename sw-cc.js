// Service Worker do Painel OS SEMAE
// Estratégia: network-first para HTML/JS/dados (site sempre atualizado quando há internet),
// cache como reserva (funciona offline com os últimos dados recebidos).
const CACHE = 'cc-os-v1';
const CORE = [
  './',
  './index.html',
  './app1.js', './app2.js', './app3.js', './app4.js', './app5.js', './app6.js',
  './manifest.json',
  './icons-cc/icon-192.png', './icons-cc/icon-512.png', './icons-cc/maskable-512.png', './icons-cc/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin && !url.host.includes('cdnjs')) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(hit => hit || caches.match('./index.html')))
  );
});