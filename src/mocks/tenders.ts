import type {
  AccessGrant,
  ActivityItem,
  ClarificationItem,
  DecisionItem,
  DeliverableItem,
  GapItem,
  IntakeItem,
  KtiField,
  KtiGroup,
  RiskItem,
  StageWorkflow,
  SubmissionRecord,
  TenderDetail,
  TenderDocument,
  TenderListItem,
} from '../types/tender'

export const MOCK_TENDERS: TenderListItem[] = [
  {
    id: 'tnd-1001',
    reference: 'TN-2026-041',
    title: 'Coastal Highway Package B',
    client: 'National Roads Authority',
    lifecycleState: 'Bid preparation',
    stageState: 'In progress',
    stageName: 'Technical response',
    submissionDeadline: '2026-11-18T16:00:00Z',
    ownerDepartment: 'Civil',
    restricted: false,
    lastActivity: '2026-10-29T09:12:00Z',
    assignedTo: 'A. Mendes',
  },
  {
    id: 'tnd-1002',
    reference: 'TN-2026-052',
    title: 'Port Substation Expansion',
    client: 'Gulf Port Authority',
    lifecycleState: 'Qualification',
    stageState: 'Paused',
    stageName: 'Bid / no-bid',
    submissionDeadline: '2026-11-05T12:00:00Z',
    ownerDepartment: 'Power',
    restricted: true,
    lastActivity: '2026-10-28T15:40:00Z',
    assignedTo: 'R. Okonkwo',
  },
  {
    id: 'tnd-1003',
    reference: 'TN-2026-033',
    title: 'Village Water Network Phase 2',
    client: 'Ministry of Rural Development',
    lifecycleState: 'Intake',
    stageState: 'Not started',
    stageName: 'Intake',
    submissionDeadline: '2026-12-02T17:00:00Z',
    ownerDepartment: 'Water',
    restricted: false,
    lastActivity: '2026-10-27T11:05:00Z',
    assignedTo: 'Unassigned',
  },
  {
    id: 'tnd-1004',
    reference: 'TN-2026-019',
    title: 'Refinery Turnaround Scaffolding',
    client: 'PetroChem Gulf',
    lifecycleState: 'Submitted',
    stageState: 'Complete',
    stageName: 'Submission',
    submissionDeadline: '2026-10-12T14:00:00Z',
    ownerDepartment: 'Industrial',
    restricted: true,
    lastActivity: '2026-10-12T13:58:00Z',
    assignedTo: 'S. Patel',
  },
]

export const MOCK_INTAKE: IntakeItem[] = [
  {
    id: 'inq-801',
    receivedAt: '2026-10-29T07:22:00Z',
    source: 'email',
    proposedClassification: 'Design & build',
    proposedRegime: 'Public works',
    documents: ['ITT.pdf', 'BoQ.xlsx', 'Drawings.zip'],
    claimedRoles: ['Main contractor', 'JV lead'],
    completeness: 'Partial',
    extractionProgress: 72,
    status: 'Pending',
  },
  {
    id: 'inq-802',
    receivedAt: '2026-10-28T18:05:00Z',
    source: 'upload',
    proposedClassification: 'Framework call-off',
    proposedRegime: 'Utilities',
    documents: ['RFQ.pdf'],
    claimedRoles: ['Specialist subcontractor'],
    completeness: 'Complete',
    extractionProgress: 100,
    status: 'Pending',
  },
  {
    id: 'inq-803',
    receivedAt: '2026-10-27T10:41:00Z',
    source: 'email',
    proposedClassification: 'Consultancy',
    proposedRegime: 'Private',
    documents: ['Brief.docx'],
    claimedRoles: ['Designer'],
    completeness: 'Insufficient',
    extractionProgress: 34,
    status: 'Pending',
  },
]

const KTI_GROUPS: KtiGroup[] = [
  'Submission mechanics',
  'Commercial terms',
  'Risk / liability',
  'Legal / jurisdictional',
  'Delivery obligations',
  'Correspondence',
]

