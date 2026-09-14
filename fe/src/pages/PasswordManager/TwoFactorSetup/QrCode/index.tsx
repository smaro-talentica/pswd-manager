import { QRCodeSVG } from 'qrcode.react'

export function QrCode({ value }: { value: string }) {
  if (!value) {
    return null
  }
  return (
    <div className="inline-flex bg-white p-1">
      <QRCodeSVG
        value={value}
        size={256}
        level="M"
        marginSize={4}
        title="QR code for authenticator app"
      />
    </div>
  )
}
