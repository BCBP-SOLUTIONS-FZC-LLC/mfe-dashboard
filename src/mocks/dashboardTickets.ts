import type { TicketItem } from '../types/ticket'

const baseTickets: TicketItem[] = [
  {
    id: 'T-2001',
    tenderTitle: 'IT Infrastructure Modernization',
    client: 'ABC Corporation',
    stage: 'Evaluation',
    deliverable: 'Technical Proposal',
    section: '3.2',
    department: 'IT Department',
    roleLevel: 'Senior Reviewer',
    dueDate: '2026-10-25',
    slaState: 'on_track',
    restricted: true,
    evidenceGrade: 'Evidence Grade A',
    unreadComments: 2,
    status: 'open',
  },
  {
    id: 'T-2002',
    tenderTitle: 'Software Development Framework',
    client: 'XYZ Technologies',
    stage: 'Technical Review',
    deliverable: 'Architecture Document',
    section: '2.1',
    department: 'Engineering',
    roleLevel: 'Technical Lead',
    dueDate: '2026-10-22',
    slaState: 'warning',
    evidenceGrade: 'Evidence Grade B',
    unreadComments: 1,
    status: 'open',
  },
  {
    id: 'T-2003',
    tenderTitle: 'Hardware Integration Project',
    client: 'Government Agency',
    stage: 'Evaluation',
    deliverable: 'Integration Plan',
    section: '4.5',
    department: 'Operations',
    roleLevel: 'Project Manager',
    dueDate: '2026-10-18',
    slaState: 'breached',
    unreadComments: 3,
    status: 'open',
  },
  {
    id: 'T-2004',
    tenderTitle: 'Metro Line Extension — Phase 2',
    client: 'City Transport Authority',
    stage: 'Design review',
    deliverable: 'Structural package',
    section: 'Bridges',
    department: 'Engineering',
    roleLevel: 'Senior Reviewer',
    dueDate: '2026-10-16',
    slaState: 'warning',
    restricted: true,
    evidenceGrade: 'Evidence Grade A',
    unreadComments: 3,
    status: 'open',
  },
  {
    id: 'T-1038',
    tenderTitle: 'Hospital Campus Redevelopment',
    client: 'North Health Trust',
    stage: 'Final approval',
    deliverable: 'MEP coordination',
    section: 'Mechanical',
    department: 'MEP',
    roleLevel: 'Approver',
    dueDate: '2026-10-15',
    slaState: 'breached',
    unreadComments: 1,
    status: 'approval',
  },
  {
    id: 'T-1021',
    tenderTitle: 'Offshore Wind Substation',
    client: 'BlueCurrent Energy',
    stage: 'Peer review',
    deliverable: 'Safety case',
    section: 'HSE',
    department: 'Compliance',
    roleLevel: 'Reviewer',
    dueDate: '2026-10-20',
    slaState: 'on_track',
    evidenceGrade: 'Evidence Grade B',
    delegatedFrom: 'Arjun R',
    unreadComments: 0,
    status: 'review',
  },
  {
    id: 'T-1015',
    tenderTitle: 'Data Centre — Tier IV',
    client: 'CloudScale Ltd',
    stage: 'Tender in flight',
    deliverable: 'Cost plan',
    section: 'Commercial',
    department: 'Estimating',
    roleLevel: 'Lead',
    dueDate: '2026-10-22',
    slaState: 'on_track',
    unreadComments: 5,
    status: 'open',
    tenderDetailsUnavailable: true,
  },
]

// Filter options, kept next to the data they filter. Departments come from the tickets themselves;
// with real data they come from IAM (the tenant's departments) and the tender service.
/** Every department in the tickets, sorted. */
export const DEPARTMENT_OPTIONS: readonly string[] = [...new Set(baseTickets.map((t) => t.department))].sort()
/** Role filters: matched as a substring of `roleLevel` (e.g. 'Reviewer' matches 'Senior Reviewer'). */
export const ROLE_OPTIONS: readonly string[] = ['Reviewer', 'Approver', 'Lead']
/** Tender filters: [keyword matched in the tender title, label]. */
export const TENDER_OPTIONS: readonly (readonly [string, string])[] = [
  ['IT', 'IT Infrastructure'],
  ['Software', 'Software'],
  ['Hardware', 'Hardware'],
]

export function ticketsForView(view: string, canSeeAllTenders: boolean): TicketItem[] {
  switch (view) {
    case 'my-tickets':
      return baseTickets
        .filter((t) => t.status === 'open' && !t.delegatedFrom)
        .sort((a, b) => {
          const order = { breached: 0, warning: 1, on_track: 2 }
          const bySla = order[a.slaState] - order[b.slaState]
          if (bySla !== 0) {
            return bySla
          }
          return a.dueDate.localeCompare(b.dueDate)
        })
    case 'awaiting-review':
      return baseTickets.filter((t) => t.status === 'review')
    case 'awaiting-approval':
      return baseTickets.filter((t) => t.status === 'approval')
    case 'delegated':
      return baseTickets.filter((t) => Boolean(t.delegatedFrom))
    case 'all-tenders':
      return canSeeAllTenders ? baseTickets : []
    default:
      return []
  }
}
