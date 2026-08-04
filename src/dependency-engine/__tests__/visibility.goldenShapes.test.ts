import { describe, expect, it } from 'vitest';
import { STANDARD } from '../../standard/data/standard';
import { createVisibilityResolver } from '../visibility/resolveVisibility';
import { parseExpression } from '../expression/parse';
import { evaluateBoolExpr, type Answers } from '../expression/evaluate';

/**
 * One test group per distinct real rule shape found in the generated
 * standard.v2_4.json (built from the actual 879-rule source). Every id
 * below is looked up by its real business code via `codeAliases`, and every
 * literal/answer used is a real option value from the real question — none
 * of this is synthetic fixture data.
 */
function id(code: string): number {
  const questionId = STANDARD.codeAliases[code];
  if (questionId === undefined) throw new Error(`Fixture setup error: unknown code ${code}`);
  return questionId;
}

/** The single real DependencyRule on `dependentCode` whose principal is `principalCode`. */
function ruleOn(dependentCode: string, principalCode: string) {
  const question = STANDARD.questions.find((q) => q.id === id(dependentCode))!;
  const rule = question.dependsOn.find((r) => r.principalId === id(principalCode));
  if (!rule) throw new Error(`Fixture setup error: ${dependentCode} has no rule on ${principalCode}`);
  return rule;
}

const resolver = createVisibilityResolver(STANDARD);

