import { db, type AssessmentRecord } from '@/db/schema'
import { STANDARD } from '@/standard/data/standard'
import type { AnswerMap } from '@/db/repositories/answers'
import { toEngineAnswers } from '@/standard/answerMapping'
import { createVisibilityResolver } from '@/dependency-engine/visibility/resolveVisibility'
import * as answersRepo from '@/db/repositories/answers'
import * as attachmentsRepo from '@/db/repositories/attachments'
import * as assessmentsRepo from '@/db/repositories/assessments'
import { newId } from '@/lib/id'
import type { Question, AnswerOption } from '@/standard/schema/types'

/**
 * Generates realistic-looking demo assessments (varying completion/status)
 * for showing the app without anyone having to fill one in by hand first.
 * Answers are produced by walking the *real* dependency engine so the
 * resulting state is exactly as internally consistent as anything a real
 * assessor could produce — no hand-picked/hard-coded question set that
 * could drift from the actual standard.
 */

const resolver = createVisibilityResolver(STANDARD)
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function orderedQuestions(): Question[] {
  const byId = new Map(STANDARD.questions.map((q) => [q.id, q]))
  const sections = [...STANDARD.sections].sort((a, b) => a.sortOrder - b.sortOrder)
  const list: Question[] = []
  for (const section of sections) {
    for (const id of section.questionIds) {
      const q = byId.get(id)
      if (q) list.push(q)
    }
  }
  return list
}

function pickPositiveOption(options: AnswerOption[]): AnswerOption | undefined {
  const yes = options.find((o) => o.value === 'YES')
  if (yes) return yes
  const numeric = options.filter((o): o is AnswerOption & { level: number } => typeof o.level === 'number')
  if (numeric.length > 0) return numeric.reduce((a, b) => (b.level > a.level ? b : a))
  return options[0]
}

function autoAnswerValue(q: Question, siteReferenceCode: string): string | string[] | number | undefined {
  switch (q.controlType) {
    case 'SINGLE_SELECT':
    case 'SINGLE_SELECT_MODAL':
      return pickPositiveOption(q.options)?.value
    case 'MULTI_SELECT':
    case 'MULTI_SELECT_MODAL':
      return q.options.length > 0 ? [q.options[0].value] : undefined
    case 'TEXT':
      return 'Demo response'
    case 'NUMBER':
      return 12
    case 'TEXT_MULTILINE':
      return 'Sample narrative entered for demonstration purposes.'
    case 'DATE_TIME':
      return new Date().toISOString().slice(0, 16)
    case 'SITE_DETAILS':
      return siteReferenceCode
    case 'SIGNATURE':
    case 'IMAGE':
      return undefined // handled separately by the caller
  }
}

function makePlaceholderPhotoBlob(label: string, hueSeed: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 240
  const ctx = canvas.getContext('2d')!
  const hue = (hueSeed * 47) % 360
  ctx.fillStyle = `hsl(${hue}, 40%, 55%)`
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(label, 14, 30)
  ctx.font = '12px sans-serif'
  ctx.fillText('Synthetic demo photo', 14, 220)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? new Blob()), 'image/jpeg', 0.7))
}

function makeSignatureDataUrl(name: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 340
  canvas.height = 76
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#012C4C'
  ctx.font = 'italic 26px Georgia, serif'
  ctx.fillText(name, 18, 40)
  ctx.strokeStyle = '#012C4C'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(18, 52)
  for (let x = 18; x < 240; x += 8) ctx.lineTo(x, 52 + Math.sin(x / 9) * 4)
  ctx.stroke()
  return canvas.toDataURL('image/png')
}

interface GeneratedAnswers {
  answers: AnswerMap
  photoCodes: string[]
  signatureCodes: string[]
}

/** Walks the whole standard, answering every mandatory question that
 * becomes visible. Iterates to a fixed point (not a fixed pass count) since
 * answering one question can reveal another which itself reveals a third —
 * verified against the real v2.4 data to take up to 7 passes to fully
 * converge, so a small fixed count (e.g. 3-4, "chains up to 3 deep") was
 * confirmed to leave stragglers unanswered. A 20-pass cap is just a safety
 * backstop against a pathological cycle; real data converges well before it. */
