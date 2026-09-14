import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AppRoute from './AppRoute'
import { registerSW } from 'virtual:pwa-register'
import { attachInstallPromptCapture } from '@/components/feature/PwaInstall/helper'
import { unregisterDevServiceWorkers } from '@/utils/service-worker'
import { applyTheme, readTheme } from '@/utils/theme'
import './global.css'

attachInstallPromptCapture()

async function boot() {
  applyTheme(readTheme())
  if (!import.meta.env.DEV) {
    registerSW({ immediate: true })
  }
  if (await unregisterDevServiceWorkers()) {
    location.reload()
    return
  }

  const queryClient = new QueryClient()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRoute />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void boot()