describe('visibility golden shapes (real rules from standard.v2_4.json)', () => {
  it('bare literal equality: Q_054 depends on Q_055 == YES', () => {
    expect(resolver.show(id('Q_054'), { [id('Q_055')]: 'YES' } as Answers)).toBe(true);
    expect(resolver.show(id('Q_054'), { [id('Q_055')]: 'NO' } as Answers)).toBe(false);
    expect(resolver.show(id('Q_054'), {} as Answers)).toBe(false);
  });

  it('{value} in [list]: DS_FERT_SP depends on Q_059 in [SP,SHCAN_SP,OWNCAN_SP,CON_WET] (or-group 1)', () => {
    const answers: Answers = { [id('Q_059')]: 'SP', [id('Q_066')]: [] };
    expect(resolver.show(id('DS_FERT_SP'), answers)).toBe(true);
  });

  it("{value} in [list]: false when the scalar answer is not a member", () => {
    const answers: Answers = { [id('Q_059')]: 'DIR', [id('Q_066')]: [] };
    expect(resolver.show(id('DS_FERT_SP'), answers)).toBe(false);
  });

  it("'LITERAL' in {value}: a multi-select answer array containing the literal matches", () => {
    // This exact clause (`'MAN_FERT' in {value}`) is one third of the real
    // 3-clause compound cell used throughout the standard (e.g. on
    // DS_FERT_SP's second rule); evaluated here directly against Q_066's
    // real multi-select answer shape.
    const ast = parseExpression("'MAN_FERT' in {value}");
    expect(
      evaluateBoolExpr(ast, { principalId: id('Q_066'), answers: { [id('Q_066')]: ['MAN_FERT', 'NATURAL'] }, resolveCode: (c) => id(c) }),
    ).toBe(true);
    expect(
      evaluateBoolExpr(ast, { principalId: id('Q_066'), answers: { [id('Q_066')]: ['NATURAL'] }, resolveCode: (c) => id(c) }),
    ).toBe(false);
  });

  it('numeric comparison: Q_009 depends on Q_05_042_01 {value} > 3', () => {
    expect(resolver.show(id('Q_009'), { [id('Q_05_042_01')]: 4 } as Answers)).toBe(true);
    expect(resolver.show(id('Q_009'), { [id('Q_05_042_01')]: 3 } as Answers)).toBe(false);
    expect(resolver.show(id('Q_009'), { [id('Q_05_042_01')]: 0 } as Answers)).toBe(false);
  });

  it('cross-question ref: DS_FERT_WB_NODATA_FRQ_D\'s rule on Q_070 is {Q_070} <= 250 (principal is Q_070 itself, by explicit code not {value})', () => {
    // Q_070 and Q_060 (this question's two real principals) each carry
    // their own deep dependsOn chains, so this is evaluated directly
    // against the real parsed expression rather than through the full
    // `show()` cascade (which is exercised, deliberately shallowly, by the
    // dedicated cascade test further down).
    const rule = ruleOn('DS_FERT_WB_NODATA_FRQ_D', 'Q_070');
    expect(rule.expression).toEqual({ kind: 'compare', op: '<=', left: { kind: 'question', code: 'Q_070' }, right: { kind: 'number', value: 250 } });
    const evalWith = (q070: number) =>
      evaluateBoolExpr(rule.expression, { principalId: id('Q_070'), answers: { [id('Q_070')]: q070 }, resolveCode: (c) => id(c) });
    expect(evalWith(200)).toBe(true);
    expect(evalWith(250)).toBe(true);
    expect(evalWith(300)).toBe(false);
  });

  it('{value}!=undefined: Q_070\'s rules on KGFERT_CONT/KGFERT_DIST are each "has an answer at all"', () => {
    // Q_070's two real principals (KGFERT_CONT, KGFERT_DIST) each carry a
    // long dependsOn chain of their own; evaluated directly against the
    // real parsed expressions rather than through the full `show()`
    // cascade, for the same reason as the cross-question-ref test above.
    const ruleOnCont = ruleOn('Q_070', 'KGFERT_CONT');
    expect(ruleOnCont.expression).toEqual({ kind: 'compare', op: '!=', left: { kind: 'value' }, right: { kind: 'undefined' } });
    const evalWith = (value: unknown) =>
      evaluateBoolExpr(ruleOnCont.expression, { principalId: id('KGFERT_CONT'), answers: { [id('KGFERT_CONT')]: value }, resolveCode: (c) => id(c) });
    expect(evalWith(10)).toBe(true);
    expect(evalWith(0)).toBe(true); // 0 is a real, meaningful answer — not "unanswered"
    expect(evalWith(undefined)).toBe(false);
  });

  it('real OR-group: NQ 5 depends on (Q_05_006 == CANALS) OR (Q_05_007 == UNDEV_WETLAND), both or-group 0', () => {
    // Both Q_05_006 and Q_05_007 are themselves gated on Q_05_005 == YES;
    // include that so this test exercises NQ 5's own OR-group logic rather
    // than tripping over its principals' principal.
    const expanded = { [id('Q_05_005')]: 'YES' };
    expect(resolver.show(id('NQ 5'), { ...expanded, [id('Q_05_006')]: 'CANALS' } as Answers)).toBe(true);
    expect(resolver.show(id('NQ 5'), { ...expanded, [id('Q_05_007')]: 'UNDEV_WETLAND' } as Answers)).toBe(true);
    expect(
      resolver.show(id('NQ 5'), { ...expanded, [id('Q_05_006')]: 'CANALS', [id('Q_05_007')]: 'UNDEV_WETLAND' } as Answers),
    ).toBe(true);
    expect(
      resolver.show(id('NQ 5'), { ...expanded, [id('Q_05_006')]: 'PROD_PONDS', [id('Q_05_007')]: 'AGRIC_LAND' } as Answers),
    ).toBe(false);
  });

  it('bare literal equality against a MULTI_SELECT principal is array membership, not string equality: Q_02_010 depends on Q_066 containing BOTH HOME_FEED and FORM_FEED', () => {
    // Q_02_010's two rules are the bare literals `HOME_FEED` (or-group 2)
    // and `FORM_FEED` (or-group 1) against Q_066 (a MULTI_SELECT) — two
    // singleton groups, ANDed, so both options must be present in the
    // selection. Written with no `in`/`{value}` wrapping at all, exactly
    // like a SINGLE_SELECT scalar-equality rule would be, even though
    // `{value}` resolves to an array here.
    expect(resolver.show(id('Q_02_010'), { [id('Q_066')]: ['HOME_FEED', 'FORM_FEED', 'NATURAL'] } as Answers)).toBe(
      true,
    );
    expect(resolver.show(id('Q_02_010'), { [id('Q_066')]: ['HOME_FEED'] } as Answers)).toBe(false);
    expect(resolver.show(id('Q_02_010'), { [id('Q_066')]: ['FORM_FEED'] } as Answers)).toBe(false);
    expect(resolver.show(id('Q_02_010'), { [id('Q_066')]: [] } as Answers)).toBe(false);
  });

  it('real AND-of-(OR-group)-plus-(singleton group): Q_05_025 = (or-group 2) AND (or-group 1)', () => {
    // or-group 2: Q_066 fert-compound OR Q_059 in [DIR,OWNCAN_WB,SHCAN_WB,OTHER(dead)]
    // or-group 1 (singleton): Q_066 in [HOME_FEED, FORM_FEED] compound
    const bothGroupsSatisfied: Answers = { [id('Q_066')]: ['MAN_FERT', 'HOME_FEED'] };
    expect(resolver.show(id('Q_05_025'), bothGroupsSatisfied)).toBe(true);

    // Satisfies group 2 (via Q_059) but not group 1 (Q_066 has neither
    // HOME_FEED nor FORM_FEED) -> overall hidden, since groups are ANDed.
    const onlyGroup2: Answers = { [id('Q_059')]: 'DIR', [id('Q_066')]: [] };
    expect(resolver.show(id('Q_05_025'), onlyGroup2)).toBe(false);

    // Satisfies group 1 but not group 2 -> still hidden.
    const onlyGroup1: Answers = { [id('Q_066')]: ['HOME_FEED'] };
    expect(resolver.show(id('Q_05_025'), onlyGroup1)).toBe(false);
  });

  it('real compound `||` cell alone: Q_085 depends on Q_066 (HOME_FEED or FORM_FEED present)', () => {
    expect(resolver.show(id('Q_085'), { [id('Q_066')]: ['HOME_FEED'] } as Answers)).toBe(true);
    expect(resolver.show(id('Q_085'), { [id('Q_066')]: ['FORM_FEED'] } as Answers)).toBe(true);
    expect(resolver.show(id('Q_085'), { [id('Q_066')]: ['NATURAL'] } as Answers)).toBe(false);
    expect(resolver.show(id('Q_085'), { [id('Q_066')]: [] } as Answers)).toBe(false);
  });

  it('hidden principal cascades to hidden dependent even with a stale answer present', () => {
    // PN_2_2 depends on Q_02_010 == YES; Q_02_011 depends on PN_2_2 == YES.
    // Q_02_010 is itself made visible here (Q_066 has both required feed
    // types), so its hiding of PN_2_2 is due purely to its own answer
    // being 'NO', which must then cascade to hide Q_02_011 too — even
    // though Q_02_011's answers entry still has a stale 'YES' left over
    // from before PN_2_2 became hidden.
    const answers: Answers = {
      [id('Q_066')]: ['HOME_FEED', 'FORM_FEED'],
      [id('Q_02_010')]: 'NO',
      [id('PN_2_2')]: 'YES',
    };
    expect(resolver.show(id('PN_2_2'), answers)).toBe(false);
    expect(resolver.show(id('Q_02_011'), answers)).toBe(false);
  });

  it('a question with no dependsOn rules at all is always visible', () => {
    expect(resolver.show(id('Q_055'), {} as Answers)).toBe(true);
  });

  describe('the 4 documented known-and-flagged data issues, evaluated as still-flagged', () => {
    it('dependency dead literal (Q_05_025 / Q_059): the correct real value OTH never satisfies the dead OTHER branch', () => {
      // Q_059's real values are DIR, OWNCAN_WB, SHCAN_WB, SP, OTH, CON_WET,
      // OWNCAN_SP, SHCAN_SP — the rule's list contains the literal 'OTHER'
      // (invalid) instead of 'OTH'. With the *correct* real value OTH and
      // no fertilizer use, Q_05_025 must stay hidden: proof the dead branch
      // can never fire for a real, legitimately-entered answer.
      const answers: Answers = { [id('Q_059')]: 'OTH', [id('Q_066')]: [] };
      expect(resolver.show(id('Q_05_025'), answers)).toBe(false);

      // Sanity check the flagged rule really is in the data, still dead.
      const rule = STANDARD.questions.find((q) => q.id === id('Q_05_025'))!.dependsOn.find(
        (r) => r.principalId === id('Q_059'),
      )!;
      expect(rule.expression).toEqual({
        kind: 'in',
        a: { kind: 'value' },
        b: { kind: 'list', values: ['DIR', 'OWNCAN_WB', 'SHCAN_WB', 'OTHER'] },
      });
    });

    it('the 3 dead Level/Characterisation expressions (NQ 9, Q_02_002, Q_02_003) are recorded in knownIssues and preserved verbatim', () => {
      for (const code of ['NQ 9', 'Q_02_002', 'Q_02_003']) {
        const questionId = id(code);
        const issue = STANDARD.knownIssues.find((k) => k.questionId === questionId);
        expect(issue, `expected a knownIssues entry for ${code}`).toBeDefined();

        const question = STANDARD.questions.find((q) => q.id === questionId)!;
        const noOption = question.options.find((o) => o.value === 'NO')!;
        expect(typeof noOption.level).toBe('object');
        expect(noOption.level).not.toBeNull();
        expect((noOption.level as { expression: string }).expression).toContain('Q_01_009');
        expect('expression' in noOption.characterisation).toBe(true);
      }
    });
  });
});
