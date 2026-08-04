import { describe, expect, it } from 'vitest';
import { STANDARD } from '../../standard/data/standard';
import { validateExpressions } from '../../standard/ingest/validateExpressions';
import { createVisibilityResolver } from '../visibility/resolveVisibility';
import type { Answers } from '../expression/evaluate';

/**
 * Loads the actual generated standard.v2_4.json (built from the real
 * 4510-line source) and smoke-tests every one of its 879 dependency rules:
 * each principal resolves to a real question, and every literal compared
 * against a SINGLE_SELECT/MULTI_SELECT-family question's value matches one
 * of that question's real option values — except the 4 known-and-flagged
 * dead-data cases, which must show up as confirmed rather than silently
 * passing or silently failing.
 */
describe('full ruleset smoke test (real standard.v2_4.json)', () => {
  it('matches Document 1\'s headline numbers exactly', () => {
    expect(STANDARD.questions.length).toBe(298);
    expect(STANDARD.questions.reduce((sum, q) => sum + q.options.length, 0)).toBe(450);
    expect(STANDARD.questions.reduce((sum, q) => sum + q.dependsOn.length, 0)).toBe(879);
    expect(STANDARD.questions.filter((q) => q.notification !== null).length).toBe(43);
    expect(STANDARD.sections.length).toBe(12);
  });

  it('every question code is unique and resolves back to its own id via codeAliases', () => {
    const codes = STANDARD.questions.map((q) => q.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const q of STANDARD.questions) {
      expect(STANDARD.codeAliases[q.code]).toBe(q.id);
    }
  });

  it('validates every dependency rule and option Level/Characterisation expression, confirming exactly the 4 documented known issues and nothing else', () => {
    const { confirmedKnownIssueCodes } = validateExpressions(STANDARD);
    expect(confirmedKnownIssueCodes).toEqual(new Set(['NQ 9', 'Q_02_002', 'Q_02_003', 'Q_05_025']));
    expect(STANDARD.knownIssues).toHaveLength(4);
  });

  it('every dependency rule\'s principalId resolves to a real question in the standard', () => {
    const byId = new Map(STANDARD.questions.map((q) => [q.id, q]));
    for (const q of STANDARD.questions) {
      for (const rule of q.dependsOn) {
        expect(byId.has(rule.principalId), `principalId ${rule.principalId} on ${q.code}`).toBe(true);
      }
    }
  });

  it('IsVisibleDependency is true and IsLinkDependency is false on every one of the 879 rules (confirmed empirically for v2.4)', () => {
    let visibleCount = 0;
    let linkCount = 0;
    for (const q of STANDARD.questions) {
      for (const rule of q.dependsOn) {
        if (rule.isVisibleDependency) visibleCount++;
        if (rule.isLinkDependency) linkCount++;
      }
    }
    expect(visibleCount).toBe(879);
    expect(linkCount).toBe(0);
  });

  it('resolves visibility for every question with an empty answers map without throwing', () => {
    const resolver = createVisibilityResolver(STANDARD);
    const memo = new Map<number, boolean>();
    const answers: Answers = {};
    for (const q of STANDARD.questions) {
      expect(() => resolver.show(q.id, answers, memo)).not.toThrow();
    }
  });
});
