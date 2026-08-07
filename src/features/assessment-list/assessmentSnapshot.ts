import { STANDARD } from '@/standard/data/standard'
import * as answersRepo from '@/db/repositories/answers'
import { flatVisibleQuestions, perSectionCounts } from '@/features/workspace/flatQuestions'
import { computeVisibilityForAnswers } from '@/state/assessmentStore'

export interface SectionProgress {
  id: number
  name: string
  done: number
  total: number
}

/** Read-only per-section completion for a specific assessment, independent
 * of whatever's currently open in the workspace — safe to call for any row
 * in the list without disturbing `activeAssessmentId`. */
export async function loadSectionProgress(assessmentId: string): Promise<SectionProgress[]> {
  const answers = await answersRepo.loadAnswers(assessmentId)
  const visibility = computeVisibilityForAnswers(answers)
  const flat = flatVisibleQuestions(visibility)
  const counts = perSectionCounts(flat, answers)
  return STANDARD.sections.map((section) => {
    const c = counts.get(section.id) ?? { done: 0, total: 0 }
    return { id: section.id, name: section.name, done: c.done, total: c.total }
  })
}
