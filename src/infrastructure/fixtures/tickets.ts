// In-repo sample tickets behind the TicketRepository contract, until the ticket API exists (LLD §15
// item 1). Then a TicketApiRepository built on the platform SDK's ApiClient replaces this class in
// the composition root (src/app/providers/dependencies.ts); nothing above infrastructure changes.
import type { TicketItem } from '../../domain/entities/ticket'
import type { LoadOptions, TicketRepository } from '../../domain/repositories'

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

/** Resolves after `ms` unless `signal` aborts first (a superseded load then never settles). */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => window.clearTimeout(timer), { once: true })
  })
}

/** Role filters and tender keywords: reference data that will come from IAM and the tender service. */
const ROLE_LEVELS: readonly string[] = ['Reviewer', 'Approver', 'Lead']
const TENDERS: readonly (readonly [string, string])[] = [
  ['IT', 'IT Infrastructure'],
  ['Software', 'Software'],
  ['Hardware', 'Hardware'],
]

/** The sample tickets, with a simulated network delay (shorter for a user's refresh). */
export class FixtureTicketRepository implements TicketRepository {
  async list({ signal, refresh = false }: LoadOptions & { refresh?: boolean }): Promise<readonly TicketItem[]> {
    await delay(refresh ? 400 : 700, signal)
    return baseTickets
  }

  async filterReference() {
    return { roleLevels: ROLE_LEVELS, tenders: TENDERS }
  }
}

/** The sample tickets themselves, for tests of the domain rules. */
export const FIXTURE_TICKETS: readonly TicketItem[] = baseTickets
