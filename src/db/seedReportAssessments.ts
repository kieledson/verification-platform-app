import { db, type AssessmentRecord, type AssessorType } from '@/db/schema'
import { newId } from '@/lib/id'

/**
 * Synthetic demo data only (see `seed.ts`). These are lightweight,
 * header-only assessment rows — no real answers, never opened in the
 * workspace — that exist purely so Reports (Assessment History, Internal
 * Group Report) have enough real rows in the `assessments` table to
 * aggregate over, instead of a separate hand-maintained summary blob.
 * "Submitted" for the Internal Group Report roll-up (Document 4 §5.1)
 * means status has reached `pending-upload` or `synced`; every row here is
 * seeded straight to `synced` since it represents already-submitted data
 * in this reporting context. Every group stays at a single batch (see the
 * `batch` field's doc comment in schema.ts) since what actually closes a
 * batch and opens the next is explicitly undecoded in the source docs.
 *
 * Per-group/assessor-type counts here are chosen deliberately (not random)
 * to exercise all three assessor-type-row states decoded in Document 4
 * §5.1 (Not Started / In Progress / Closed+Green) and both group-header
 * states (Green when every row is Closed+Green, In Progress otherwise) —
 * see the plan notes for the exact target per group.
 */
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

interface GroupSpec {
  groupId: string
  siteIds: string[]
  counts: Partial<Record<AssessorType, number>>
}

const GROUP_SPECS: GroupSpec[] = [
  { groupId: 'group-ms-g01-2026', siteIds: ['site-vn-tv-0421', 'site-vn-tv-0418'], counts: { Company: 8, Collaborator: 1 } },
  { groupId: 'group-ms-g21-2025', siteIds: ['site-vn-bt-0102'], counts: { Company: 6 } },
  { groupId: 'group-in-g04-2026', siteIds: ['site-in-ap-0067'], counts: { Company: 3, SGS: 1 } },
  { groupId: 'group-ms-g02-2026', siteIds: ['site-vn-tv-0430', 'site-vn-tv-0431'], counts: { Company: 6, Collaborator: 2, SGS: 1 } },
  { groupId: 'group-ap-g02-2025', siteIds: ['site-in-ap-0071', 'site-in-ap-0072'], counts: {} },
  { groupId: 'group-jv-g01-2026', siteIds: ['site-id-jv-0012', 'site-id-jv-0013'], counts: { Company: 2, Collaborator: 2 } },
  { groupId: 'group-th-g01-2026', siteIds: ['site-th-ct-0005', 'site-th-ct-0006'], counts: { Company: 4, Collaborator: 1 } },
]

/** Deterministic outcome cycle — mostly Green, some Yellow, rare Grey —
 * rather than `Math.random()`, so a reload never changes already-seeded
 * data's shape even though the seed only ever runs once. */
function outcomeForIndex(i: number): AssessmentRecord['outcome'] {
  const m = i % 10
  if (m < 7) return 'Green'
  if (m < 9) return 'Yellow'
  return 'Grey'
}

let seedPromise: Promise<void> | null = null

/** Guarded on a group that only this seed ever populates (rather than
 * `db.assessments.count()`, which `demoAssessments.ts` also writes to). */
export function seedReportAssessmentsIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const marker = await db.assessments.where('groupId').equals('group-ms-g02-2026').count()
      if (marker > 0) return

      const now = Date.now()
      const rows: AssessmentRecord[] = []
      let i = 0

      for (const spec of GROUP_SPECS) {
        for (const [assessorType, count] of Object.entries(spec.counts) as [AssessorType, number][]) {
          for (let n = 0; n < count; n++) {
            const siteId = spec.siteIds[i % spec.siteIds.length]
            const createdAt = now - (5 + i) * DAY
            const updatedAt = now - (1 + i) * HOUR
            rows.push({
              id: newId(),
              farmSiteId: siteId,
              groupId: spec.groupId,
              standardVersion: 'shrimp-farm-v2.4',
              assessorType,
              status: 'synced',
              progressPct: 100,
              byteSize: 24000 + (i % 5) * 3000,
              createdAt,
              updatedAt,
              lastSavedAt: updatedAt,
              syncAttempts: 0,
              outcome: outcomeForIndex(i),
              batch: 1,
              reportOnly: true,
            })
            i++
          }
        }
      }

      await db.assessments.bulkAdd(rows)
    })()
  }
  return seedPromise
}
