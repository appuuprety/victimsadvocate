// Service worker — offline-first cache for app shell, network-first for API.
// Bump CACHE_VERSION whenever you ship a breaking change to force a refresh.

const CACHE_VERSION = 'cvr-v1'
const SHELL = ['/', '/admin', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Don't cache Supabase API or auth — must be live.
  if (url.hostname.endsWith('supabase.co')) return

  // App shell + static assets: cache-first, fall back to network.
  if (e.request.method === 'GET' && url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then(c => c.put(e.request, copy))
          }
          return res
        }).catch(() => cached)
        return cached || network
      })
    )
  }
})
