import type { BoolExpr, ComparisonOp, Operand } from './ast';
import {
  isBareLiteralClause,
  parseListLiteral,
  splitCompoundOr,
  tokenizeClause,
  type Token,
} from './tokenize';

const COMPARISON_OPS: ReadonlySet<string> = new Set(['==', '!=', '<', '<=', '>', '>=']);

function operandFromToken(token: Token, clauseForError: string): Operand {
  switch (token.kind) {
    case 'REF':
      return token.text === 'value' ? { kind: 'value' } : { kind: 'question', code: token.text };
    case 'STRING':
      return { kind: 'literal', value: token.text };
    case 'LIST':
      return { kind: 'list', values: parseListLiteral(token.text) };
    case 'NUMBER':
      return { kind: 'number', value: Number(token.text) };
    case 'WORD':
      if (token.text === 'undefined') return { kind: 'undefined' };
      // A bare word standing as one whole operand (not the whole clause —
      // that case is short-circuited by isBareLiteralClause before we ever
      // tokenize) is still a plain string literal, e.g. the `NO` in a
      // `{value} == NO`-shaped clause were one ever to appear unquoted.
      return { kind: 'literal', value: token.text };
    case 'IN':
    case 'OP':
      throw new Error(`Expected an operand but found operator token '${token.text}' in: ${clauseForError}`);
  }
}

/** Parses a single already-`||`-split clause into a `CompareExpr | InExpr`. */
function parseClause(clause: string): BoolExpr {
  if (isBareLiteralClause(clause)) {
    return {
      kind: 'compare',
      op: '==',
      left: { kind: 'value' },
      right: { kind: 'literal', value: clause.trim() },
    };
  }

  const tokens = tokenizeClause(clause);

  // Find the single operator/`in` token that splits the clause into a left
  // and right operand. The grammar never nests or has more than one
  // operator per clause.
  const opIndex = tokens.findIndex((t) => t.kind === 'OP' || t.kind === 'IN');
  if (opIndex === -1) {
    throw new Error(`No comparison operator or 'in' found in expression clause: ${clause}`);
  }
  const leftTokens = tokens.slice(0, opIndex);
  const opToken = tokens[opIndex];
  const rightTokens = tokens.slice(opIndex + 1);

  if (leftTokens.length !== 1 || rightTokens.length !== 1) {
    throw new Error(
      `Expected exactly one operand on each side of '${opToken.text}' in expression clause: ${clause}`,
    );
  }

  const left = operandFromToken(leftTokens[0], clause);
  const right = operandFromToken(rightTokens[0], clause);

  if (opToken.kind === 'IN') {
    return { kind: 'in', a: left, b: right };
  }

  if (!COMPARISON_OPS.has(opToken.text)) {
    throw new Error(`Unsupported operator '${opToken.text}' in expression clause: ${clause}`);
  }

  return { kind: 'compare', op: opToken.text as ComparisonOp, left, right };
}

/**
 * Parses one full dependency-rule / Level / Characterisation expression
 * cell (which may compound multiple clauses with `||`) into a `BoolExpr`.
 * This is the single entry point ingestion code should call.
 */
export function parseExpression(raw: string): BoolExpr {
  const clauses = splitCompoundOr(raw);
  if (clauses.length === 0) {
    throw new Error(`Empty expression`);
  }
  const parsedClauses = clauses.map(parseClause);
  if (parsedClauses.length === 1) {
    return parsedClauses[0];
  }
  return { kind: 'or', clauses: parsedClauses };
}
