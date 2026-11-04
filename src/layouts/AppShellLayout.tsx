import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { formatNumber } from '@bcbp-solutions-fzc-llc/frontend-sdk/i18n'
import { useLocale, useT } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { UNREAD_NOTIFICATIONS } from '../mocks/dashboardStats'
import { useDismiss } from '../hooks/useDismiss'
import { useMemberAccess } from '../hooks/useMemberAccess'
import { APP_ID } from '../i18n'
import { BrandLogo } from '../components/BrandLogo'
import {
  IconBell,
  IconCalendar,
  IconChevronDown,
  IconGlobe,
  IconHome,
  IconPowerSimple,
  IconSearch,
  IconSidebar,
  IconThemeMode,
  IconUser,
  IconUsers,
} from '../components/dashboard/DashboardIcons'
import { ThemePicker } from '../components/ThemePicker'
import type { AppThemeId } from '../theme/daisyThemes'
import { auraModeFromAppTheme } from '../theme/daisyThemes'
import {
  applyAppTheme,
  dashBorderClass,
  dashHeaderClass,
  dashShellClass,
  dashSidebarClass,
  dashSurfaceClass,
  logoThemeFromAppTheme,
  readStoredAppTheme,
  toggleThemeMode,
  type ThemeMode,
} from '../theme/themeMode'
import type { AppShellOutletContext } from './appShellContext'

type AppShellLayoutProps = {
  userLabel?: string
  onLogout?: () => void
}

function userInitials(name: string) {
  const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? parts[0]?.[1] ?? '').toUpperCase()
}

function formatDisplayName(name: string) {
  const local = name.split('@')[0] ?? name
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]!.toUpperCase()}${parts[0]!.slice(1)} ${parts[1]![0]!.toUpperCase()}.`
  }
  return local
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
    isActive
      ? 'bg-aura-primary-soft text-aura-primary'
      : 'text-aura-muted hover:bg-aura-hover hover:text-aura-text'
  }`
}

function UserMenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-aura-text hover:bg-aura-hover"
    >
      <span className="text-aura-muted">{icon}</span>
      <span className="min-w-0 flex-1">{label}</span>
      {hint ? <span className="text-xs text-aura-muted">{hint}</span> : null}
    </button>
  )
}

export function defaultLogout() {
  const app1Url = (import.meta.env.PUBLIC_APP1_URL ?? 'http://localhost:5001').replace(/\/$/, '')
  window.location.assign(app1Url)
}

