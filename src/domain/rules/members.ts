import type { Member } from '../entities/member'

/** Members whose name, email, role or department contains `query` (case-insensitive); all for an empty query. */
export function searchMembers(members: readonly Member[], query: string): readonly Member[] {
  const q = query.trim().toLowerCase()
  if (!q) return members
  return members.filter((m) => [m.name, m.email, m.role, m.department].some((v) => v.toLowerCase().includes(q)))
}