const KTI_LABELS: Record<KtiGroup, string[]> = {
  'Submission mechanics': [
    'Submission deadline',
    'Submission channel',
    'Portal URL',
    'Required formats',
    'Electronic vs hard copy',
    'Number of copies',
    'Envelope structure',
    'Language of submission',
    'Page limits',
    'Mandatory forms',
    'Bid bond required',
    'Bid bond amount',
  ],
  'Commercial terms': [
    'Contract value estimate',
    'Currency',
    'Payment terms',
    'Retention',
    'Advance payment',
    'Price adjustment',
    'Taxes & duties',
    'Incoterms',
    'Liquidated damages',
    'Bonus for early completion',
    'Insurance requirements',
    'Performance bond',
  ],
  'Risk / liability': [
    'Liability cap',
    'Consequential damages',
    'Indemnities',
    'Force majeure',
    'Ground conditions risk',
    'Design risk allocation',
    'Interface risk',
    'Delay damages formula',
    'Termination for convenience',
    'Warranty period',
    'Defects liability',
    'Parent company guarantee',
  ],
  'Legal / jurisdictional': [
    'Governing law',
    'Dispute resolution',
    'Arbitration seat',
    'Court jurisdiction',
    'Language of contract',
    'Sanctions clauses',
    'Anti-bribery requirements',
    'Data protection',
    'IP ownership',
    'Confidentiality term',
    'Export controls',
    'Local content rules',
  ],
  'Delivery obligations': [
    'Scope summary',
    'Key milestones',
    'Programme duration',
    'Access constraints',
    'Working hours',
    'HSE standards',
    'QA/QC requirements',
    'Key personnel',
    'Subcontracting limits',
    'Client-furnished items',
    'Testing & commissioning',
    'Training & handover',
  ],
  Correspondence: [
    'Client contact',
    'Clarification deadline',
    'Clarification channel',
    'Site visit date',
    'Pre-bid meeting',
    'Addendum process',
    'Communication language',
    'Copy list requirements',
    'Confidential marking',
    'Return of documents',
  ],
}

function buildKtiFields(): KtiField[] {
  const fields: KtiField[] = []
  let n = 0
  for (const group of KTI_GROUPS) {
    for (const label of KTI_LABELS[group]) {
      n += 1
      const outcome = n % 11 === 0 ? 'Not applicable' : n % 7 === 0 ? 'Not found' : 'Found'
      fields.push({
        id: `kti-${n}`,
        group,
        label,
        value:
          outcome === 'Found'
            ? n % 5 === 0
              ? 'See clause summary'
              : `Sample value ${n}`
            : outcome === 'Not applicable'
              ? '—'
              : '',
        outcome,
        sourceDocument: outcome === 'Found' ? 'ITT.pdf' : undefined,
        sourcePage: outcome === 'Found' ? (n % 40) + 1 : undefined,
        sourceClause: outcome === 'Found' ? `§${(n % 12) + 1}.${(n % 5) + 1}` : undefined,
        correctedBy: n % 13 === 0 ? 'Tender Admin' : undefined,
        translated: n % 9 === 0,
      })
    }
  }
  return fields
}

export const MOCK_KTI_FIELDS = buildKtiFields()

export function getTenderDetail(id: string): TenderDetail | undefined {
  const base = MOCK_TENDERS.find((t) => t.id === id)
  if (!base) return undefined
  return {
    ...base,
    description:
      'Design, procurement and construction package covering civil works, utilities interfaces and commissioning support.',
    gapCount: 6,
    clarificationCount: 3,
    deliverableEvidence: '12/18 sections evidenced',
    userTasks: [
      { id: 'task-1', title: 'Confirm LD formula', due: '2026-10-31' },
      { id: 'task-2', title: 'Upload HSE plan v2', due: '2026-11-02' },
      { id: 'task-3', title: 'Review commercial risks', due: '2026-11-03' },
    ],
    timeline: [
      { label: 'Enquiry received', at: '2026-10-20', done: true },
      { label: 'Intake accepted', at: '2026-10-21', done: true },
      { label: 'Qualification', at: '2026-10-24', done: true },
      { label: 'Bid preparation', at: '2026-10-26', done: false },
      { label: 'Submission', at: '2026-11-18', done: false },
    ],
  }
}

export const MOCK_DOCUMENTS: TenderDocument[] = [
  {
    id: 'doc-1',
    name: 'ITT.pdf',
    role: 'Instruction to tenderers',
    version: 'v3',
    parseStatus: 'Indexed',
    language: 'en',
    translationAvailable: false,
    sha256: 'a3f1…9c2e',
  },
  {
    id: 'doc-2',
    name: 'Conditions of Contract.pdf',
    role: 'Contract',
    version: 'v1',
    parseStatus: 'Indexed',
    language: 'en',
    translationAvailable: true,
    sha256: '88b0…11ad',
  },
  {
    id: 'doc-3',
    name: 'Addendum-02.pdf',
    role: 'Addendum',
    version: 'v1',
    parseStatus: 'Parsing',
    language: 'en',
    translationAvailable: false,
    addendumImpact: 'Deadline extended by 7 days; BoQ sheet 4 replaced.',
  },
  {
    id: 'doc-4',
    name: 'Drawings-package.zip',
    role: 'Drawings',
    version: 'v2',
    parseStatus: 'Quarantined',
    language: 'n/a',
    translationAvailable: false,
  },
  {
    id: 'doc-5',
    name: 'BoQ.xlsx',
    role: 'Commercial',
    version: 'v2',
    parseStatus: 'Indexed',
    language: 'en',
    translationAvailable: false,
    sha256: 'c01d…77fe',
  },
]

