// Guarda o app para abrir mesmo sem internet. Os dados vêm do Supabase quando há conexão.
var CACHE = 'vi-v8';
var FILES = ['./', 'index.html', 'style.css', 'app.js', 'conteudo.js', 'evangelhos.js', 'novenas.js', 'config.js', 'supabase.js', 'manifest.webmanifest', 'icon-192.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); })); self.clients.claim(); });
self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function(r){ var cp = r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, cp); }); return r; })
    .catch(function(){ return caches.match(e.request); }));
});
