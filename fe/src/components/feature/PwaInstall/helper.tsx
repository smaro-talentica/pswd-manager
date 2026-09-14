import { IOS_INSTALL_DISMISS_KEY } from './constant'
import type { BeforeInstallPromptEvent, InstallBannerKind } from './model'

type InstallListener = (event: BeforeInstallPromptEvent | null) => void

let deferredPrompt: BeforeInstallPromptEvent | null = null
let listenersAttached = false
const listeners = new Set<InstallListener>()

function readEarlyCapture(): BeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') return null
  return window.__PM_DEFERRED_INSTALL__ ?? null
}

function notify(event: BeforeInstallPromptEvent | null): void {
  deferredPrompt = event
  if (typeof window !== 'undefined') {
    window.__PM_DEFERRED_INSTALL__ = event
  }
  for (const listener of listeners) {
    listener(event)
  }
}

function onBeforeInstall(event: Event): void {
  event.preventDefault()
  notify(event as BeforeInstallPromptEvent)
}

function onInstalled(): void {
  notify(null)
}

function onEarlyCaptureEvent(): void {
  const early = readEarlyCapture()
  if (early) notify(early)
}

export function attachInstallPromptCapture(): void {
  if (typeof window === 'undefined' || listenersAttached) return
  listenersAttached = true
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('appinstalled', onInstalled)
  window.addEventListener('pm-installprompt', onEarlyCaptureEvent)
  if (!deferredPrompt) {
    const early = readEarlyCapture()
    if (early) notify(early)
  }
}

export function getCapturedInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt ?? readEarlyCapture()
}

export function subscribeInstallPrompt(listener: InstallListener): () => void {
  listeners.add(listener)
  listener(getCapturedInstallPrompt())
  return () => {
    listeners.delete(listener)
  }
}

export function clearCapturedInstallPrompt(): void {
  notify(null)
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  return window.matchMedia('(display-mode: standalone)').matches
}

export function isIosBrowser(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1
}

export function isIosInstallDismissed(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(IOS_INSTALL_DISMISS_KEY) === '1'
}

export function persistIosInstallDismissed(storage: Pick<Storage, 'setItem'>): void {
  storage.setItem(IOS_INSTALL_DISMISS_KEY, '1')
}

export function resolveInstallBannerKind(input: {
  isStandalone: boolean
  hasDeferredPrompt: boolean
  chromiumDismissedThisVisit: boolean
  isIos: boolean
  iosDismissed: boolean
}): InstallBannerKind {
  if (input.isStandalone) return 'none'
  if (input.hasDeferredPrompt) {
    return input.chromiumDismissedThisVisit ? 'none' : 'chromium-install'
  }
  if (input.isIos && !input.iosDismissed) return 'ios-howto'
  return 'none'
}
