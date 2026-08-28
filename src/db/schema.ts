import Dexie, { type EntityTable } from 'dexie'
import type { Section, Question, KnownIssue } from '@/standard/schema/types'

export type AssessmentStatus = 'draft' | 'ready-to-sync' | 'pending-upload' | 'synced'

/** Provenance marker on an assessment, not a role — a group can require a
 * target number of assessments from each type independently (company
 * self-assessment, peer collaborator, third-party SGS). Per Document 2 §6.2. */
export type AssessorType = 'None' | 'Company' | 'Collaborator' | 'SGS'

/** Per Document 4 §10 — Grey is a first-class outcome ("did not meet
 * Yellow"), not a null/unscored state. `null` here means genuinely
 * unscored (e.g. not yet synced), distinct from a real Grey result. The
 * actual Level-roll-up arithmetic that produces this value is server-side
 * and was never recovered (Document 2 §12, Document 4 §5.1/§11) — these
 * values are seed data, not computed from answers. */
export type AssessmentOutcome = 'Green' | 'Yellow' | 'Grey' | null

export interface AssessmentRecord {
  id: string
  farmSiteId: string
  groupId: string
  standardVersion: string
  assessorType: AssessorType
  status: AssessmentStatus
  progressPct: number
  byteSize: number
  createdAt: number
  updatedAt: number
  lastSavedAt: number
  syncAttempts: number
  lastSyncError?: string
  outcome: AssessmentOutcome
  /** Iteration counter for the group's sampling round (Document 4 §5.1 —
   * "BATCH is an iteration counter, not a derived ratio"). What actually
   * closes a batch and opens the next one is explicitly undecoded in the
   * source docs (Document 4 §11 Q2), so every seeded record here stays in
   * a single batch (1) rather than modeling that unconfirmed trigger. */
  batch: number
  /** True only for the lightweight, header-only rows `seedReportAssessments.ts`
   * adds purely so Reports (Assessment History, Internal Group Report) have
   * enough real data to aggregate over — never opened in the workspace, and
   * excluded from the Field App's "Your assessments" list. Undefined/false
   * for every real, field-workable assessment. */
  reportOnly?: boolean
}

/** One row per answer, not one JSON blob per assessment — matters once
 * autosave fires on every keystroke across ~290 answered questions. */
export interface AnswerRecord {
  assessmentId: string
  questionCode: string
  value: string | string[] | number
  attachmentIds?: string[]
  updatedAt: number
}

export type AttachmentSyncState = 'local' | 'queued' | 'uploading' | 'synced'

export interface AttachmentRecord {
  id: string
  assessmentId: string
  questionCode: string
  label: string
  sizeBytes: number
  blob: Blob
  capturedAt: number
  syncState: AttachmentSyncState
}

export type SyncQueueKind = 'assessment-meta' | 'answers-batch'
export type SyncQueueState = 'pending' | 'in-flight' | 'done' | 'failed'

export interface SyncQueueEntry {
  id: string
  assessmentId: string
  kind: SyncQueueKind
  payload: unknown
  state: SyncQueueState
  attempts: number
  lastError?: string
  createdAt: number
}

export type PhotoQueueState = 'deferred-wifi' | 'queued' | 'uploading' | 'synced' | 'failed'

export interface PhotoQueueEntry {
  id: string
  attachmentId: string
  assessmentId: string
  sizeBytes: number
  state: PhotoQueueState
  createdAt: number
}

/** Singleton row, key = 'device'. Gates app access independently of any
 * server-session concept. */
export interface PinLockState {
  id: 'device'
  pinHash: string
  lockedAt: number | null
  lastActivityAt: number
  autoLockAfterMs: number
}

export interface SiteRecord {
  id: string
  referenceCode: string
  farmName: string
  groupId: string
  groupName: string
  projectName: string
  country: string
  region: string
  address: string
  gps: { lat: number; lng: number; accuracy: number; capturedAt: number } | null
}

export interface StandardCacheRow {
  versionKey: string
  json: unknown
  cachedAt: number
}

// --- Portal entities (Document 2 §6-16, corrected by Document 4 §2) -------
//
// Management/reference data for the Security, Administration, Project
// Preparation and Reports areas. No live permission enforcement — the
// single local persona keeps full access throughout; these are CRUD
// management screens over real local data, not an auth system.

export type OrganisationType = 'Industry' | 'Government' | 'Academic' | 'NGO' | 'Certification Body' | 'System'
export type UserStatus = 'Active' | 'Deactivated'

export interface UserRecord {
  id: string
  email: string
  displayName: string
  roleIds: string[]
  assessorType: AssessorType
  organisationName: string
  organisationType: OrganisationType
  country: string
  status: UserStatus
  createdAt: number
  updatedAt: number
}

/** Document 2 §7.2 — a role's grant for a claim is a scope, not a boolean. */
export type PermissionScope = 'Global' | 'Filtered[PGS]' | 'Filtered[CTRY]' | 'None'

export interface RoleRecord {
  id: string
  name: string
  description: string
}

/** One row per (role, claim) — the 191-claim × 3-role matrix from Document 2
 * §7.3, seeded verbatim from the doc and editable here (no live enforcement
 * reads it back). */
export interface RolePermissionRecord {
  roleId: string
  claimCode: string
  scope: PermissionScope
}

export type InvitationStatus = 'Pending' | 'Accepted' | 'Expired'

export interface InvitationRecord {
  id: string
  date: number
  displayName: string
  email: string
  status: InvitationStatus
  invitedBy: string
}

export interface ProjectRecord {
  id: string
  name: string
  description: string
  parentProjectId: string | null
  totalEstimatedAnnualProduction: number
  totalEstimatedSites: number
  createdAt: number
  updatedAt: number
}

