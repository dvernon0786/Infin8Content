/**
 * Mobile Performance Service Worker
 * 
 * Provides offline functionality and performance optimizations
 * for mobile devices including caching, background sync,
 * and network-aware resource management.
 */

const CACHE_NAME = 'infin8-content-v1'
const OFFLINE_CACHE = 'infin8-content-offline-v1'

// Critical resources to cache for offline functionality
const CRITICAL_CACHE = [
  '/',
  '/dashboard',
  '/manifest.json',
  // Add other critical routes as needed
]

// Performance-optimized cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: 'cache-first',
  // Network first for dynamic content
  dynamic: 'network-first',
  // Stale while revalidate for API calls
  api: 'stale-while-revalidate'
}

/**
 * Install event - Cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical resources')
        return cache.addAll(CRITICAL_CACHE)
      })
      .then(() => {
        console.log('[SW] Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error)
      })
  )
})

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Activation complete')
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error)
      })
  )
})

/**
 * Fetch event - Handle requests with performance-optimized strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request, url)
  
  switch (strategy) {
    case CACHE_STRATEGIES.static:
      event.respondWith(handleCacheFirst(request))
      break
    case CACHE_STRATEGIES.dynamic:
      event.respondWith(handleNetworkFirst(request))
      break
    case CACHE_STRATEGIES.api:
      event.respondWith(handleStaleWhileRevalidate(request))
      break
    default:
      event.respondWith(handleNetworkFirst(request))
  }
})

/**
 * Determine cache strategy based on request characteristics
 */
function getCacheStrategy(request, url) {
  // Static assets - cache first
  if (isStaticAsset(request.url)) {
    return CACHE_STRATEGIES.static
  }
  
  // API calls - stale while revalidate
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.api
  }
  
  // Dynamic content - network first
  return CACHE_STRATEGIES.dynamic
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2']
  return staticExtensions.some(ext => url.includes(ext))
}

/**
 * Cache first strategy - for static assets
 */
async function handleCacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      // Update cache in background
      updateCacheInBackground(request)
      return cachedResponse
    }
    
    // Not in cache, fetch and cache
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    
    // Try to serve from offline cache
    const offlineResponse = await caches.match(request, { cacheName: OFFLINE_CACHE })
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Return offline fallback
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

/**
 * Network first strategy - for dynamic content
 */
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('[SW] Network first failed, trying cache:', error)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/') || new Response('Offline - No cached version available', {
        status: 503,
        statusText: 'Service Unavailable'
      })
    }
    
    throw error
  }
}

/**
 * Stale while revalidate strategy - for API calls
 */
async function handleStaleWhileRevalidate(request) {
  try {
    const cachedResponse = await caches.match(request)
    const networkPromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }).catch(error => {
      console.error('[SW] Network request failed:', error)
      return cachedResponse || new Response('Network error', { status: 500 })
    })
    
    // Return cached response immediately, update in background
    return cachedResponse || networkPromise
    
  } catch (error) {
    console.error('[SW] Stale while revalidate failed:', error)
    throw error
  }
}

/**
 * Update cache in background for cache-first strategy
 */
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse)
    }
  } catch (error) {
    console.warn('[SW] Background cache update failed:', error)
  }
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

/**
 * Handle background synchronization
 */
async function handleBackgroundSync() {
  try {
    // Get all pending offline actions from IndexedDB
    const pendingActions = await getPendingOfflineActions()
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        // Remove successful action from pending queue
        await removePendingAction(action.id)
        console.log('[SW] Synced action:', action.id)
        
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error)
      }
    }
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'infin8-content',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Infin8Content', options)
  )
})

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

/**
 * IndexedDB helpers for offline queue management
 */
async function getPendingOfflineActions() {
  // This would integrate with your IndexedDB setup
  // For now, return empty array
  return []
}

async function removePendingAction(actionId) {
  // This would remove the action from IndexedDB
  console.log('[SW] Would remove pending action:', actionId)
}

/**
 * Performance monitoring
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PERFORMANCE_METRICS') {
    console.log('[SW] Performance metrics received:', event.data.metrics)
    
    // Store metrics for analysis
    storePerformanceMetrics(event.data.metrics)
  }
})

/**
 * Store performance metrics
 */
async function storePerformanceMetrics(metrics) {
  // This would store metrics in IndexedDB or send to analytics
  console.log('[SW] Storing performance metrics:', metrics)
}

// Performance optimization: cleanup old caches periodically
setInterval(async () => {
  try {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    
    // Remove items older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    for (const request of requests) {
      const response = await cache.match(request)
      const dateHeader = response?.headers.get('date')
      
      if (dateHeader && new Date(dateHeader).getTime() < sevenDaysAgo) {
        await cache.delete(request)
        console.log('[SW] Cleaned up old cache entry:', request.url)
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error)
  }
}, 24 * 60 * 60 * 1000) // Run daily

console.log('[SW] Mobile Performance Service Worker loaded')