export const MOCK_RISKS: RiskItem[] = [
  {
    id: 'risk-1',
    category: 'Commercial',
    title: 'LD rate exceeds contingency',
    severity: 'High',
    contributingFields: ['Liquidated damages', 'Programme duration'],
    evidence: 'ITT §8.2 — 0.5%/day uncapped',
    departmentInput: 'Commercial recommends cap negotiation',
  },
  {
    id: 'risk-2',
    category: 'Contractual',
    title: 'Unlimited consequential liability',
    severity: 'Critical',
    contributingFields: ['Liability cap', 'Consequential damages'],
    evidence: 'Conditions cl. 17.4 silent on consequential damages',
  },
  {
    id: 'risk-3',
    category: 'Delivery',
    title: 'Restricted site access windows',
    severity: 'Medium',
    contributingFields: ['Access constraints', 'Working hours'],
    evidence: 'Addendum-01 night works only on Span 3',
    departmentInput: 'Civil can absorb with extended programme',
  },
]

export const MOCK_STAGES: StageWorkflow[] = [
  {
    id: 'st-1',
    stageName: 'Intake',
    workflowBinding: 'wf-intake-v2',
    stageState: 'Complete',
    workflowInstanceState: 'Completed',
    progress: 100,
    assignees: ['Tender Admin'],
  },
  {
    id: 'st-2',
    stageName: 'Bid / no-bid',
    workflowBinding: 'wf-bnb-v1',
    stageState: 'Complete',
    workflowInstanceState: 'Completed',
    progress: 100,
    assignees: ['Tender Admin', 'Commercial'],
  },
  {
    id: 'st-3',
    stageName: 'Technical response',
    workflowBinding: 'wf-tech-v3',
    stageState: 'In progress',
    workflowInstanceState: 'Running',
    progress: 45,
    assignees: ['Civil Lead', 'HSE'],
  },
  {
    id: 'st-4',
    stageName: 'Commercial response',
    workflowBinding: 'wf-comm-v2',
    stageState: 'Paused',
    workflowInstanceState: 'Paused',
    progress: 10,
    assignees: ['Commercial'],
    pausedReason: 'Waiting for clarifications round 2',
  },
  {
    id: 'st-5',
    stageName: 'Submission',
    workflowBinding: 'wf-submit-v1',
    stageState: 'Not started',
    workflowInstanceState: 'Not started',
    progress: 0,
    assignees: [],
  },
]

export const MOCK_DELIVERABLES: DeliverableItem[] = [
  {
    id: 'del-1',
    name: 'Technical method statement',
    stageName: 'Technical response',
    department: 'Civil',
    contributingDepartments: ['Civil', 'HSE'],
    tiers: 'Prepare → Review → Approve',
    sectionCount: 8,
    sectionStates: '5 draft / 2 review / 1 approved',
    evidenceRollup: '6/8 evidenced',
    comments: 4,
    owedCorrections: 1,
    dependencies: ['HSE plan'],
    canGenerate: true,
  },
  {
    id: 'del-2',
    name: 'HSE plan',
    stageName: 'Technical response',
    department: 'HSE',
    contributingDepartments: ['HSE'],
    tiers: 'Prepare → Approve',
    sectionCount: 4,
    sectionStates: '3 draft / 1 review',
    evidenceRollup: '2/4 evidenced',
    comments: 1,
    owedCorrections: 0,
    dependencies: [],
    canGenerate: true,
  },
  {
    id: 'del-3',
    name: 'Commercial offer',
    stageName: 'Commercial response',
    department: 'Commercial',
    contributingDepartments: ['Commercial', 'Finance'],
    tiers: 'Prepare → Review → Approve',
    sectionCount: 6,
    sectionStates: '1 draft / 5 not started',
    evidenceRollup: '0/6 evidenced',
    comments: 0,
    owedCorrections: 2,
    dependencies: ['BoQ clarification'],
    canGenerate: false,
  },
]

