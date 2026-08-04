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
  activeSectionId: number | null
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
  setActiveSection: (sectionId: number) => void
  setAnswer: (questionCode: string, value: string | string[] | number) => void
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
    activeSectionId: null,
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
      const answers = await answersRepo.loadAnswers(assessmentId)
      const visibilityById = computeAllVisibility(toEngineAnswers(answers))
      set({
        activeAssessmentId: assessmentId,
        activeSectionId: STANDARD.sections[0]?.id ?? null,
        answers,
        visibility: toCodeVisibility(visibilityById),
        // Map sub-state belongs to whichever assessment is active; reset it
        // so a previous assessment's pin/GPS reading can't leak into this one.
        pin: null,
        gps: null,
        placingPin: false,
      })
    },

    setActiveSection: (sectionId) => set({ activeSectionId: sectionId }),

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
