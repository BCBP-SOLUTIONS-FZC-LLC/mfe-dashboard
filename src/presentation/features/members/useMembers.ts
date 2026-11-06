import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { listMembers } from '../../../application/use-cases/listMembers'
import type { Member } from '../../../domain/entities/member'
import { useDependencies } from '../../dependencies'

/** The tenant's members (the listMembers use case through the SDK's useApi); undefined while loading. */
export function useMembers(): readonly Member[] | undefined {
  const { members } = useDependencies()
  return useApi((_api, signal) => listMembers(members, { signal }), []).data
}
