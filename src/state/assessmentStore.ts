import { create } from 'zustand'
import { STANDARD } from '@/standard/data/standard'
import type { AnswerMap } from '@/db/repositories/answers'
import * as answersRepo from '@/db/repositories/answers'
import * as assessmentsRepo from '@/db/repositories/assessments'
import type { AssessmentRecord } from '@/db/schema'
import {
  createVisibilityResolver,
  isEffectivelyAnswered as engineIsEffectivelyAnswered,
} from '@/dependency-engine/visibility/resolveVisibility'
import { clearHiddenAnswers } from '@/dependency-engine/visibility/clearHiddenAnswers'
import type { Answers } from '@/dependency-engine/expression/evaluate'
import { debounce } from '@/lib/debounce'
import { toEngineAnswers } from '@/standard/answerMapping'
import { flatVisibleQuestions } from '@/features/workspace/flatQuestions'

const visibilityResolver = createVisibilityResolver(STANDARD)

const codeToId = new Map(STANDARD.questions.map((q) => [q.code, q.id]))
const idToCode = new Map(STANDARD.questions.map((q) => [q.id, q.code]))

function toCodeAnswers(answers: Answers): AnswerMap {
  const out: AnswerMap = {}
  for (const [idStr, value] of Object.entries(answers)) {
    const code = idToCode.get(Number(idStr))
    if (code !== undefined) out[code] = value as string | string[] | number
  }
  return out
}

function computeAllVisibility(answers: Answers): Map<number, boolean> {
  const memo = new Map<number, boolean>()
  const result = new Map<number, boolean>()
  for (const q of STANDARD.questions) {
    result.set(q.id, visibilityResolver.show(q.id, answers, memo))
  }
  return result
}

function toCodeVisibility(visibility: ReadonlyMap<number, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const [id, visible] of visibility) {
    const code = idToCode.get(id)
    if (code !== undefined) out[code] = visible
  }
  return out
}

interface CoordState {
  x: number
  y: number
}

interface AssessmentState {
  assessments: AssessmentRecord[]
  activeAssessmentId: string | null
  /** The single focused question code driving the ledger highlight, the
   * answer dock's content and auto-scroll — see the Assessment Workspace v2
   * handoff's "one currentCode" interaction model. */
  currentCode: string | null
  answers: AnswerMap
  visibility: Record<string, boolean>
  lastSavedAt: number | null

  // SITE_DETAILS / map sub-state
  pin: CoordState | null
  gps: { accuracy: number; capturedAt: number } | null
  coordFormat: 'dd' | 'dms'
  placingPin: boolean

  loadAssessments: () => Promise<void>
  openAssessment: (assessmentId: string) => Promise<void>
  setCurrentCode: (code: string | null) => void
  setAnswer: (questionCode: string, value: string | string[] | number) => void
  /** How many currently-answered questions would become hidden (and so
   * cleared) if `questionCode` were changed to `value` — without actually
   * committing the change. Backs the reset-warning dialog's exact count. */
  previewResetCount: (questionCode: string, value: string | string[] | number) => number
  setCoordFormat: (format: 'dd' | 'dms') => void
  setPlacingPin: (placing: boolean) => void
  setPin: (pin: CoordState) => void
  setGps: (gps: { accuracy: number; capturedAt: number }) => void
}

function recomputeProgress(answers: AnswerMap, visibility: Record<string, boolean>): number {
  const mandatoryVisible = STANDARD.questions.filter((q) => q.isMandatory && visibility[q.code])
  if (mandatoryVisible.length === 0) return 0
  const answered = mandatoryVisible.filter((q) => isQuestionEffectivelyAnsweredFor(q.code, answers, visibility))
  return Math.round((answered.length / mandatoryVisible.length) * 100)
}

