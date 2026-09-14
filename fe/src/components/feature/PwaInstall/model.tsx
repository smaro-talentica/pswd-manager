export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export type InstallBannerKind = 'none' | 'chromium-install' | 'ios-howto'

declare global {
  interface Window {
    __PM_DEFERRED_INSTALL__?: BeforeInstallPromptEvent | null
  }
}
