import { describe, expect, it } from 'vitest';
import { parseExpression } from '../expression/parse';
import { isBareLiteralClause, normalizeQuotes, parseListLiteral, splitCompoundOr, tokenizeClause } from '../expression/tokenize';

describe('normalizeQuotes', () => {
  it('converts curly single quotes to straight quotes', () => {
    expect(normalizeQuotes('‘MAN_FERT’')).toBe("'MAN_FERT'");
  });

  it('leaves straight quotes untouched', () => {
    expect(normalizeQuotes("'MAN_FERT'")).toBe("'MAN_FERT'");
  });
});

describe('splitCompoundOr', () => {
  it('splits a compound cell on ||, trimming whitespace', () => {
    expect(splitCompoundOr("'HOME_FEED' in {value} || 'FORM_FEED' in {value}")).toEqual([
      "'HOME_FEED' in {value}",
      "'FORM_FEED' in {value}",
    ]);
  });

  it('returns the whole clause unsplit when there is no ||', () => {
    expect(splitCompoundOr('YES')).toEqual(['YES']);
  });
});

describe('isBareLiteralClause', () => {
  it('is true for a plain single-word literal', () => {
    expect(isBareLiteralClause('YES')).toBe(true);
  });

  it('is true for a bare literal containing internal spaces', () => {
    expect(isBareLiteralClause('BOTH ACTIVE AND PASSIVE')).toBe(true);
  });

  it('is false once a ref, quote, bracket, operator or `in` is present', () => {
    expect(isBareLiteralClause('{value} == YES')).toBe(false);
    expect(isBareLiteralClause("'YES'")).toBe(false);
    expect(isBareLiteralClause('{value} in [1]')).toBe(false);
    expect(isBareLiteralClause('{value} > 3')).toBe(false);
  });
});

describe('parseListLiteral', () => {
  it('parses a cleanly single-quoted list', () => {
    expect(parseListLiteral("'SEMI_INT','INT','SPR_INT'")).toEqual(['SEMI_INT', 'INT', 'SPR_INT']);
  });

  it('tolerates an unquoted member mixed in with quoted ones', () => {
    expect(parseListLiteral("'1pM','2pM','3pM',4pM")).toEqual(['1pM', '2pM', '3pM', '4pM']);
  });

  it('tolerates a stray doubled trailing quote', () => {
    expect(parseListLiteral("'4pM','3pM','2pM','1pM','2MO''")).toEqual(['4pM', '3pM', '2pM', '1pM', '2MO']);
  });
});

describe('tokenizeClause', () => {
  it('captures a {value} ref', () => {
    expect(tokenizeClause('{value} > 3')).toEqual([
      { kind: 'REF', text: 'value' },
      { kind: 'OP', text: '>' },
      { kind: 'NUMBER', text: '3' },
    ]);
  });

  it('captures a question-code ref containing a literal space without splitting it', () => {
    // Some legacy question codes contain a literal space (e.g. `NQ 9`); the
    // tokenizer must capture everything up to the closing `}` verbatim.
    expect(tokenizeClause('{NQ 9} == YES')).toEqual([
      { kind: 'REF', text: 'NQ 9' },
      { kind: 'OP', text: '==' },
      { kind: 'WORD', text: 'YES' },
    ]);
  });

  it('captures a bracketed list as one raw LIST token', () => {
    const tokens = tokenizeClause("{value} in ['SP','SHCAN_SP']");
    expect(tokens).toEqual([
      { kind: 'REF', text: 'value' },
      { kind: 'IN', text: 'in' },
      { kind: 'LIST', text: "'SP','SHCAN_SP'" },
    ]);
  });
});

describe('parseExpression — every operator and both `in` directions', () => {
  it('parses an implicit bare-literal equality', () => {
    expect(parseExpression('YES')).toEqual({
      kind: 'compare',
      op: '==',
      left: { kind: 'value' },
      right: { kind: 'literal', value: 'YES' },
    });
  });

  it('parses a multi-word bare-literal equality', () => {
    expect(parseExpression('BOTH ACTIVE AND PASSIVE')).toEqual({
      kind: 'compare',
      op: '==',
      left: { kind: 'value' },
      right: { kind: 'literal', value: 'BOTH ACTIVE AND PASSIVE' },
    });
  });

  it('parses {value} in [list] (scalar tested against a literal list)', () => {
    expect(parseExpression("{value} in ['SP','SHCAN_SP','OWNCAN_SP','CON_WET']")).toEqual({
      kind: 'in',
      a: { kind: 'value' },
      b: { kind: 'list', values: ['SP', 'SHCAN_SP', 'OWNCAN_SP', 'CON_WET'] },
    });
  });

  it("parses 'LITERAL' in {value} (literal tested against a multi-select's array-valued answer)", () => {
    expect(parseExpression("'MAN_FERT' in {value}")).toEqual({
      kind: 'in',
      a: { kind: 'literal', value: 'MAN_FERT' },
      b: { kind: 'value' },
    });
  });

  it('parses <=', () => {
    expect(parseExpression('{Q_070} <= 250')).toEqual({
      kind: 'compare',
      op: '<=',
      left: { kind: 'question', code: 'Q_070' },
      right: { kind: 'number', value: 250 },
    });
  });

  it('parses >=', () => {
    expect(parseExpression('{value} >= 10')).toEqual({
      kind: 'compare',
      op: '>=',
      left: { kind: 'value' },
      right: { kind: 'number', value: 10 },
    });
  });

  it('parses < and >', () => {
    expect(parseExpression('{value} < 100')).toEqual({
      kind: 'compare',
      op: '<',
      left: { kind: 'value' },
      right: { kind: 'number', value: 100 },
    });
    expect(parseExpression('{value} > 1999')).toEqual({
      kind: 'compare',
      op: '>',
      left: { kind: 'value' },
      right: { kind: 'number', value: 1999 },
    });
  });

  it('parses explicit ==', () => {
    expect(parseExpression("{value} == 'YES'")).toEqual({
      kind: 'compare',
      op: '==',
      left: { kind: 'value' },
      right: { kind: 'literal', value: 'YES' },
    });
  });

  it('parses {value}!=undefined using the undefined keyword operand, not the string "undefined"', () => {
    expect(parseExpression('{value}!=undefined')).toEqual({
      kind: 'compare',
      op: '!=',
      left: { kind: 'value' },
      right: { kind: 'undefined' },
    });
  });

  it('parses a real 3-clause `||`-compound cell into an OrExpr, distinct from Or-group row semantics', () => {
    const raw =
      "‘MAN_FERT’ in {value} || ‘AG_FERT’ in {value} || ‘FORM_FERT’ in {value}";
    expect(parseExpression(raw)).toEqual({
      kind: 'or',
      clauses: [
        { kind: 'in', a: { kind: 'literal', value: 'MAN_FERT' }, b: { kind: 'value' } },
        { kind: 'in', a: { kind: 'literal', value: 'AG_FERT' }, b: { kind: 'value' } },
        { kind: 'in', a: { kind: 'literal', value: 'FORM_FERT' }, b: { kind: 'value' } },
      ],
    });
  });

  it('normalizes curly and straight quotes identically', () => {
    expect(parseExpression("'MAN_FERT' in {value}")).toEqual(parseExpression('‘MAN_FERT’ in {value}'));
  });
});
