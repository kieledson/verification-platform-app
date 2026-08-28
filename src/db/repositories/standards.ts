import { db, type StandardRecord } from '@/db/schema'
import { newId } from '@/lib/id'

export async function createStandard(
  input: Omit<StandardRecord, 'createdAt' | 'updatedAt'>,
): Promise<StandardRecord> {
  const now = Date.now()
  const record: StandardRecord = { ...input, createdAt: now, updatedAt: now }
  await db.standards.add(record)
  return record
}

export function listStandards(): Promise<StandardRecord[]> {
  return db.standards.toArray()
}

export function getStandard(id: string): Promise<StandardRecord | undefined> {
  return db.standards.get(id)
}

export async function updateStandard(id: string, patch: Partial<Omit<StandardRecord, 'id'>>): Promise<void> {
  await db.standards.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteStandard(id: string): Promise<void> {
  await db.standards.delete(id)
}

/** Deep-copies a standard into a brand-new Draft — the "copy-then-edit-
 * then-publish" authoring loop (Document 2 §9) — so the source record
 * (Published or not) is never mutated by the clone itself. Uses
 * `structuredClone` rather than JSON round-tripping since option `level`/
 * `characterisation` values and dependency-rule expressions are plain
 * objects/arrays that structured clone handles natively (and, unlike JSON,
 * doesn't choke on `undefined` fields that are meaningful here). */
export async function cloneStandard(
  sourceId: string,
  name: string,
  version: string,
): Promise<StandardRecord> {
  const source = await db.standards.get(sourceId)
  if (!source) throw new Error(`Cannot clone: standard ${sourceId} not found`)
  const now = Date.now()
  const clone: StandardRecord = {
    ...structuredClone({
      sections: source.sections,
      questions: source.questions,
      codeAliases: source.codeAliases,
      knownIssues: source.knownIssues,
    }),
    id: newId(),
    name,
    version,
    status: 'Draft',
    isActive: false,
    clonedFromId: sourceId,
    createdAt: now,
    updatedAt: now,
  }
  await db.standards.add(clone)
  return clone
}

/** Publishing marks this standard active and demotes any other currently-
 * active standard to plain Published (kept, not archived — archiving is a
 * separate, explicit action) so at most one is ever "the" active standard. */
export async function publishStandard(id: string): Promise<void> {
  await db.transaction('rw', db.standards, async () => {
    // `isActive` is boolean, which IndexedDB can't index, so this filters
    // in JS over every row rather than `.where('isActive')`.
    const all = await db.standards.toArray()
    for (const record of all) {
      if (record.id !== id && record.isActive) await db.standards.update(record.id, { isActive: false })
    }
    await db.standards.update(id, { status: 'Published', isActive: true, updatedAt: Date.now() })
  })
}
