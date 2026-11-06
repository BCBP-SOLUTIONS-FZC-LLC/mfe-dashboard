// The loads besides the ticket list: a failed dashboard summary (KPI counts, filter options, SLA
// overview) and a failed or slow member list say so, offer Retry, and recover.
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NetworkError } from '@bcbp-solutions-fzc-llc/frontend-sdk/problem'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/app/App'
import type { DashboardInfo } from '../../../src/domain/entities/dashboardInfo'
import type { Member } from '../../../src/domain/entities/member'
import type { DashboardInfoRepository, MemberRepository } from '../../../src/domain/repositories'
import { FixtureDashboardInfoRepository } from '../../../src/infrastructure/fixtures/dashboardInfo'
import { FixtureMemberRepository } from '../../../src/infrastructure/fixtures/members'
import UserManagementPage from '../../../src/presentation/pages/UserManagementPage'
import { testDependencies, withDependencies } from '../../fixtures/dependencies'
import { startPlatform } from '../../fixtures/platform'

afterEach(() => {
  vi.restoreAllMocks()
})

/** Fails while `failing` is true, then answers as the fixture. */
class FlakyInfo extends FixtureDashboardInfoRepository implements DashboardInfoRepository {
  failing = true
  override async get(): Promise<DashboardInfo> {
    if (this.failing) throw new NetworkError(false, 'req-info')
    return super.get()
  }
}

class FlakyMembers extends FixtureMemberRepository implements MemberRepository {
  failing = true
  override async list(o: Parameters<MemberRepository['list']>[0]): Promise<readonly Member[]> {
    if (this.failing) throw new NetworkError(false, 'req-members')
    return super.list(o)
  }
}

/** Never settles: the member list stays loading. */
class PendingMembers extends FixtureMemberRepository implements MemberRepository {
  override list(): Promise<readonly Member[]> {
    return new Promise(() => {})
  }
}

function renderMembers(members: MemberRepository) {
  const { Wrapper } = startPlatform({ permissions: ['read:members'] })
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<OutletWithSearch />}>
          <Route index element={<UserManagementPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { wrapper: withDependencies(testDependencies({ members }), Wrapper) },
  )
}

/** The shell layout's outlet context, without the rest of the layout. */
function OutletWithSearch() {
  return <Outlet context={{ search: '' }} />
}

describe('dashboard summary failure', () => {
  it('shows an alert with Retry, logs it, and recovers', async () => {
    const platform = startPlatform()
    const info = new FlakyInfo()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App userLabel="Ada" />
      </MemoryRouter>,
      { wrapper: withDependencies(testDependencies({ dashboardInfo: info }), platform.Wrapper) },
    )
    const alert = await screen.findByText('Ticket counts, filter options and the SLA overview could not be loaded.')
    expect(alert.closest('[role="alert"]')).not.toBeNull()
    expect(platform.logs.some((l) => l.body === 'dashboard summary failed to load' && l.level === 'warn')).toBe(true)

    info.failing = false
    await userEvent.click(within(alert.closest('[role="alert"]') as HTMLElement).getByRole('button', { name: 'Retry' }))
    await act(async () => {})
    expect(screen.queryByText('Ticket counts, filter options and the SLA overview could not be loaded.')).not.toBeInTheDocument()
  })
})

describe('member list', () => {
  it('shows a loading row and marks the table busy until the members arrive', async () => {
    renderMembers(new PendingMembers())
    expect(await screen.findByText('Loading users…')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('No users match your search.')).not.toBeInTheDocument()
  })

  it('shows a failure with Retry, then the members', async () => {
    const members = new FlakyMembers()
    renderMembers(members)
    expect(await screen.findByRole('alert')).toHaveTextContent('Users could not be loaded.')
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false')

    members.failing = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Balaji Selvarangam')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
