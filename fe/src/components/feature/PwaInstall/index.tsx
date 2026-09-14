import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import {
  attachInstallPromptCapture,
  clearCapturedInstallPrompt,
  getCapturedInstallPrompt,
  isIosBrowser,
  isIosInstallDismissed,
  isStandaloneDisplay,
  persistIosInstallDismissed,
  resolveInstallBannerKind,
  subscribeInstallPrompt,
} from './helper'
import type { BeforeInstallPromptEvent } from './model'

attachInstallPromptCapture()

export function PwaInstallRoot({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => getCapturedInstallPrompt(),
  )
  const [chromiumDismissedThisVisit, setChromiumDismissedThisVisit] = useState(false)
  const [iosDismissed, setIosDismissed] = useState(() =>
    typeof window === 'undefined' ? false : isIosInstallDismissed(window.localStorage),
  )
  const [standalone, setStandalone] = useState(() => isStandaloneDisplay())

  useEffect(() => subscribeInstallPrompt(setDeferredPrompt), [])

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const sync = () => setStandalone(isStandaloneDisplay())
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const isIos = isIosBrowser(navigator.userAgent, navigator.maxTouchPoints)

  const bannerKind = resolveInstallBannerKind({
    isStandalone: standalone,
    hasDeferredPrompt: deferredPrompt !== null,
    chromiumDismissedThisVisit,
    isIos,
    iosDismissed,
  })

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    clearCapturedInstallPrompt()
  }, [deferredPrompt])

  const dismissBanner = useCallback(() => {
    if (bannerKind === 'ios-howto') {
      persistIosInstallDismissed(window.localStorage)
      setIosDismissed(true)
      return
    }
    if (bannerKind === 'chromium-install') {
      setChromiumDismissedThisVisit(true)
    }
  }, [bannerKind])

  const showChromium = bannerKind === 'chromium-install'

  return (
    <>
      {bannerKind !== 'none' ? (
        <div
          className={cn(
            'border-border bg-card fixed inset-x-0 bottom-0 z-50 border-t px-4 py-3 shadow-lg sm:bottom-4 sm:mx-auto sm:max-w-md sm:rounded-lg sm:border',
          )}
          role="region"
          aria-label={showChromium ? 'Install app' : 'Add to Home Screen'}
        >
          <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center')}>
            <p className={cn('min-w-0 flex-1 text-sm text-foreground')}>
              {showChromium
                ? 'Install Password Manager for quick access from your home screen or taskbar.'
                : 'Add to Home Screen: tap Share, then Add to Home Screen.'}
            </p>
            <div className={cn('flex shrink-0 items-center gap-2')}>
              {showChromium ? (
                <Button type="button" size="sm" onClick={() => void promptInstall()}>
                  Install
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={dismissBanner}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </>
  )
}
