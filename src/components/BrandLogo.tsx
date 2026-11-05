import type { ThemeMode } from '../theme/themeMode'
// Imported, not root-relative public paths: inside web-shell the page origin is the shell's, so
// '/image/…' would load from the shell. Imports are emitted under assets/ and resolved against the
// remote's own public path (where remoteEntry.js was loaded from).
import logoMark from '../assets/images/logo.png'
import logoMainBlack from '../assets/images/logo-main-black.png'
import logoMainWhite from '../assets/images/logo-main-white.png'

type BrandLogoProps = {
  className?: string
  size?: number
  /** Full wordmark for dashboard sidebar */
  variant?: 'mark' | 'main'
  theme?: ThemeMode
}

/** Brand logo — cube mark or theme-aware main wordmark. */
export function BrandLogo({
  className = '',
  size = 52,
  variant = 'mark',
  theme = 'light',
}: BrandLogoProps) {
  if (variant === 'main') {
    const src = theme === 'dark' ? logoMainWhite : logoMainBlack
    return (
      <img
        src={src}
        alt="BCBP Solutions"
        className={`mx-auto h-11 w-auto max-w-[12.5rem] object-contain object-center ${className}`}
      />
    )
  }

  return (
    <img
      src={logoMark}
      alt="Beyond Code"
      width={size}
      height={size}
      className={`object-contain mix-blend-lighten ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
