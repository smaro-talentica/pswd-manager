import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SecretDetails } from '@/pages/PasswordManager/SecretDetails'
import { tagClassForSecret } from './helper'
import { cn } from '@/utils/cn'
import type { DecryptedSecret } from '@/utils/secrets'

type SecretCardProps = {
  secret: DecryptedSecret
  onShare?: () => void
  onDelete?: () => void
  onRevoke: (shareId: string) => void
}

export function SecretCard({ secret, onShare, onDelete, onRevoke }: SecretCardProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <li className="flex h-full flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-4 shrink-0 p-0 text-destructive"
            aria-label="Delete secret"
            onClick={onDelete}
          >
            <svg viewBox="3 3 18 19" fill="none" aria-hidden="true" className="size-4 stroke-current">
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
              />
            </svg>
          </Button>
        ) : null}
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase',
            tagClassForSecret(secret.type, secret.fields.templateName),
          )}
        >
          {secret.fields.templateName}
        </span>
        <p className="min-w-0 flex-1 truncate font-medium">{secret.fields.title}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label={revealed ? 'Hide secret values' : 'Show secret values'}
          aria-pressed={revealed}
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 stroke-current">
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8M9.9 5.1A10.5 10.5 0 0121 12a10.5 10.5 0 01-4.1 4.9M6.1 6.1A10.5 10.5 0 003 12a10.5 10.5 0 0012.4 6.7"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 stroke-current">
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
              />
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
            </svg>
          )}
        </Button>
        {onShare ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="Share secret"
            onClick={onShare}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 stroke-current">
              <circle cx="18" cy="5" r="3" strokeWidth="2" />
              <circle cx="6" cy="12" r="3" strokeWidth="2" />
              <circle cx="18" cy="19" r="3" strokeWidth="2" />
              <path strokeWidth="2" strokeLinecap="round" d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </Button>
        ) : null}
      </div>
      <SecretDetails fields={secret.fields} revealed={revealed} />
      {secret.fromEmail ? (
        <p className="text-sm text-muted-foreground">Shared with you by {secret.fromEmail}</p>
      ) : null}
      {secret.owned && secret.shares.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {secret.shares.map((share) => (
            <li key={share.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{share.email}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => onRevoke(share.id)}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
