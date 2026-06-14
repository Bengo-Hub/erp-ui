// Service Worker for BengoBox ERP PWA
const CACHE_NAME = 'bengobox-erp-cache-v2';
const STATIC_CACHE = 'bengobox-static-v2';
const DYNAMIC_CACHE = 'bengobox-dynamic-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS).catch(err => {
                    console.error('[Service Worker] Failed to cache static assets:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http(s) schemes (chrome-extension, data, blob, etc.)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip API calls, auth endpoints, and WebSocket connections
    if (
        url.pathname.includes('/api/') ||
        url.pathname.includes('/auth/') ||
        url.pathname.includes('/ws/') ||
        request.method !== 'GET'
    ) {
        return event.respondWith(fetch(request));
    }

    // Network-first strategy for HTML pages
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request).then(response => {
                        return response || caches.match('/index.html');
                    });
                })
        );
        return;
    }

    // Cache-first strategy for static assets (CSS, JS, images)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone and cache the response
                const responseToCache = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return response;
            }).catch(error => {
                console.error('[Service Worker] Fetch failed:', error);
                throw error;
            });
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activated');
            return self.clients.claim();
        })
    );
});
