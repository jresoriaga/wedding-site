'use client'
import { useEffect, useRef } from 'react'

interface AdBannerProps {
  /** Your AdSense publisher ID — format: ca-pub-XXXXXXXXXXXXXXXX */
  adClient: string
  /** The specific ad-slot ID from your AdSense dashboard */
  adSlot: string
  adFormat?: string
  fullWidthResponsive?: boolean
  className?: string
}

declare global {
  var adsbygoogle: unknown[]
}

/**
 * Renders a single Google AdSense ad unit.
 * Place the global AdSense <Script> tag in app/layout.tsx once;
 * drop <AdBanner> wherever you want an ad slot.
 */
export default function AdBanner({
  adClient,
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}: Readonly<AdBannerProps>) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      globalThis.adsbygoogle = globalThis.adsbygoogle || []
      globalThis.adsbygoogle.push({})
    } catch {
      // AdSense not loaded yet — script may still be initialising
    }
  }, [])

  return (
    <div className={`overflow-hidden ${className}`} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={String(fullWidthResponsive)}
      />
    </div>
  )
}
