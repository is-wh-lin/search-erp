import { useToast } from './composables/useToast'

export interface ServiceWorkerRegistrationCallbacks {
  onReady?: (registration: ServiceWorkerRegistration) => void
  onRegistered?: (registration: ServiceWorkerRegistration) => void
  onCached?: (registration: ServiceWorkerRegistration) => void
  onUpdateFound?: (registration: ServiceWorkerRegistration) => void
  onUpdated?: (registration: ServiceWorkerRegistration) => void
  onOffline?: () => void
  onError?: (error: Error) => void
}

export function registerServiceWorker(callbacks: ServiceWorkerRegistrationCallbacks = {}) {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser')
    return
  }

  window.addEventListener('load', async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/'
      const swPath = `${baseUrl}sw.js`
      const scope = baseUrl

      const registration = await navigator.serviceWorker.register(swPath, {
        scope: scope,
      })

      console.log('Service Worker registered:', registration)

      if (registration.active && !navigator.serviceWorker.controller) {
        callbacks.onReady?.(registration)
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (!newWorker) return

        callbacks.onUpdateFound?.(registration)

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.')
              callbacks.onUpdated?.(registration)
            } else {
              console.log('Content is cached for offline use.')
              callbacks.onCached?.(registration)
              callbacks.onRegistered?.(registration)
            }
          }
        })
      })

      setInterval(
        () => {
          registration.update()
        },
        60 * 60 * 1000
      )
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      callbacks.onError?.(error as Error)
    }
  })

  window.addEventListener('offline', () => {
    console.log('App is offline')
    callbacks.onOffline?.()
  })

  window.addEventListener('online', () => {
    console.log('App is back online')
  })
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    console.log('All service workers unregistered')
  }
}

export function skipWaiting() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
  }
}

export function registerServiceWorkerWithToast() {
  const toast = useToast()

  registerServiceWorker({
    onReady: () => {
      console.log('App is being served from cache by a service worker.')
    },
    onRegistered: () => {
      toast.success('應用程式已準備好離線使用')
    },
    onCached: () => {
      console.log('Content has been cached for offline use.')
    },
    onUpdateFound: () => {
      console.log('New content is downloading.')
    },
    onUpdated: (registration) => {
      toast.info('發現新版本，請重新整理頁面以更新', {
        duration: 0,
        action: {
          label: '更新',
          onClick: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }

            window.location.reload()
          },
        },
      } as any)
    },
    onOffline: () => {
      toast.warning('您目前處於離線狀態')
    },
    onError: (error) => {
      console.error('Error during service worker registration:', error)
      toast.error('Service Worker 註冊失敗')
    },
  })

  let refreshing = false
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