export const MOCK_GAPS: GapItem[] = [
  {
    id: 'gap-1',
    summary: 'Bid bond amount not stated',
    location: 'ITT §4.1',
    detectionMethod: 'Extraction',
    linkedField: 'Bid bond amount',
    status: 'Open',
  },
  {
    id: 'gap-2',
    summary: 'Drawing revision conflicts with BoQ',
    location: 'Drawings vs BoQ sheet 4',
    detectionMethod: 'Consistency check',
    linkedSection: 'Commercial offer / BoQ',
    linkedClarification: 'clr-2',
    status: 'In progress',
  },
  {
    id: 'gap-3',
    summary: 'Local content percentage missing',
    location: 'Special conditions',
    detectionMethod: 'Manual review',
    linkedField: 'Local content rules',
    status: 'Open',
  },
]

export const MOCK_CLARIFICATIONS: ClarificationItem[] = [
  {
    id: 'clr-1',
    question: 'Confirm whether night works are permitted on Span 2.',
    raisingDepartment: 'Civil',
    round: 1,
    issuedDate: '2026-10-25',
    clientResponse: 'Night works permitted with 48h notice.',
    responseStatus: 'Accepted',
  },
  {
    id: 'clr-2',
    question: 'Which BoQ revision supersedes Addendum-02 sheet 4?',
    raisingDepartment: 'Commercial',
    round: 2,
    issuedDate: '2026-10-28',
    responseStatus: 'Issued',
    linkedGap: 'gap-2',
  },
  {
    id: 'clr-3',
    question: 'Provide geotechnical report reference for abutment A.',
    raisingDepartment: 'Civil',
    round: 2,
    issuedDate: '2026-10-29',
    responseStatus: 'Draft',
  },
]

export const MOCK_DECISIONS: DecisionItem[] = [
  {
    id: 'dec-1',
    stage: 'Bid / no-bid',
    decision: 'Bid',
    decider: 'M. Alvarez',
    rationale: 'Strategic client; LD risk mitigated by proposed cap negotiation.',
    inputs: 'Risk pack v1, Commercial memo',
    timestamp: '2026-10-24T16:20:00Z',
  },
  {
    id: 'dec-2',
    stage: 'Qualification',
    decision: 'Proceed',
    decider: 'Tender Admin',
    rationale: 'Completeness sufficient after Addendum-01.',
    inputs: 'Intake checklist',
    timestamp: '2026-10-22T11:05:00Z',
  },
]

export const MOCK_SUBMISSION: SubmissionRecord = {
  id: 'sub-1',
  issuedBy: 'S. Patel',
  submittedAt: '2026-10-12T13:58:00Z',
  channel: 'Client portal',
  deliverables: [
    { name: 'Technical pack.pdf', sha256: 'e29a…44bc' },
    { name: 'Commercial offer.xlsx', sha256: '91cd…0af3' },
  ],
  externalInputs: ['Bank guarantee scan', 'POA letter'],
  outstandingGaps: 0,
  outstandingClarifications: 0,
}

export const MOCK_ACCESS: AccessGrant[] = [
  {
    id: 'acc-1',
    user: 'r.okonkwo@bcbp.example',
    level: 'Edit',
    grantor: 'Tender Admin',
    reason: 'Power lead for restricted package',
    expiresAt: '2026-12-31',
  },
  {
    id: 'acc-2',
    user: 'legal.review@bcbp.example',
    level: 'View',
    grantor: 'Tender Admin',
    reason: 'Contractual review',
    expiresAt: '2026-11-30',
  },
  {
    id: 'acc-3',
    user: 'ex.contractor@partner.example',
    level: 'View',
    grantor: 'Tender Admin',
    reason: 'Temporary JV access',
    expiresAt: '2026-10-20',
    revoked: true,
  },
]

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    at: '2026-10-29T09:12:00Z',
    actor: 'A. Mendes',
    kind: 'Upload',
    summary: 'Uploaded HSE plan v2',
  },
  {
    id: 'act-2',
    at: '2026-10-28T15:40:00Z',
    actor: 'Automation',
    kind: 'AI generation',
    summary: 'Drafted method statement sections 1–3',
  },
  {
    id: 'act-3',
    at: '2026-10-28T12:10:00Z',
    actor: 'Tender Admin',
    kind: 'Assignee override',
    summary: 'Reassigned Commercial response to S. Chen — coverage for leave',
  },
  {
    id: 'act-4',
    at: '2026-10-24T16:20:00Z',
    actor: 'M. Alvarez',
    kind: 'Decision',
    summary: 'Bid / no-bid → Bid',
  },
  {
    id: 'act-5',
    at: '2026-10-22T11:05:00Z',
    actor: 'System',
    kind: 'State transition',
    summary: 'Lifecycle Intake → Qualification',
  },
]
