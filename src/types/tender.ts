export type LifecycleState =
  | 'Intake'
  | 'Qualification'
  | 'Bid preparation'
  | 'Submitted'
  | 'Awarded'
  | 'Lost'
  | 'Withdrawn'

export type StageState = 'Not started' | 'In progress' | 'Paused' | 'Complete' | 'Abandoned'

export type RestrictionLevel = 'Open' | 'Restricted'

export type TenderListItem = {
  id: string
  reference: string
  title: string
  client: string
  lifecycleState: LifecycleState
  stageState: StageState
  stageName: string
  submissionDeadline: string
  ownerDepartment: string
  restricted: boolean
  lastActivity: string
  assignedTo: string
}

export type IntakeItem = {
  id: string
  receivedAt: string
  source: 'email' | 'upload'
  proposedClassification: string
  proposedRegime: string
  documents: string[]
  claimedRoles: string[]
  completeness: 'Complete' | 'Partial' | 'Insufficient'
  extractionProgress: number
  status: 'Pending' | 'Accepted' | 'Rejected'
}

export type KtiOutcome = 'Found' | 'Not found' | 'Not applicable'

export type KtiField = {
  id: string
  group: KtiGroup
  label: string
  value: string
  outcome: KtiOutcome
  sourceDocument?: string
  sourcePage?: number
  sourceClause?: string
  correctedBy?: string
  translated: boolean
}

export type KtiGroup =
  | 'Submission mechanics'
  | 'Commercial terms'
  | 'Risk / liability'
  | 'Legal / jurisdictional'
  | 'Delivery obligations'
  | 'Correspondence'

export type TenderDocument = {
  id: string
  name: string
  role: string
  version: string
  parseStatus: 'Queued' | 'Parsing' | 'Indexed' | 'Failed' | 'Quarantined'
  language: string
  translationAvailable: boolean
  sha256?: string
  addendumImpact?: string
}

export type RiskItem = {
  id: string
  category: 'Commercial' | 'Contractual' | 'Delivery'
  title: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  contributingFields: string[]
  evidence: string
  departmentInput?: string
}

export type StageWorkflow = {
  id: string
  stageName: string
  workflowBinding: string
  stageState: StageState
  workflowInstanceState: string
  progress: number
  assignees: string[]
  pausedReason?: string
}

export type DeliverableItem = {
  id: string
  name: string
  stageName: string
  department: string
  contributingDepartments: string[]
  tiers: string
  sectionCount: number
  sectionStates: string
  evidenceRollup: string
  comments: number
  owedCorrections: number
  dependencies: string[]
  canGenerate: boolean
}

export type GapItem = {
  id: string
  summary: string
  location: string
  detectionMethod: string
  linkedSection?: string
  linkedField?: string
  linkedClarification?: string
  status: 'Open' | 'In progress' | 'Resolved'
}

export type ClarificationItem = {
  id: string
  question: string
  raisingDepartment: string
  round: number
  issuedDate: string
  clientResponse?: string
  responseStatus: 'Draft' | 'Issued' | 'Answered' | 'Accepted' | 'Follow-up'
  linkedGap?: string
}

export type DecisionItem = {
  id: string
  stage: string
  decision: string
  decider: string
  rationale: string
  inputs: string
  timestamp: string
}

export type SubmissionRecord = {
  id: string
  issuedBy: string
  submittedAt: string
  channel: string
  deliverables: { name: string; sha256: string }[]
  externalInputs: string[]
  outstandingGaps: number
  outstandingClarifications: number
}

export type AccessGrant = {
  id: string
  user: string
  level: 'View' | 'Edit' | 'Approve'
  grantor: string
  reason: string
  expiresAt: string
  revoked?: boolean
}

export type ActivityItem = {
  id: string
  at: string
  actor: string
  kind: string
  summary: string
}

export type TenderDetail = TenderListItem & {
  description: string
  gapCount: number
  clarificationCount: number
  deliverableEvidence: string
  userTasks: { id: string; title: string; due: string }[]
  timeline: { label: string; at: string; done: boolean }[]
}
