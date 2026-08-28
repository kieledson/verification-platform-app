import { db } from '@/db/schema'
import { STANDARD } from '@/standard/data/standard'

/**
 * Seeds the checked-in, statically-generated v2.4 standard as the first
 * (and initially only) row in the new editable `standards` table, marked
 * Published + active. This is a snapshot copy, not a live reference — the
 * Field App keeps importing `STANDARD` directly from
 * `standard/data/standard.ts` regardless of what happens to this row later
 * (see the Standards feature's scope note in `schema.ts`).
 */
let seedPromise: Promise<void> | null = null

export function seedStandardLibraryIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.standards.count()
      if (count > 0) return
      const now = Date.now()
      await db.standards.add({
        id: 'standard-shrimp-farm-v2-4',
        name: 'Shrimp: Farm Standard',
        version: STANDARD.version,
        status: 'Published',
        isActive: true,
        clonedFromId: null,
        sections: STANDARD.sections,
        questions: STANDARD.questions,
        codeAliases: STANDARD.codeAliases,
        knownIssues: STANDARD.knownIssues,
        createdAt: now,
        updatedAt: now,
      })
    })()
  }
  return seedPromise
}
