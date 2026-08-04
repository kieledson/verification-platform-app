import type { Answers } from '../expression/evaluate';

/**
 * Given the visibility map from *before* an answer change and the
 * visibility map from *after* it, returns a new `Answers` object with the
 * entries removed for any question that went from visible to hidden.
 *
 * This is silent re-hide cleanup — no confirmation prompt, just the diff
 * computation. (A confirm-reset-dialog feature can be layered on top using
 * `buildReverseIndex` from `resolveVisibility.ts` to tell the user which
 * questions are about to lose their answers before calling this.)
 *
 * A question that was already hidden and stays hidden, or was visible and
 * stays visible, is left untouched either way (including when it was
 * hidden-and-unanswered, or visible-and-answered/unanswered) — only the
 * visible-to-hidden transition triggers removal.
 */
export function clearHiddenAnswers(
  previousVisibility: ReadonlyMap<number, boolean>,
  nextVisibility: ReadonlyMap<number, boolean>,
  answers: Answers,
): Answers {
  const result: Answers = { ...answers };
  for (const [questionId, wasVisible] of previousVisibility) {
    const isVisibleNow = nextVisibility.get(questionId) ?? false;
    if (wasVisible && !isVisibleNow) {
      delete result[questionId];
    }
  }
  return result;
}
