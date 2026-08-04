import { buildReverseIndex } from '@/dependency-engine/visibility/resolveVisibility'
import { STANDARD } from '@/standard/data/standard'
import type { Question } from '@/standard/schema/types'

/**
 * Built once at module load (not per-render, not per-question) since the
 * standard is static for the lifetime of the app. Backs the confirm-reset
 * dialog: given a principal question, which other questions currently
 * *depend* on it (i.e. would potentially be hidden/cleared if the principal's
 * answer changes)?
 */
const REVERSE_INDEX = buildReverseIndex(STANDARD)
const QUESTION_BY_ID = new Map<number, Question>(STANDARD.questions.map((q) => [q.id, q]))

export function getDependentQuestions(questionId: number): Question[] {
  const ids = REVERSE_INDEX.get(questionId)
  if (!ids) return []
  const out: Question[] = []
  for (const id of ids) {
    const q = QUESTION_BY_ID.get(id)
    if (q) out.push(q)
  }
  return out
}
