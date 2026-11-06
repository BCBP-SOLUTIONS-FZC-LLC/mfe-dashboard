// In-repo sample tickets behind the TicketRepository contract, until the ticket API exists (LLD §15
// item 1). Then a TicketApiRepository built on the platform SDK's ApiClient replaces this class in
// the composition root (src/app/providers/dependencies.ts); nothing above infrastructure changes.
import type { TicketItem } from '../../domain/entities/ticket'
import type { LoadOptions, TicketRepository } from '../../domain/repositories'
import { CalendarDay } from '../../domain/value-objects/CalendarDay'

// Due days are offsets from today, so the demo always has overdue and this-week tickets, and each
// agrees with its SLA state: breached is past due, warning is due in 1–3 days, on track in 5 or more.
type SampleTicket = Omit<TicketItem, 'dueDate'> & { dueInDays: number }

const sampleTickets: SampleTicket[] = [
  {
    id: 'T-2001',
    tenderTitle: 'IT Infrastructure Modernization',
    client: 'ABC Corporation',
    stage: 'Evaluation',
    deliverable: 'Technical Proposal',
    section: '3.2',
    department: 'IT Department',
    roleLevel: 'Senior Reviewer',
    dueInDays: 5,
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
    dueInDays: 2,
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
    dueInDays: -2,
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
    dueInDays: 1,
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
    dueInDays: -5,
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
    dueInDays: 7,
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
    dueInDays: 9,
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

/** The sample tickets with due days counted from the local day of `now`. */
export function sampleTicketsAt(now: Date): TicketItem[] {
  const today = CalendarDay.fromLocalDate(now)
  return sampleTickets.map(({ dueInDays, ...ticket }) => ({ ...ticket, dueDate: today.addDays(dueInDays).iso }))
}

/** The sample tickets, with a simulated network delay (shorter for a user's refresh). */
export class FixtureTicketRepository implements TicketRepository {
  async list({ signal, refresh = false }: LoadOptions & { refresh?: boolean }): Promise<readonly TicketItem[]> {
    await delay(refresh ? 400 : 700, signal)
    return sampleTicketsAt(new Date())
  }

  async filterReference() {
    return { roleLevels: ROLE_LEVELS, tenders: TENDERS }
  }
}

/** The sample tickets as of when this module loaded, for tests of the domain rules. */
export const FIXTURE_TICKETS: readonly TicketItem[] = sampleTicketsAt(new Date())
