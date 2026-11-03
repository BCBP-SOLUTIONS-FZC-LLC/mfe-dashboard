import { useEffect, useRef } from 'react'
import { useT } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { APP_ID } from '../i18n'
import { IconPalette } from './dashboard/DashboardIcons'
import { APP_THEME_OPTIONS, type AppThemeId } from '../theme/daisyThemes'
import { dashBorderClass, dashSurfaceClass } from '../theme/themeMode'

type ThemePickerProps = {
  activeThemeId: AppThemeId
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (themeId: AppThemeId) => void
}

export function ThemePicker({ activeThemeId, open, onOpenChange, onSelect }: ThemePickerProps) {
  const t = useT(APP_ID)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) {
        return
      }
      if (target instanceof Element && target.closest('[data-theme-picker-trigger]')) {
        return
      }
      onOpenChange(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onOpenChange])

  const auraThemes = APP_THEME_OPTIONS.filter((t) => t.group === 'aura')
  const daisyThemes = APP_THEME_OPTIONS.filter((t) => t.group === 'daisy')

  return (
    <div className="relative">
      <button
        type="button"
        data-theme-picker-trigger
        onClick={() => onOpenChange(!open)}
        className="rounded-lg p-2 text-aura-muted hover:bg-aura-hover"
        aria-label={t('theme.choose')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <IconPalette className="h-5 w-5 text-aura-text" />
      </button>
      {open ? (
        <div
          ref={panelRef}
          role="listbox"
          aria-label={t('theme.list')}
          className={`absolute right-0 top-[calc(100%+0.35rem)] z-50 max-h-[min(24rem,70vh)] w-[min(100vw-2rem,14rem)] overflow-y-auto rounded-xl border py-2 shadow-lg ${dashBorderClass} ${dashSurfaceClass}`}
        >
          <p className="px-3 pb-1 pt-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-aura-muted">
            {t('theme.appThemes')}
          </p>
          {auraThemes.map((theme) => (
            <ThemeOption
              key={theme.id}
              label={theme.label}
              selected={activeThemeId === theme.id}
              onSelect={() => {
                onSelect(theme.id)
                onOpenChange(false)
              }}
            />
          ))}
          <div className={`my-1.5 border-t ${dashBorderClass}`} role="separator" />
          <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-aura-muted">
            daisyUI
          </p>
          {daisyThemes.map((theme) => (
            <ThemeOption
              key={theme.id}
              label={theme.label}
              selected={activeThemeId === theme.id}
              onSelect={() => {
                onSelect(theme.id)
                onOpenChange(false)
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ThemeOption({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-aura-hover ${
        selected ? 'bg-aura-primary-soft font-medium text-aura-primary' : 'text-aura-text'
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-aura-primary' : 'bg-aura-border'}`}
        aria-hidden
      />
      {label}
    </button>
  )
}
