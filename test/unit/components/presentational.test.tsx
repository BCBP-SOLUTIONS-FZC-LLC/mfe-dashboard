import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BrandLogo } from '../../../src/components/BrandLogo'
import { FilterSelect } from '../../../src/pages/DashboardPage'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBell,
  IconBuilding,
  IconCalendar,
  IconChat,
  IconCheckCircle,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconClose,
  IconDocument,
  IconDocumentMotion,
  IconEmptyDoc,
  IconEvidenceGrade,
  IconEye,
  IconFilter,
  IconGlobe,
  IconHome,
  IconLoading,
  IconLock,
  IconPalette,
  IconPowerSimple,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSidebar,
  IconThemeMode,
  IconUser,
  IconUserSwap,
  IconUsers,
  KpiViewIcon,
  TicketTypeIcon,
} from '../../../src/components/dashboard/DashboardIcons'
import { TicketRow } from '../../../src/components/dashboard/TicketRow'
import { ThemePicker } from '../../../src/components/ThemePicker'
import { ticketsForView } from '../../../src/mocks/dashboardTickets'
import type { TicketItem } from '../../../src/types/ticket'

const views = ['my-tickets', 'awaiting-review', 'awaiting-approval', 'delegated', 'all-tenders'] as const

describe('presentational components', () => {
  it('renders both logo variants', () => {
    const { rerender } = render(<BrandLogo />)
    // Bundled imports, not public '/image/…' paths (those load from the shell's origin in the shell).
    expect(screen.getByAltText('Beyond Code').getAttribute('src')).toMatch(/assets\/images\/logo\.png$/)
    rerender(<BrandLogo variant="main" theme="dark" className="extra" size={80} />)
    expect(screen.getByAltText('BCBP Solutions').getAttribute('src')).toMatch(/logo-main-white\.png$/)
    rerender(<BrandLogo variant="main" theme="light" />)
    expect(screen.getByAltText('BCBP Solutions').getAttribute('src')).toMatch(/logo-main-black\.png$/)
  })

  it('renders every icon export', () => {
    const icons = [
      IconSidebar,
      IconSettings,
      IconHome,
      IconPowerSimple,
      IconSearch,
      IconBell,
      IconChevronDown,
      IconChevronRight,
      IconFilter,
      IconClose,
      IconRefresh,
      IconDocument,
      IconEye,
      IconCheckCircle,
      IconUserSwap,
      IconDocumentMotion,
      IconBuilding,
      IconUser,
      IconUsers,
      IconGlobe,
      IconPalette,
      IconThemeMode,
      IconCalendar,
      IconLock,
      IconChat,
      IconEvidenceGrade,
      IconClock,
      IconAlertCircle,
      IconAlertTriangle,
      IconLoading,
      IconEmptyDoc,
    ]
    render(
      <div>
        {icons.map((Icon, index) => (
          <Icon key={index} />
        ))}
        {views.map((view) => (
          <KpiViewIcon key={view} view={view} />
        ))}
        <TicketTypeIcon />
      </div>,
    )
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(icons.length)
  })

  it('shows restricted, delegated, and unavailable ticket details', () => {
    const restricted = ticketsForView('my-tickets', true).find((ticket) => ticket.id === 'T-2001')!
    const unavailable = ticketsForView('my-tickets', true).find((ticket) => ticket.id === 'T-1015')!
    const delegated = ticketsForView('delegated', true)[0]!
    const bare: TicketItem = {
      ...unavailable,
      restricted: false,
      evidenceGrade: undefined,
      delegatedFrom: undefined,
      unreadComments: 0,
      tenderDetailsUnavailable: false,
      slaState: 'warning',
    }
    const { rerender } = render(<TicketRow ticket={restricted} />)
    expect(screen.getByText('Restricted')).toBeInTheDocument()
    expect(screen.getByText('Evidence Grade A')).toBeInTheDocument()
    rerender(<TicketRow ticket={unavailable} />)
    expect(screen.getByText(/Tender details unavailable/)).toBeInTheDocument()
    rerender(<TicketRow ticket={delegated} />)
    expect(screen.getByText(`From ${delegated.delegatedFrom}`)).toBeInTheDocument()
    rerender(<TicketRow ticket={bare} />)
    expect(screen.queryByText('Restricted')).not.toBeInTheDocument()
  })

  it('opens the theme picker, selects a theme, and ignores a click inside the panel', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    render(
      <ThemePicker activeThemeId="light" open onOpenChange={onOpenChange} onSelect={onSelect} />,
    )
    await user.click(screen.getByRole('menuitemradio', { name: 'Dark mode' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Cupcake' }))
    expect(onSelect).toHaveBeenCalledWith('cupcake')
    expect(onSelect).toHaveBeenCalledWith('dark')
    expect(onOpenChange).toHaveBeenCalledWith(false)

    onOpenChange.mockClear()
    await user.click(screen.getByRole('menu', { name: 'Themes' }))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes the theme picker on an outside click and toggles from the trigger', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const closed = render(
      <ThemePicker activeThemeId="light" open={false} onOpenChange={onOpenChange} onSelect={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: 'Choose theme' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    closed.unmount()
    onOpenChange.mockClear()
    render(
      <div>
        <button type="button">outside</button>
        <ThemePicker
          activeThemeId="dark"
          open
          onOpenChange={onOpenChange}
          onSelect={vi.fn()}
        />
      </div>,
    )
    await user.click(screen.getByRole('button', { name: 'outside' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    onOpenChange.mockClear()
    await user.click(screen.getByRole('button', { name: 'Choose theme' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders both filter select layouts', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <FilterSelect label="Role" value="all" onChange={onChange} options={[['all', 'All Roles'], ['Lead', 'Lead']]} />,
    )
    await user.selectOptions(screen.getByLabelText('Role'), 'Lead')
    expect(onChange).toHaveBeenCalledWith('Lead')
    rerender(
      <FilterSelect
        label="Status"
        value="all"
        stacked
        onChange={onChange}
        options={[['all', 'All Open']]}
      />,
    )
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
  })
})