export type GroupGoal = 'Green' | 'Yellow'
export type GroupPhase = 'Live' | 'Pilot - Round 1' | 'N/A'

export interface SiteGroupRecord {
  id: string
  projectId: string
  name: string
  description: string
  personResponsible: string
  totalEstimatedAnnualProduction: number
  groupGoal: GroupGoal
  groupPhase: GroupPhase
  /** Assessor Type × Sample Size matrix (Document 2 §8.2) — the mechanism
   * behind the group's target assessment counts per type. */
  sampleSizes: { Company: number; Collaborator: number; SGS: number }
  createdAt: number
  updatedAt: number
}

export type ExportFormat = 'txt' | 'xlsx' | 'csv'
export type ExportEntity = 'ActivityExt' | 'ActivityCheckExt' | 'SiteExt'

export interface ExportTemplateField {
  order: number
  fieldKey: string
  format: string
  header: string
}

export interface ExportTemplateFilter {
  andOr: 'AND' | 'OR'
  criteria: string
  operator: string
  value: string
  mandatory: boolean
  editable: boolean
}

export interface ExportTemplateRecord {
  id: string
  name: string
  format: ExportFormat
  headerRow: boolean
  entity: ExportEntity
  fields: ExportTemplateField[]
  filters: ExportTemplateFilter[]
  owner: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

/** Draft standards are freely editable; Published ones are treated as
 * immutable (Document 2 §19's own recommendation) — changing a Published
 * standard means cloning it into a new Draft first. Archived is for
 * retiring an old Published standard without deleting its history. */
export type StandardRecordStatus = 'Draft' | 'Published' | 'Archived'

/** A full, self-contained standard document — the same shape the static
 * v2.4 ingestion produces (`Standard` in `standard/schema/types.ts`), just
 * persisted and editable instead of baked into a checked-in JSON file. The
 * dependency-engine test suite and the Field App's dependency-engine calls
 * are unaffected: they keep working against the original static
 * `standard.v2_4.json` import. This table is the authoring surface only —
 * see the Standards feature's scope note about not (yet) rewiring "new
 * assessment" to pick whichever record here is active. */
export interface StandardRecord {
  id: string
  name: string
  version: string
  status: StandardRecordStatus
  /** At most one record is active at a time — the one the Standards list
   * highlights as "the" standard, mirroring the real system's
   * one-published-version-in-use model. Not currently read by the Field
   * App (see scope note above). */
  isActive: boolean
  /** The record this was cloned from, for provenance — `null` for a
   * standard built from scratch. */
  clonedFromId: string | null
  sections: Section[]
  questions: Question[]
  codeAliases: Record<string, number>
  knownIssues: KnownIssue[]
  createdAt: number
  updatedAt: number
}

export class AppDB extends Dexie {
  assessments!: EntityTable<AssessmentRecord, 'id'>
  answers!: EntityTable<AnswerRecord, 'assessmentId'>
  attachments!: EntityTable<AttachmentRecord, 'id'>
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>
  photoQueue!: EntityTable<PhotoQueueEntry, 'id'>
  pinLock!: EntityTable<PinLockState, 'id'>
  sites!: EntityTable<SiteRecord, 'id'>
  standardCache!: EntityTable<StandardCacheRow, 'versionKey'>
  users!: EntityTable<UserRecord, 'id'>
  roles!: EntityTable<RoleRecord, 'id'>
  rolePermissions!: EntityTable<RolePermissionRecord, 'roleId'>
  invitations!: EntityTable<InvitationRecord, 'id'>
  projects!: EntityTable<ProjectRecord, 'id'>
  siteGroups!: EntityTable<SiteGroupRecord, 'id'>
  exportTemplates!: EntityTable<ExportTemplateRecord, 'id'>
  standards!: EntityTable<StandardRecord, 'id'>

  constructor(name = 'vp-field-app') {
    super(name)
    this.version(1).stores({
      assessments: 'id, status, updatedAt, farmSiteId, groupId',
      // Compound primary key: one row per (assessment, question).
      answers: '[assessmentId+questionCode], assessmentId',
      attachments: 'id, assessmentId, questionCode, syncState',
      syncQueue: 'id, assessmentId, state',
      photoQueue: 'id, assessmentId, attachmentId, state',
      pinLock: 'id',
      sites: 'id, groupId',
      standardCache: 'versionKey',
      users: 'id, status',
      roles: 'id',
      // Compound primary key: one row per (role, claim).
      rolePermissions: '[roleId+claimCode], roleId',
      invitations: 'id, status, date',
      projects: 'id, parentProjectId',
      siteGroups: 'id, projectId',
      exportTemplates: 'id, archived',
      // `isActive` is a boolean field — IndexedDB can't index boolean
      // values (a non-primary index entry is simply skipped for keys that
      // aren't valid IndexedDB keys), so it's deliberately not listed here;
      // reads filter it in JS instead (see `publishStandard`).
      standards: 'id, status',
    })
  }
}

export const db = new AppDB()

/** A second, independent database standing in for "the server" — this is
 * the entirety of "mocked sync": no fetch interception, just a second Dexie
 * instance that sync operations copy rows into after artificial latency. */
export class RemoteDB extends Dexie {
  assessments!: EntityTable<AssessmentRecord, 'id'>
  answers!: EntityTable<AnswerRecord, 'assessmentId'>
  attachments!: EntityTable<AttachmentRecord, 'id'>

  constructor() {
    super('vp-remote-mock')
    this.version(1).stores({
      assessments: 'id, status, updatedAt, farmSiteId, groupId',
      answers: '[assessmentId+questionCode], assessmentId',
      attachments: 'id, assessmentId, questionCode, syncState',
    })
  }
}

export const remoteDb = new RemoteDB()
