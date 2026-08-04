import Dexie, { type EntityTable } from 'dexie'

export type AssessmentStatus = 'draft' | 'ready-to-sync' | 'pending-upload' | 'synced'

export interface AssessmentRecord {
  id: string
  farmSiteId: string
  groupId: string
  standardVersion: string
  assessorType: 'None' | 'Company' | 'Collaborator' | 'SGS'
  status: AssessmentStatus
  progressPct: number
  byteSize: number
  createdAt: number
  updatedAt: number
  lastSavedAt: number
  syncAttempts: number
  lastSyncError?: string
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

export class AppDB extends Dexie {
  assessments!: EntityTable<AssessmentRecord, 'id'>
  answers!: EntityTable<AnswerRecord, 'assessmentId'>
  attachments!: EntityTable<AttachmentRecord, 'id'>
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>
  photoQueue!: EntityTable<PhotoQueueEntry, 'id'>
  pinLock!: EntityTable<PinLockState, 'id'>
  sites!: EntityTable<SiteRecord, 'id'>
  standardCache!: EntityTable<StandardCacheRow, 'versionKey'>

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
