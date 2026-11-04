import { storage } from '@bcbp-solutions-fzc-llc/frontend-sdk/storage'
import { describe, expect, it, vi } from 'vitest'

const render = vi.fn()
const createRoot = vi.fn(() => ({ render }))

vi.mock('react-dom/client', () => ({
  createRoot,
}))

describe('main', () => {
  it('applies the stored theme and mounts #app', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    storage('app2').set('appTheme', 'dark')
    await import('../../../src/main')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(createRoot).toHaveBeenCalledWith(document.getElementById('app'))
    expect(render).toHaveBeenCalled()
    // Standalone has no shell RemoteBoundary: App renders inside the SDK's MFEErrorBoundary.
    const tree = (render.mock.calls[0] as unknown[])[0] as { props: { children: { type: { name: string }; props: { mfe: string } } } }
    expect(tree.props.children.type.name).toBe('MFEErrorBoundary')
    expect(tree.props.children.props.mfe).toBe('app2')
  })

  it('throws when #app is missing', async () => {
    vi.resetModules()
    document.body.innerHTML = ''
    await expect(import('../../../src/main')).rejects.toThrow('Root element #app not found')
  })
})
