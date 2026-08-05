import { STANDARD } from '@/standard/data/standard'
import type { Question } from '@/standard/schema/types'
import type { AnswerMap } from '@/db/repositories/answers'

export interface FlatQuestionEntry {
  question: Question
  sectionId: number
}

const QUESTION_BY_ID = new Map<number, Question>(STANDARD.questions.map((q) => [q.id, q]))

/** Every currently-visible question across all 12 sections, in section then
 * SortOrder — the backbone for the ledger, the transect nav's counts, the
 * review checklist and keyboard/auto-advance navigation. Recomputed from a
 * visibility snapshot rather than cached, since visibility changes on every
 * answer. */
export function flatVisibleQuestions(visibility: Record<string, boolean>): FlatQuestionEntry[] {
  const out: FlatQuestionEntry[] = []
  for (const section of STANDARD.sections) {
    for (const id of section.questionIds) {
      const question = QUESTION_BY_ID.get(id)
      if (question && visibility[question.code]) out.push({ question, sectionId: section.id })
    }
  }
  return out
}

export function isAnswered(question: Question, answers: AnswerMap): boolean {
  const value = answers[question.code]
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  return String(value).trim().length > 0
}

export interface SectionCount {
  done: number
  total: number
}

export function perSectionCounts(flat: FlatQuestionEntry[], answers: AnswerMap): Map<number, SectionCount> {
  const map = new Map<number, SectionCount>()
  for (const { question, sectionId } of flat) {
    const entry = map.get(sectionId) ?? { done: 0, total: 0 }
    entry.total += 1
    if (isAnswered(question, answers)) entry.done += 1
    map.set(sectionId, entry)
  }
  return map
}

const depthMemo = new Map<number, number>()

/** How many hops back to a question with no dependency is `questionId` —
 * generalizes the handoff's single-parent `dep.code` chain to our real
 * multi-principal/OR-group rules by taking the deepest of any referenced
 * principal. Capped at 3 (the deepest real chain in v2.4), matching the
 * handoff's visual indent cap. */
export function dependencyDepth(questionId: number): number {
  const cached = depthMemo.get(questionId)
  if (cached !== undefined) return cached
  depthMemo.set(questionId, 0) // cycle guard — reseeded below once resolved
  const question = QUESTION_BY_ID.get(questionId)
  let depth = 0
  if (question) {
    const principals = new Set(
      question.dependsOn.filter((rule) => rule.isVisibleDependency).map((rule) => rule.principalId),
    )
    for (const principalId of principals) {
      depth = Math.max(depth, 1 + dependencyDepth(principalId))
    }
  }
  depth = Math.min(depth, 3)
  depthMemo.set(questionId, depth)
  return depth
}
