// In-repo sample members behind the MemberRepository contract, until IAM's membership endpoints
// (P-4/P-6) are reachable through the platform SDK's ApiClient (LLD §15 item 1).
import type { Member } from '../../domain/entities/member'
import type { MemberRepository } from '../../domain/repositories'

const MEMBERS: readonly Member[] = [
  {
    id: '1',
    name: 'Balaji Selvarangam',
    email: 'balaji.selvarangam@bcbpsolutions.com',
    role: 'Admin',
    department: 'IT Department',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Arjun R',
    email: 'arjun.r@bcbpsolutions.com',
    role: 'Approver',
    department: 'Engineering',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Priya N',
    email: 'priya.n@bcbpsolutions.com',
    role: 'Reviewer',
    department: 'Operations',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Samuel K',
    email: 'samuel.k@bcbpsolutions.com',
    role: 'Lead',
    department: 'Engineering',
    status: 'Invited',
  },
  {
    id: '5',
    name: 'Meera V',
    email: 'meera.v@bcbpsolutions.com',
    role: 'Reviewer',
    department: 'IT Department',
    status: 'Disabled',
  },
]

export class FixtureMemberRepository implements MemberRepository {
  async list(): Promise<readonly Member[]> {
    return MEMBERS
  }
}
