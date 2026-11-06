import { storage } from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import { describe, expect, it, vi } from 'vitest'
import { FALLBACK_ENVIRONMENT, standaloneIdentity } from '../../../src/app/bootstrap/standalone'
import { startPlatform } from '../../fixtures/platform'

const render = vi.fn()
const createRoot = vi.fn(() => ({ render }))

vi.mock('react-dom/client', () => ({
  createRoot,
}))

describe('main', () => {
  it('applies the stored theme and mounts #app', async () => {
    // The standalone page's own identity; the test platform's config stands in for runtime.json.
    startPlatform({ identity: standaloneIdentity(FALLBACK_ENVIRONMENT) })
    document.body.innerHTML = '<div id="app"></div>'
    storage('dashboard').set('appTheme', 'dark')
    await import('../../../src/app/bootstrap/main')
    expect(document.documentElement.dataset.theme).toBe('dark')
    // It renders once startStandalone has set the identity and config.
    await vi.waitFor(() => expect(render).toHaveBeenCalled())
    expect(createRoot).toHaveBeenCalledWith(document.getElementById('app'))
    // Standalone has no shell RemoteBoundary: App renders inside the SDK's MFEErrorBoundary.
    const tree = (render.mock.calls[0] as unknown[])[0] as { props: { children: { type: { name: string }; props: { mfe: string } } } }
    expect(tree.props.children.type.name).toBe('MFEErrorBoundary')
    expect(tree.props.children.props.mfe).toBe('dashboard')
  })

  it('throws when #app is missing', async () => {
    vi.resetModules()
    document.body.innerHTML = ''
    await expect(import('../../../src/app/bootstrap/main')).rejects.toThrow('Root element #app not found')
  })
})