export default function AppShellLayout({ userLabel: userLabelProp, onLogout = defaultLogout }: AppShellLayoutProps) {
  const t = useT(APP_ID)
  const userLabel = userLabelProp ?? t('user.default')
  const { canView: canViewMembers } = useMemberAccess()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [appTheme, setAppTheme] = useState<AppThemeId>(() => readStoredAppTheme())
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const { locale } = useLocale()
  // The locale's own name from the catalog (`language.<locale>`); t() returns the key when there is none.
  const languageKey = `language.${locale}`
  const languageName = t(languageKey) === languageKey ? locale : t(languageKey)
  const userMenuPanelRef = useRef<HTMLDivElement>(null)
  const themeMode: ThemeMode = auraModeFromAppTheme(appTheme)

  const isUserManagement = location.pathname.includes('/user-management')

  useEffect(() => {
    applyAppTheme(appTheme)
  }, [appTheme])

  const closeUserMenu = useCallback(() => setUserMenuOpen(false), [])
  useDismiss(userMenuOpen, closeUserMenu, { panelRef: userMenuPanelRef, trigger: '[data-user-menu-trigger]', menu: true })

  function toggleUserMenu() {
    setUserMenuOpen((open) => !open)
  }

  const profileMenu = userMenuOpen ? (
    <div
      ref={userMenuPanelRef}
      role="menu"
      className={`absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[14.5rem] rounded-xl border py-1 shadow-lg ${dashBorderClass} ${dashSurfaceClass}`}
    >
      <UserMenuItem
        icon={<IconUser className="h-4 w-4" />}
        label={t('userMenu.profile')}
        onClick={() => setUserMenuOpen(false)}
      />
      <UserMenuItem
        icon={<IconGlobe className="h-4 w-4" />}
        label={t('userMenu.language')}
        hint={languageName}
        onClick={() => setUserMenuOpen(false)}
      />
      <UserMenuItem
        icon={<IconThemeMode className="h-4 w-4" />}
        label={t('userMenu.themeMode')}
        hint={themeMode === 'dark' ? t('userMenu.themeDark') : t('userMenu.themeLight')}
        onClick={() => {
          setAppTheme((current) => {
            const next = toggleThemeMode(auraModeFromAppTheme(current))
            applyAppTheme(next)
            return next
          })
        }}
      />
      <UserMenuItem
        icon={<IconCalendar className="h-4 w-4" />}
        label={t('userMenu.holidays')}
        onClick={() => setUserMenuOpen(false)}
      />
      <div className={`my-1 border-t ${dashBorderClass}`} role="separator" />
      <UserMenuItem
        icon={<IconPowerSimple className="h-4 w-4" />}
        label={t('userMenu.logout')}
        onClick={() => {
          setUserMenuOpen(false)
          onLogout()
        }}
      />
    </div>
  ) : null

  const outletContext: AppShellOutletContext = { search }

  return (
    <div className={`min-h-dvh font-sans ${dashShellClass}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col transition-transform duration-200 ease-out ${dashSidebarClass} ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex justify-center px-4 pb-4 pt-5">
          <BrandLogo variant="main" theme={logoThemeFromAppTheme(appTheme)} className="!mix-blend-normal" />
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pt-3">
          <p className="px-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-aura-muted">
            {t('nav.menu')}
          </p>
          <NavLink to="/dashboard" end className={navLinkClass}>
            <IconHome className="h-[1.125rem] w-[1.125rem]" />
            {t('nav.dashboard')}
          </NavLink>
          {canViewMembers ? (
            <NavLink to="/dashboard/user-management" className={navLinkClass}>
              <IconUsers className="h-[1.125rem] w-[1.125rem]" />
              {t('nav.userManagement')}
            </NavLink>
          ) : null}
        </nav>
        <button
          type="button"
          onClick={() => onLogout()}
          className="mx-3 mb-5 mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-aura-muted hover:bg-aura-hover hover:text-aura-text"
        >
          <IconPowerSimple />
          {t('nav.logout')}
        </button>
      </aside>

      <div
        className={`flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ease-out ${
          sidebarOpen ? 'pl-[17.5rem]' : 'pl-0'
        }`}
      >
        <header
          className={`sticky top-0 z-30 flex flex-wrap items-center gap-2 px-4 py-2.5 md:gap-3 md:px-5 ${dashHeaderClass}`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex cursor-pointer rounded-lg p-2 text-aura-muted hover:bg-aura-hover"
            aria-label={sidebarOpen ? t('header.hideSidebar') : t('header.showSidebar')}
            aria-expanded={sidebarOpen}
          >
            <IconSidebar />
          </button>

          <div className="relative min-w-[12rem] flex-1 md:max-w-xl">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-aura-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isUserManagement
                  ? t('header.searchUsers')
                  : t('header.searchTickets')
              }
              className="w-full rounded-full border border-aura-border bg-aura-canvas py-2.5 pl-10 pr-4 text-sm text-aura-text outline-none ring-1 ring-transparent focus:border-aura-primary/40 focus:bg-aura-surface focus:ring-aura-primary/25"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="relative rounded-lg p-2 text-aura-muted hover:bg-aura-hover"
              aria-label={t('header.notifications')}
            >
              <IconBell className="h-5 w-5 text-aura-text" />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.55rem] font-bold text-white">
                {formatNumber(UNREAD_NOTIFICATIONS)}
              </span>
            </button>
            <ThemePicker
              activeThemeId={appTheme}
              open={themePickerOpen}
              onOpenChange={setThemePickerOpen}
              onSelect={(themeId) => setAppTheme(themeId)}
            />
            <button
              type="button"
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${dashBorderClass} bg-aura-canvas`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('header.available')}
              <IconChevronDown className="h-3.5 w-3.5 text-aura-muted" />
            </button>
            <div className="relative">
              <button
                type="button"
                data-user-menu-trigger
                onClick={toggleUserMenu}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg py-1 pl-1 pr-2 ${dashBorderClass}`}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aura-primary text-xs font-bold text-white">
                  {userInitials(userLabel)}
                </span>
                <span className="hidden text-sm font-medium text-aura-text sm:inline">
                  {formatDisplayName(userLabel)}
                </span>
                <IconChevronDown className="h-4 w-4 text-aura-muted" />
              </button>
              {profileMenu}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  )
}
