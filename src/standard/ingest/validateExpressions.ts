/**
 * Save-time validator for every parsed expression in the standard:
 *
 *  - every dependency rule's expression
 *  - every option's Level and Characterisation expression string (the 10 +
 *    5 runtime-computed cases, see Document 1 §6.2)
 *
 * For each, confirms every `{Q_CODE}` / `{value}` reference resolves to a
 * real question, and every string literal compared against a
 * SINGLE_SELECT/MULTI_SELECT-family question's value matches one of that
 * question's real option values — EXCEPT the 4 known-and-flagged dead-data
 * cases (`KNOWN_ISSUES` in `normalize.ts`), which must be asserted as
 * still-present-and-flagged rather than silently passing OR silently
 * failing: this function throws if any of those 4 stop reproducing (data
 * "fixed" upstream without updating the flag) just as loudly as it throws
 * on a genuinely new, undocumented mismatch.
 */
import type { BoolExpr, Operand } from '../../dependency-engine/expression/ast';
import { parseExpression } from '../../dependency-engine/expression/parse';
import type { ControlType, Question, Standard } from '../schema/types';
import { KNOWN_ISSUES } from './normalize';

const SELECTABLE_CONTROLS: ReadonlySet<ControlType> = new Set([
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'SINGLE_SELECT_MODAL',
  'MULTI_SELECT_MODAL',
]);

function operandOwnerCode(op: Operand, principalCode: string): string | null {
  if (op.kind === 'value') return principalCode;
  if (op.kind === 'question') return op.code;
  return null;
}

function operandLiterals(op: Operand): string[] | null {
  if (op.kind === 'literal') return [op.value];
  if (op.kind === 'list') return op.values;
  return null;
}

/**
 * Walks a BoolExpr, invoking `sink` once per operand that references a
 * question (`{value}` or `{Q_CODE}`), together with any literal string(s)
 * being compared against it on the other side of that same compare/in node
 * (or `null` when there is nothing to check membership of, e.g. a numeric
 * comparison — the reference is still resolved-checked in that case).
 */
function walk(expr: BoolExpr, principalCode: string, sink: (ownerCode: string, literals: string[] | null) => void): void {
  if (expr.kind === 'or') {
    for (const clause of expr.clauses) walk(clause, principalCode, sink);
    return;
  }
  const [x, y] = expr.kind === 'compare' ? [expr.left, expr.right] : [expr.a, expr.b];
  const ownerX = operandOwnerCode(x, principalCode);
  const ownerY = operandOwnerCode(y, principalCode);
  if (ownerX) sink(ownerX, operandLiterals(y));
  if (ownerY) sink(ownerY, operandLiterals(x));
}

export interface ValidationResult {
  confirmedKnownIssueCodes: Set<string>;
}

export function validateExpressions(standard: Pick<Standard, 'questions' | 'codeAliases'>): ValidationResult {
  const byId = new Map<number, Question>(standard.questions.map((q) => [q.id, q]));
  const byCode = (code: string): Question => {
    const id = standard.codeAliases[code];
    if (id === undefined) {
      throw new Error(`Expression references unknown question code ${JSON.stringify(code)}`);
    }
    const q = byId.get(id);
    if (!q) throw new Error(`Code ${JSON.stringify(code)} resolved to id ${id}, but no such question exists`);
    return q;
  };

  const knownIssuesByCode = new Map(KNOWN_ISSUES.map((k) => [k.code, k]));
  const confirmed = new Set<string>();

  function checkOwner(ownerCode: string, literals: string[] | null, contextQuestion: Question, field: string): void {
    const owner = byCode(ownerCode); // throws on an unresolvable code — always a real bug
    if (!literals) return; // pure resolution check (e.g. a numeric cross-question comparison)
    if (!SELECTABLE_CONTROLS.has(owner.controlType)) return; // NUMBER/TEXT/etc: no discrete values to check against
    const realValues = new Set(owner.options.map((o) => o.value));
    for (const lit of literals) {
      if (realValues.has(lit)) continue;
      const known = knownIssuesByCode.get(contextQuestion.code);
      if (known) {
        confirmed.add(contextQuestion.code);
        continue;
      }
      throw new Error(
        `Undocumented mismatch: literal ${JSON.stringify(lit)} in ${field} of question ` +
          `${contextQuestion.code} (id ${contextQuestion.id}) does not match any real option value of ` +
          `${ownerCode} (real values: ${[...realValues].sort().join(', ')}). If this is genuinely new dead ` +
          `data, it must be investigated — do not silently add it to KNOWN_ISSUES without understanding why.`,
      );
    }
  }

  function validateTernaryString(raw: string, contextQuestion: Question, field: string): void {
    const qIndex = raw.indexOf(' ? ');
    if (qIndex === -1) {
      throw new Error(
        `Expected a ternary expression (\`condition ? a : b\`) in ${field} of question ` +
          `${contextQuestion.code}, got: ${JSON.stringify(raw)}`,
      );
    }
    const condition = raw.slice(0, qIndex);
    const ast = parseExpression(condition);
    walk(ast, contextQuestion.code, (ownerCode, literals) => checkOwner(ownerCode, literals, contextQuestion, field));
  }

  for (const q of standard.questions) {
    for (const rule of q.dependsOn) {
      const principal = byId.get(rule.principalId);
      if (!principal) {
        throw new Error(`Dependency rule on ${q.code} (id ${q.id}) has an unresolved principalId ${rule.principalId}`);
      }
      const field = `dependsOn[${principal.code}].expression`;
      walk(rule.expression, principal.code, (ownerCode, literals) => checkOwner(ownerCode, literals, q, field));
    }

    for (const opt of q.options) {
      if (typeof opt.level === 'object' && opt.level !== null && 'expression' in opt.level) {
        validateTernaryString(opt.level.expression, q, `options[${opt.value}].level`);
      }
      if (!(opt.characterisation instanceof Set) && 'expression' in opt.characterisation) {
        validateTernaryString(opt.characterisation.expression, q, `options[${opt.value}].characterisation`);
      }
    }
  }

  const missing = KNOWN_ISSUES.filter((k) => !confirmed.has(k.code));
  if (missing.length > 0) {
    throw new Error(
      `Expected known-and-flagged data issues were NOT reproduced during validation: ` +
        `${missing.map((k) => k.code).join(', ')}. Either the parser regressed, or the underlying source data ` +
        `changed and KNOWN_ISSUES needs to be revisited (not silently removed).`,
    );
  }

  return { confirmedKnownIssueCodes: confirmed };
}
