import { lazy, type ComponentType } from 'react'

/**
 * Robust wrapper around React.lazy() that automatically retries failed dynamic imports.
 * Handles "Failed to fetch dynamically imported module" errors caused by network glitches,
 * dev-server compilation delays, or stale Vite module scripts.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<any>,
  retries = 3,
  interval = 600
) {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      function attempt(remaining: number) {
        componentImport()
          .then((module) => {
            if (!module) {
              reject(new Error('Module is null or undefined'))
              return
            }
            // If module has default export
            if (module.default) {
              resolve({ default: module.default })
              return
            }
            // If module has named export (first component found)
            const keys = Object.keys(module)
            const componentKey = keys.find(k => typeof module[k] === 'function')
            if (componentKey && module[componentKey]) {
              resolve({ default: module[componentKey] })
              return
            }
            // Fallback: return module as is
            resolve({ default: module })
          })
          .catch((error) => {
            console.warn(`[lazyWithRetry] Dynamic import failed, retrying (${remaining} retries left)...`, error)
            if (remaining <= 0) {
              const msg = error?.message || String(error)
              const isChunkOrFetchError =
                error?.name === 'ChunkLoadError' ||
                msg.includes('Failed to fetch dynamically imported module') ||
                msg.includes('Importing a module script failed') ||
                msg.includes('error loading dynamically imported module')

              if (isChunkOrFetchError && typeof window !== 'undefined') {
                const reloadKey = 'assomboa_last_chunk_reload'
                const lastReload = parseInt(sessionStorage.getItem(reloadKey) || '0', 10)
                const now = Date.now()
                // Only reload if we haven't reloaded in the last 10 seconds
                if (now - lastReload > 10000) {
                  sessionStorage.setItem(reloadKey, String(now))
                  window.location.reload()
                  return
                }
              }
              reject(error)
              return
            }
            setTimeout(() => attempt(remaining - 1), interval)
          })
      }
      attempt(retries)
    })
  )
}
