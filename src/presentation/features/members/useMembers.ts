import { useApi } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import type { Member } from '../../../domain/entities/member'
import { useDependencies } from '../../dependencies'

/** The tenant's members (the injected ListMembersUseCase through the SDK's useApi); undefined while loading. */
export function useMembers(): readonly Member[] | undefined {
  const { useCases } = useDependencies()
  return useApi((_api, signal) => useCases.listMembers.execute({ signal }), []).data
}
