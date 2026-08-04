import { db, type AnswerRecord } from '@/db/schema'

export type AnswerMap = Record<string, string | string[] | number>

export async function loadAnswers(assessmentId: string): Promise<AnswerMap> {
  const rows = await db.answers.where('assessmentId').equals(assessmentId).toArray()
  const map: AnswerMap = {}
  for (const row of rows) map[row.questionCode] = row.value
  return map
}

export async function loadAnswerRecords(assessmentId: string): Promise<AnswerRecord[]> {
  return db.answers.where('assessmentId').equals(assessmentId).toArray()
}

/** Single write-path for all answer mutations. Debounce at the call site
 * (feature/UI layer), not here — this repository just persists. */
export async function writeAnswer(
  assessmentId: string,
  questionCode: string,
  value: string | string[] | number,
  attachmentIds?: string[],
): Promise<void> {
  const record: AnswerRecord = {
    assessmentId,
    questionCode,
    value,
    attachmentIds,
    updatedAt: Date.now(),
  }
  await db.answers.put(record)
}

/** Silent re-hide cleanup: remove stored answers for questions that just
 * became hidden as a side effect of a different answer changing. No
 * confirmation — the user didn't directly act on these fields. */
export async function clearAnswers(assessmentId: string, questionCodes: string[]): Promise<void> {
  if (questionCodes.length === 0) return
  const keys: Array<[string, string]> = questionCodes.map((code) => [assessmentId, code])
  await db.answers.bulkDelete(keys as never)
}

export async function deleteAllAnswers(assessmentId: string): Promise<void> {
  await db.answers.where('assessmentId').equals(assessmentId).delete()
}
