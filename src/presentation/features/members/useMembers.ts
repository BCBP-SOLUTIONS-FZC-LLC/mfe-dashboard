import type { Member } from '../../../domain/entities/member'
import { useDependencies } from '../../dependencies'
import { useLoadable, type Loadable } from '../useLoadable'

/** The tenant's members (the injected ListMembersUseCase through the SDK's useApi); a failed load is `failed`, with `retry`. */
export function useMembers(): Loadable<readonly Member[]> {
  const { useCases } = useDependencies()
  return useLoadable('members', (signal) => useCases.listMembers.execute({ signal }), [])
}
