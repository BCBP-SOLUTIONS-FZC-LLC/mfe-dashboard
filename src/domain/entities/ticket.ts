export type DashboardView =
  | 'my-tickets'
  | 'awaiting-review'
  | 'awaiting-approval'
  | 'delegated'
  | 'all-tenders'

export type SlaState = 'on_track' | 'warning' | 'breached'

export type TicketItem = {
  id: string
  tenderTitle: string
  client: string
  stage: string
  deliverable: string
  section: string
  department: string
  roleLevel: string
  dueDate: string
  slaState: SlaState
  restricted?: boolean
  evidenceGrade?: string
  delegatedFrom?: string
  unreadComments: number
  tenderDetailsUnavailable?: boolean
  status: string
}

export type DashboardFilters = {
  status: string
  role: string
  department: string
  deadline: string
  tender: string
}

/** Every view, in the order the dashboard shows them. */
export const DASHBOARD_VIEWS: readonly DashboardView[] = ['my-tickets', 'awaiting-review', 'awaiting-approval', 'delegated', 'all-tenders']

/** Ticket counts per SLA state for one queue. */
export type SlaOverview = { total: number; onTrack: number; warning: number; breached: number }

/** Values the filters offer: departments from the tickets, roles and tender keywords as reference data. */
export type FilterOptions = {
  departments: readonly string[]
  /** Matched as a substring of `roleLevel` (e.g. 'Reviewer' matches 'Senior Reviewer'). */
  roleLevels: readonly string[]
  /** [keyword matched in the tender title, label]. */
  tenders: readonly (readonly [string, string])[]
}
