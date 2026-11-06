import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../../../src/app/App'
import { startPlatform } from '../../fixtures/platform'

const anHourAgo = () => Math.floor(Date.now() / 1000) - 3600

async function openApprovals(mfaFreshnessSeconds: number) {
  // The session context (and its MFA window) reaches the remote through the shell's PlatformProvider.
  const { Wrapper } = startPlatform({
    user: { sub: 'u-1', email: 'ada@example.com', authTime: anHourAgo() },
    context: { mfaFreshnessSeconds },
  })
  render(
    <MemoryRouter initialEntries={['/']}>
      <App userLabel="Ada" />
    </MemoryRouter>,
    { wrapper: Wrapper },
  )
  await userEvent.click((await screen.findAllByRole('button', { name: /Awaiting My Approval/ }))[0]!)
}

describe('approval step-up (SDK useStepUp)', () => {
  it('asks for MFA when the login is older than the tenant window', async () => {
    await openApprovals(300)
    expect(await screen.findByText(/MFA re-authentication required/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Re-authenticate' }))
  })

  it('does not ask within the window', async () => {
    await openApprovals(7200)
    expect(screen.queryByText(/MFA re-authentication required/)).not.toBeInTheDocument()
  })
})
