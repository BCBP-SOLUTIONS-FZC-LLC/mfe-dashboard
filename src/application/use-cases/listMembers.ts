// Use case: the members User management lists. Framework-free; the page narrows them with the
// domain's searchMembers as the user types (no reload per keystroke).
import type { Member } from '../../domain/entities/member'
import type { LoadOptions, MemberRepository } from '../../domain/repositories'

export async function listMembers(members: MemberRepository, q: LoadOptions): Promise<readonly Member[]> {
  return members.list({ signal: q.signal })
}
