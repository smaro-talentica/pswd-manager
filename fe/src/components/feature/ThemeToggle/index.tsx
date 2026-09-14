import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { applyTheme, readTheme, writeTheme, type Theme } from '@/utils/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = readTheme()
    applyTheme(initial)
    return initial
  })

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    writeTheme(next)
    setTheme(next)
  }

  const toDark = theme !== 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={toDark ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={toggle}
    >
      {toDark ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('size-4 stroke-current')}>
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 14.5A8.5 8.5 0 1110 3a7 7 0 0011 11.5z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('size-4 stroke-current')}>
          <circle cx="12" cy="12" r="4" strokeWidth="2" />
          <path
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2L4.8 4.8M19.2 19.2l-1.4-1.4M17.8 6.2l1.4-1.4M6.2 17.8l-1.4 1.4"
          />
        </svg>
      )}
    </Button>
  )
}
