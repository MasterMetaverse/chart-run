/* Chart Run — offline cache.
   Serves the game's own files from cache and refreshes them in the
   background, so the installed app opens instantly and works offline.
   Bump VERSION when you ship a change you want everyone to get at once. */
var VERSION = 'chart-run-v7';
var FILES = [
  './', 'index.html', 'css/style.css', 'js/config.js', 'js/telegram.js', 'js/art.js', 'js/game.js',
  'img/piggy-3d.png', 'img/logo.png', 'img/icon-192.png', 'img/icon-512.png', 'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// same-origin GETs: answer from cache, refresh from the network behind it
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