function generateFullAnswerSet(siteReferenceCode: string): GeneratedAnswers {
  const questions = orderedQuestions()
  const answers: AnswerMap = {}
  const photoCodes = new Set<string>()
  const signatureCodes = new Set<string>()

  for (let pass = 0; pass < 20; pass++) {
    const before = Object.keys(answers).length + photoCodes.size + signatureCodes.size
    const engineAnswers = toEngineAnswers(answers)
    const memo = new Map<number, boolean>()
    for (const q of questions) {
      if (q.code in answers || photoCodes.has(q.code) || signatureCodes.has(q.code)) continue
      if (!q.isMandatory) continue
      if (!resolver.show(q.id, engineAnswers, memo)) continue

      if (q.controlType === 'IMAGE') {
        photoCodes.add(q.code)
        continue
      }
      if (q.controlType === 'SIGNATURE') {
        signatureCodes.add(q.code)
        continue
      }
      const value = autoAnswerValue(q, siteReferenceCode)
      if (value !== undefined) answers[q.code] = value
    }
    const after = Object.keys(answers).length + photoCodes.size + signatureCodes.size
    if (after === before) break
  }

  return { answers, photoCodes: [...photoCodes], signatureCodes: [...signatureCodes] }
}

/** Truncates a full answer set to roughly `fraction` of its size, keeping a
 * prefix in standard order so every kept answer's own principal (which
 * sorts earlier whenever one exists) is kept too — this preserves internal
 * consistency without re-deriving visibility for the partial case. */
function truncate(full: GeneratedAnswers, fraction: number): GeneratedAnswers {
  const questions = orderedQuestions()
  const totalFilled = Object.keys(full.answers).length + full.photoCodes.length
  const targetCount = Math.round(fraction * totalFilled)

  const answers: AnswerMap = {}
  const photoCodes: string[] = []
  let kept = 0

  for (const q of questions) {
    if (kept >= targetCount) break
    if (q.code in full.answers) {
      answers[q.code] = full.answers[q.code]
      kept++
    } else if (full.photoCodes.includes(q.code)) {
      photoCodes.push(q.code)
      kept++
    }
  }

  return { answers, photoCodes, signatureCodes: [] }
}

async function persistGeneratedAnswers(
  assessmentId: string,
  generated: GeneratedAnswers,
  signerNames: [string, string],
  photosAlreadySynced: boolean,
): Promise<void> {
  for (const [code, value] of Object.entries(generated.answers)) {
    await answersRepo.writeAnswer(assessmentId, code, value)
  }

  for (let i = 0; i < generated.signatureCodes.length; i++) {
    const name = signerNames[i] ?? signerNames[0]
    await answersRepo.writeAnswer(assessmentId, generated.signatureCodes[i], makeSignatureDataUrl(name))
  }

  for (let i = 0; i < generated.photoCodes.length; i++) {
    const code = generated.photoCodes[i]
    const blob = await makePlaceholderPhotoBlob(`Site photo ${i + 1}`, i + 1)
    const record = await attachmentsRepo.addAttachment({
      assessmentId,
      questionCode: code,
      label: `Photo ${i + 1}`,
      blob,
    })
    await answersRepo.writeAnswer(assessmentId, code, [record.id])
    if (photosAlreadySynced) await attachmentsRepo.setAttachmentSyncState(record.id, 'synced')
  }
}

function computeProgressPct(answers: AnswerMap): number {
  const engineAnswers = toEngineAnswers(answers)
  const memo = new Map<number, boolean>()
  let total = 0
  let done = 0
  for (const q of STANDARD.questions) {
    if (!q.isMandatory) continue
    if (!resolver.show(q.id, engineAnswers, memo)) continue
    total++
    const value = answers[q.code]
    const answered =
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : String(value).trim().length > 0)
    if (answered) done++
  }
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

