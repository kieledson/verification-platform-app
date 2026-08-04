import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { STANDARD } from '../../standard/data/standard';
import { createVisibilityResolver, isEffectivelyAnswered, resolveAllVisibility } from '../visibility/resolveVisibility';
import type { Answers } from '../expression/evaluate';

const questionIds = STANDARD.questions.map((q) => q.id);

const answerValueArb = fc.oneof(
  fc.string(),
  fc.integer({ min: -1000, max: 1000 }),
  fc.array(fc.string({ maxLength: 8 }), { maxLength: 4 }),
);

/** An arbitrary partial answers map over real question ids from the real standard. */
const answersArb: fc.Arbitrary<Answers> = fc
  .dictionary(fc.constantFrom(...questionIds.map(String)), answerValueArb, { maxKeys: 40 })
  .map((dict) => {
    const answers: Answers = {};
    for (const [key, value] of Object.entries(dict)) {
      answers[Number(key)] = value;
    }
    return answers;
  });

describe('visibility property tests', () => {
  it('is deterministic: the same answers snapshot produces the same visibility result across repeated calls', () => {
    fc.assert(
      fc.property(answersArb, (answers) => {
        const resolver = createVisibilityResolver(STANDARD);

        // Fresh memo per call from outside, as intended usage.
        const first = questionIds.map((qid) => resolver.show(qid, answers, new Map()));
        const second = questionIds.map((qid) => resolver.show(qid, answers, new Map()));
        expect(second).toEqual(first);

        // A full-standard pass computed twice must also agree entry-for-entry.
        const passA = resolveAllVisibility(STANDARD, answers);
        const passB = resolveAllVisibility(STANDARD, answers);
        expect([...passB.entries()]).toEqual([...passA.entries()]);
      }),
      { numRuns: 30 },
    );
  });

  it('hidden ⇒ isEffectivelyAnswered is always false, regardless of what value sits in answers', () => {
    fc.assert(
      fc.property(answersArb, (answers) => {
        const visibility = resolveAllVisibility(STANDARD, answers);
        for (const qid of questionIds) {
          if (!visibility.get(qid)) {
            expect(isEffectivelyAnswered(qid, answers, visibility)).toBe(false);
          }
        }
      }),
      { numRuns: 30 },
    );
  });
});
