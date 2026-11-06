import { useEffect } from 'react'
import { getLogger } from '@bcbp-solutions-fzc-llc/frontend-sdk/logging'
import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { APP_ID } from '../../shared/constants/app'

/** A load's result for the UI: the data once loaded, whether the last load failed, and a retry. */
export type Loadable<T> = {
  /** The loaded value; undefined while the first load runs or after a failed one. */
  data: T | undefined
  /** The last load failed with an SDK ApiError (network, timeout, API problem) and is not retrying. */
  failed: boolean
  /** Load again (the "Retry" button). */
  retry: () => void
}

/**
 * `load` through the SDK's useApi (ADR 0002), with the failure kept for the UI instead of dropped,
 * and logged once through the SDK logger as `<what> failed to load`. Other exceptions go to the
 * error boundary, as useApi does.
 */
export function useLoadable<T>(what: string, load: (signal: AbortSignal) => Promise<T>, deps: unknown[]): Loadable<T> {
  const { data, error, loading, reload } = useApi<T>((_api, signal) => load(signal), deps)

  useEffect(() => {
    if (error) getLogger({ mfe: APP_ID }).warn(`${what} failed to load`, { error })
  }, [error, what])

  return { data, failed: error !== undefined && !loading, retry: reload }
}