interface DemoSpec {
  siteId: string
  siteReferenceCode: string
  groupId: string
  assessorType: AssessmentRecord['assessorType']
  status: AssessmentRecord['status']
  completion: 'partial' | 'full'
  fraction?: number
  createdDaysAgo: number
  updatedHoursAgo: number
  signerNames: [string, string]
  /** Only assigned once an assessment has actually reached the server
   * (`pending-upload`/`synced`) — draft/ready-to-sync stay unscored. */
  outcome?: AssessmentRecord['outcome']
}

const DEMOS: DemoSpec[] = [
  {
    siteId: 'site-vn-tv-0421',
    siteReferenceCode: 'VN-TV-0421',
    groupId: 'group-ms-g01-2026',
    assessorType: 'Company',
    status: 'draft',
    completion: 'partial',
    fraction: 0.55,
    createdDaysAgo: 2,
    updatedHoursAgo: 3,
    signerNames: ['Linh Pham', 'Bảy Hùng'],
  },
  {
    siteId: 'site-vn-tv-0418',
    siteReferenceCode: 'VN-TV-0418',
    groupId: 'group-ms-g01-2026',
    assessorType: 'Company',
    status: 'ready-to-sync',
    completion: 'full',
    createdDaysAgo: 4,
    updatedHoursAgo: 20,
    signerNames: ['Linh Pham', 'Minh Sáng'],
  },
  {
    siteId: 'site-vn-bt-0102',
    siteReferenceCode: 'VN-BT-0102',
    groupId: 'group-ms-g21-2025',
    assessorType: 'Collaborator',
    status: 'pending-upload',
    completion: 'full',
    createdDaysAgo: 6,
    updatedHoursAgo: 1,
    signerNames: ['Trần Văn Hải', 'Bến Tre Hai'],
    outcome: 'Green',
  },
  {
    siteId: 'site-in-ap-0067',
    siteReferenceCode: 'IN-AP-0067',
    groupId: 'group-in-g04-2026',
    assessorType: 'SGS',
    status: 'synced',
    completion: 'full',
    createdDaysAgo: 10,
    updatedHoursAgo: 72,
    signerNames: ['Priya Raman', 'Krishna Unit Manager'],
    outcome: 'Green',
  },
]

let seedPromise: Promise<void> | null = null

/** Guarded the same way as `seedIfEmpty` (see `db/seed.ts`) — an in-flight
 * singleton so React 18 StrictMode's double effect-invocation in dev can't
 * race two concurrent `count() === 0` checks into duplicate seeding runs. */
export function seedDemoAssessmentsIfEmpty(): Promise<void> {
  if (!seedPromise) seedPromise = doSeedDemoAssessments()
  return seedPromise
}

async function doSeedDemoAssessments(): Promise<void> {
  const existing = await db.assessments.count()
  if (existing > 0) return

  const now = Date.now()

  for (const demo of DEMOS) {
    const id = newId()
    await assessmentsRepo.createAssessment({
      id,
      farmSiteId: demo.siteId,
      groupId: demo.groupId,
      standardVersion: 'shrimp-farm-v2.4',
      assessorType: demo.assessorType,
    })

    const full = generateFullAnswerSet(demo.siteReferenceCode)
    const generated = demo.completion === 'full' ? full : truncate(full, demo.fraction ?? 0.55)
    const photosAlreadySynced = demo.status === 'synced'

    await persistGeneratedAnswers(id, generated, demo.signerNames, photosAlreadySynced)

    // Recompute from what's actually in Dexie, not the in-memory `generated`
    // object — that object never gained the signature/photo answers written
    // separately inside `persistGeneratedAnswers`, which silently undercounted
    // every "full" demo by exactly its signature+photo question count.
    const persistedAnswers = await answersRepo.loadAnswers(id)
    const progressPct = computeProgressPct(persistedAnswers)
    const byteSize = await assessmentsRepo.recomputeByteSize(id)

    const createdAt = now - demo.createdDaysAgo * DAY
    const updatedAt = now - demo.updatedHoursAgo * HOUR

    await db.assessments.update(id, {
      status: demo.status,
      progressPct,
      byteSize,
      createdAt,
      updatedAt,
      lastSavedAt: updatedAt,
      outcome: demo.outcome ?? null,
    })
  }
}
