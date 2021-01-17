const cacheName = 'dev-1'

self.addEventListener('install', function (event) {
  const cacheList = [
    '/index.html',
    '/index.js',
    '/favicon.ico',
    '/sounds/baron-missile.wav',
    '/sounds/baron-death.wav',
    '/sounds/baron-pain.wav',
    '/sounds/baron-scream.wav',
    '/sounds/plasma-impact.wav',
  ]
  event.waitUntil(
    caches
      .open(cacheName)
      .then(function (cache) {
        console.info('Cache', cacheName, 'opened')
        return cache.addAll(cacheList)
      })
      .then(function () {
        return self.skipWaiting()
      })
  )
})

self.addEventListener('activate', function (event) {
  console.info('Cache', cacheName, 'activated')
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== cacheName) {
            console.info(cacheName, 'Removing old cache', key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (event.request.url === '/') {
        return fetch(event.request)
      }
      return response || fetch(event.request)
    })
  )
})
