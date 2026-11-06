// Use case: the members User management lists. Framework-free; the page narrows them with the
// domain's searchMembers as the user types (no reload per keystroke).
import type { Member } from '../../domain/entities/member'
import type { LoadOptions, MemberRepository } from '../../domain/repositories'

export class ListMembersUseCase {
  private readonly members: MemberRepository

  constructor(members: MemberRepository) {
    this.members = members
  }

  execute(q: LoadOptions): Promise<readonly Member[]> {
    return this.members.list({ signal: q.signal })
  }
}
