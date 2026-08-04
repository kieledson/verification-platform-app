import { STANDARD } from '@/standard/data/standard'
import type { AnswerMap } from '@/db/repositories/answers'
import type { Answers } from '@/dependency-engine/expression/evaluate'

/**
 * Single shared source of truth for the question-code <-> stable-id mapping
 * that both the visibility engine and any expression evaluation (alerts,
 * notifications) need. Built once from `STANDARD.codeAliases`, which is
 * confirmed to map every `Question.code` (canonical, no legacy aliases in
 * v2.4) 1:1 onto its numeric id — see `standard/schema/types.ts`.
 *
 * `assessmentStore.ts` and `QuestionRow.tsx` both need to go from the
 * code-keyed `AnswerMap` the rest of the app works with to the id-keyed
 * `Answers` shape `evaluateBoolExpr`/`resolveVisibility` expect. Rather than
 * each re-deriving that mapping (as `assessmentStore.ts` originally did
 * inline), both now import `resolveCode`/`toEngineAnswers` from here.
 */
export function resolveCode(code: string): number {
  const id = STANDARD.codeAliases[code]
  if (id === undefined) throw new Error(`Unknown question code referenced by an expression: ${JSON.stringify(code)}`)
  return id
}

export function toEngineAnswers(answers: AnswerMap): Answers {
  const out: Answers = {}
  for (const [code, value] of Object.entries(answers)) {
    const id = STANDARD.codeAliases[code]
    if (id !== undefined) out[id] = value
  }
  return out
}
