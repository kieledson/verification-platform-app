/**
 * Runtime visibility resolver.
 *
 * `show(questionId, answers, memo)` implements Document 1 §8's formula
 * exactly:
 *
 *   show = AND(evalRule(r) for ungrouped rules)
 *            AND AND-over-groups( OR(evalRule(r) for r in group) )
 *
 * A question's own `dependsOn` rules are bucketed by `orGroupNo`: rules
 * that share the same (non-null) group number are ORed together, and every
 * such OR result (including a "group" of exactly one rule, which trivially
 * degenerates to that rule alone) is then ANDed across all buckets. A rule
 * with `orGroupNo === null` — never actually observed in the v2.4 data,
 * but allowed by the schema — always gets its own singleton bucket, i.e.
 * it is ANDed with everything else and never merged with another `null`
 * rule.
 *
 * `evalRule` first checks whether the rule's own principal is itself
 * visible: a hidden principal makes the dependent hidden too, regardless of
 * what the expression would otherwise evaluate to (this is a defense in
 * depth against a stale answer lingering on a principal that has already
 * been hidden but not yet cleared by `clearHiddenAnswers.ts`).
 *
 * Memoization is per-evaluation-pass: pass a fresh `Map` from outside for
 * each independent "compute visibility for this answer snapshot" pass. The
 * same map is threaded through recursive calls within one pass so a
 * question referenced by multiple dependents is only evaluated once. A
 * question id is seeded to `false` in the memo the moment recursion into it
 * begins (before evaluating its own rules), so a dependency cycle resolves
 * to "hidden" instead of infinite-looping or throwing.
 */
import { evaluateBoolExpr, type Answers } from '../expression/evaluate';
import type { DependencyRule, Question, Standard } from '../../standard/schema/types';

export type VisibilityMemo = Map<number, boolean>;

export interface VisibilityResolver {
  show(questionId: number, answers: Answers, memo?: VisibilityMemo): boolean;
}

function groupRules(rules: readonly DependencyRule[]): DependencyRule[][] {
  const groups = new Map<string, DependencyRule[]>();
  let nullSeq = 0;
  for (const rule of rules) {
    // A `null` orGroupNo is never shared with another `null` rule (each is
    // its own AND term); a real number IS shared with other rules carrying
    // the same number (those get ORed together).
    const key = rule.orGroupNo === null ? `__ungrouped_${nullSeq++}` : `g_${rule.orGroupNo}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(rule);
    else groups.set(key, [rule]);
  }
  return [...groups.values()];
}

/**
 * Builds a resolver bound to one `Standard`. Bound this way (rather than
 * `show(standard, questionId, answers, memo)`) so `show` itself keeps the
 * simple 3-argument shape callers actually use, while question lookups are
 * indexed once instead of scanning `standard.questions` on every call.
 */
export function createVisibilityResolver(standard: Pick<Standard, 'questions' | 'codeAliases'>): VisibilityResolver {
  const byId = new Map<number, Question>(standard.questions.map((q) => [q.id, q]));
  const resolveCode = (code: string): number => {
    const id = standard.codeAliases[code];
    if (id === undefined) throw new Error(`Unknown question code referenced by an expression: ${JSON.stringify(code)}`);
    return id;
  };

  function getQuestion(questionId: number): Question {
    const q = byId.get(questionId);
    if (!q) throw new Error(`Unknown question id: ${questionId}`);
    return q;
  }

  function evalRule(rule: DependencyRule, answers: Answers, memo: VisibilityMemo): boolean {
    if (!show(rule.principalId, answers, memo)) return false;
    return evaluateBoolExpr(rule.expression, {
      principalId: rule.principalId,
      answers,
      resolveCode,
    });
  }

  function show(questionId: number, answers: Answers, memo: VisibilityMemo = new Map()): boolean {
    const cached = memo.get(questionId);
    if (cached !== undefined) return cached;

    // Cycle guard: seed before recursing.
    memo.set(questionId, false);

    const question = getQuestion(questionId);
    const visibilityRules = question.dependsOn.filter((r) => r.isVisibleDependency);
    const groups = groupRules(visibilityRules);
    const result = groups.every((group) => group.some((rule) => evalRule(rule, answers, memo)));

    memo.set(questionId, result);
    return result;
  }

  return { show };
}

/**
 * Computes visibility for every question in the standard against one
 * answers snapshot, returning a plain `questionId -> visible` map. Useful
 * wherever a full pass is needed up front (e.g. to feed
 * `isEffectivelyAnswered` or `clearHiddenAnswers` below) instead of calling
 * `show` question-by-question.
 */
export function resolveAllVisibility(standard: Pick<Standard, 'questions' | 'codeAliases'>, answers: Answers): Map<number, boolean> {
  const resolver = createVisibilityResolver(standard);
  const memo: VisibilityMemo = new Map();
  const result = new Map<number, boolean>();
  for (const q of standard.questions) {
    result.set(q.id, resolver.show(q.id, answers, memo));
  }
  return result;
}

/**
 * A question is "effectively answered" only if it is currently visible AND
 * has a non-empty answer. Hidden questions are always considered
 * unanswered, regardless of whatever value might still be sitting in
 * `answers` (mandatory-field validation and scoring must both exclude
 * hidden questions; see Document 1 §8).
 */
export function isEffectivelyAnswered(
  questionId: number,
  answers: Answers,
  visibility: ReadonlyMap<number, boolean>,
): boolean {
  if (!visibility.get(questionId)) return false;
  const value = answers[questionId];
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Builds a `principalId -> dependentIds[]` reverse index once from a
 * `Standard`. Intended for a future confirm-reset-dialog feature (when a
 * principal's answer changes such that one or more dependents would become
 * hidden, the dialog needs to know which questions those are) — this
 * module only builds the index; it does not implement that dialog.
 */
export function buildReverseIndex(standard: Pick<Standard, 'questions'>): Map<number, number[]> {
  const reverse = new Map<number, number[]>();
  for (const q of standard.questions) {
    for (const rule of q.dependsOn) {
      if (!rule.isVisibleDependency) continue;
      const list = reverse.get(rule.principalId);
      if (list) {
        if (!list.includes(q.id)) list.push(q.id);
      } else {
        reverse.set(rule.principalId, [q.id]);
      }
    }
  }
  return reverse;
}
