import type { ThemeMode } from '../theme/themeMode'

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
    const src =
      theme === 'dark' ? '/image/logo-main-white.png' : '/image/logo-main-black.png'
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
      src="/image/logo.png"
      alt="Beyond Code"
      width={size}
      height={size}
      className={`object-contain mix-blend-lighten ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