function isQuestionEffectivelyAnsweredFor(
  code: string,
  answers: AnswerMap,
  visibility: Record<string, boolean>,
): boolean {
  if (!visibility[code]) return false
  const value = answers[code]
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export const useAssessmentStore = create<AssessmentState>((set, get) => {
  const persistAnswer = debounce(
    async (assessmentId: string, questionCode: string, value: string | string[] | number) => {
      await answersRepo.writeAnswer(assessmentId, questionCode, value)
      await assessmentsRepo.touchLastSaved(assessmentId)
      await assessmentsRepo.recomputeByteSize(assessmentId)
      const { answers, visibility } = get()
      const progressPct = recomputeProgress(answers, visibility)
      await assessmentsRepo.updateAssessment(assessmentId, { progressPct })
      set({ lastSavedAt: Date.now() })
    },
    400,
  )

  return {
    assessments: [],
    activeAssessmentId: null,
    currentCode: null,
    answers: {},
    visibility: {},
    lastSavedAt: null,
    pin: null,
    gps: null,
    coordFormat: 'dd',
    placingPin: false,

    loadAssessments: async () => {
      const assessments = await assessmentsRepo.listAssessments()
      set({ assessments })
    },

    openAssessment: async (assessmentId) => {
      const [answers, record] = await Promise.all([
        answersRepo.loadAnswers(assessmentId),
        assessmentsRepo.getAssessment(assessmentId),
      ])
      const visibilityById = computeAllVisibility(toEngineAnswers(answers))
      const visibility = toCodeVisibility(visibilityById)
      set({
        activeAssessmentId: assessmentId,
        currentCode: flatVisibleQuestions(visibility)[0]?.question.code ?? null,
        answers,
        visibility,
        // Reflects the persisted save time immediately on open, rather than
        // showing "not yet" until the user makes a fresh edit this session.
        lastSavedAt: record?.lastSavedAt ?? null,
        // Map sub-state belongs to whichever assessment is active; reset it
        // so a previous assessment's pin/GPS reading can't leak into this one.
        pin: null,
        gps: null,
        placingPin: false,
      })
    },

    setCurrentCode: (code) => set({ currentCode: code }),

    setAnswer: (questionCode, value) => {
      const { activeAssessmentId, answers } = get()
      if (!activeAssessmentId) return

      const engineAnswersBefore = toEngineAnswers(answers)
      const visibilityBefore = computeAllVisibility(engineAnswersBefore)

      const questionId = codeToId.get(questionCode)
      const engineAnswersAfter: Answers = { ...engineAnswersBefore }
      if (questionId !== undefined) engineAnswersAfter[questionId] = value

      const visibilityAfter = computeAllVisibility(engineAnswersAfter)

      // Silent re-hide: strip stored answers for questions that just went
      // from visible to hidden as a side effect of this change.
      const clearedEngineAnswers = clearHiddenAnswers(visibilityBefore, visibilityAfter, engineAnswersAfter)

      const nextAnswers = toCodeAnswers(clearedEngineAnswers)
      const nextVisibility = toCodeVisibility(visibilityAfter)

      set({ answers: nextAnswers, visibility: nextVisibility })
      void persistAnswer(activeAssessmentId, questionCode, value)

      // Also persist the clear-on-hide side effects.
      const clearedCodes = Object.keys(answers).filter(
        (code) => code !== questionCode && !(code in nextAnswers),
      )
      if (clearedCodes.length > 0) void answersRepo.clearAnswers(activeAssessmentId, clearedCodes)
    },

    previewResetCount: (questionCode, value) => {
      const { answers } = get()
      const engineBefore = toEngineAnswers(answers)
      const visibilityBefore = computeAllVisibility(engineBefore)

      const questionId = codeToId.get(questionCode)
      const engineAfter: Answers = { ...engineBefore }
      if (questionId !== undefined) engineAfter[questionId] = value

      const visibilityAfter = computeAllVisibility(engineAfter)

      let count = 0
      for (const [id, wasVisible] of visibilityBefore) {
        if (!wasVisible || visibilityAfter.get(id)) continue
        const code = idToCode.get(id)
        if (!code) continue
        const val = answers[code]
        const answered =
          val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '')
        if (answered) count++
      }
      return count
    },

    setCoordFormat: (format) => set({ coordFormat: format }),
    setPlacingPin: (placing) => set({ placingPin: placing }),
    setPin: (pin) => set({ pin, placingPin: false }),
    setGps: (gps) => set({ gps }),
  }
})

export function isQuestionEffectivelyAnswered(questionCode: string): boolean {
  const { answers, visibility } = useAssessmentStore.getState()
  const questionId = codeToId.get(questionCode)
  if (questionId === undefined) return false
  const visibilityMap = new Map(Object.entries(visibility).map(([code, v]) => [codeToId.get(code)!, v]))
  return engineIsEffectivelyAnswered(questionId, toEngineAnswers(answers), visibilityMap)
}
