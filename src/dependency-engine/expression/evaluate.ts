import type { BoolExpr, Operand } from './ast';

/**
 * The current in-progress (or completed) answers for an assessment, keyed
 * by question id. A question with no entry (or an `undefined` value) is
 * "unanswered" — this is exactly what `{value}!=undefined` tests for, and
 * it is also what a hidden question is reset to by `clearHiddenAnswers.ts`.
 */
export type Answers = Record<number, unknown>;

export interface EvalContext {
  /** The id of the rule's own principal question — what a bare `{value}` refers to. */
  principalId: number;
  answers: Answers;
  /** Resolves a `{Q_CODE}` reference's business code to a stable question id. */
  resolveCode: (code: string) => number;
}

function resolveOperand(op: Operand, ctx: EvalContext): unknown {
  switch (op.kind) {
    case 'value':
      return ctx.answers[ctx.principalId];
    case 'question':
      return ctx.answers[ctx.resolveCode(op.code)];
    case 'literal':
      return op.value;
    case 'number':
      return op.value;
    case 'list':
      return op.values;
    case 'undefined':
      return undefined;
  }
}

function toNumber(v: unknown): number {
  return typeof v === 'number' ? v : Number(v);
}

/** Compares two resolved operand values loosely (string-coerced), treating `undefined` specially. */
function looseEquals(a: unknown, b: unknown): boolean {
  if (a === undefined || b === undefined) return a === b;
  return String(a) === String(b);
}

/**
 * Equality that is array-aware on either side: if one side is an array
 * (a multi-select's answer) and the other is a scalar, this is membership
 * (`array contains scalar`) rather than a literal `String(array) ===
 * String(scalar)` comparison.
 *
 * This matters for real rules like `Q_02_010`'s bare-literal `HOME_FEED` /
 * `FORM_FEED` clauses against `Q_066` (a MULTI_SELECT): the source writes
 * these exactly like a scalar SINGLE_SELECT equality (no `in`, no `{value}`
 * wrapping — just the bare option code), but `{value}` resolves to an
 * array at runtime for a multi-select principal, and the evident intent is
 * "this option is one of the selected ones", not "the whole selection
 * equals this one string".
 */
function arrayAwareEquals(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => looseEquals(v, b[i]));
  }
  if (Array.isArray(a)) return a.some((item) => looseEquals(item, b));
  if (Array.isArray(b)) return b.some((item) => looseEquals(item, a));
  return looseEquals(a, b);
}

/**
 * Evaluates a parsed `BoolExpr` against a concrete set of answers.
 *
 * `in` deliberately resolves BOTH operands first and then checks which one
 * is actually array-shaped at runtime, rather than trusting which side of
 * the source `in` token the list literal was on — the real data uses `in`
 * in both directions (`{value} in ['A','B']` and `'LITERAL' in {value}`,
 * where `{value}` at runtime is a multi-select's array-valued answer).
 */
export function evaluateBoolExpr(expr: BoolExpr, ctx: EvalContext): boolean {
  switch (expr.kind) {
    case 'or':
      return expr.clauses.some((clause) => evaluateBoolExpr(clause, ctx));

    case 'in': {
      const a = resolveOperand(expr.a, ctx);
      const b = resolveOperand(expr.b, ctx);
      if (Array.isArray(b)) return b.some((item) => looseEquals(item, a));
      if (Array.isArray(a)) return a.some((item) => looseEquals(item, b));
      return false;
    }

    case 'compare': {
      const left = resolveOperand(expr.left, ctx);
      const right = resolveOperand(expr.right, ctx);
      switch (expr.op) {
        case '==':
        case '!=': {
          // `{value}!=undefined` means "is there any answer at all", not
          // "does an array of answers contain the literal word undefined"
          // — never array-aware, even if `{value}` happens to resolve to
          // an array for a multi-select principal.
          const isUndefinedCheck = expr.left.kind === 'undefined' || expr.right.kind === 'undefined';
          const eq = isUndefinedCheck ? looseEquals(left, right) : arrayAwareEquals(left, right);
          return expr.op === '==' ? eq : !eq;
        }
        case '<':
          return toNumber(left) < toNumber(right);
        case '<=':
          return toNumber(left) <= toNumber(right);
        case '>':
          return toNumber(left) > toNumber(right);
        case '>=':
          return toNumber(left) >= toNumber(right);
      }
    }
  }
}
