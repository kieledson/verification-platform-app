/**
 * AST for the small boolean expression language used by DependsOn / visibility
 * rules in the questionnaire standard (see Document 1, section 8).
 *
 * This AST is produced ONCE at ingestion time (see
 * `standard/ingest/parseQuestionnaireMd.ts` -> `dependency-engine/expression/parse.ts`)
 * and stored, already-parsed, inside the generated `standard.v2_4.json`.
 * The runtime visibility resolver (`dependency-engine/visibility/resolveVisibility.ts`)
 * only ever walks this AST — it never re-parses a string at runtime.
 *
 * Grammar observed in the real data (879 rules):
 *   clause      := literalClause | compareClause | inClause
 *   literalClause := BARE_WORDS                         // implicit `{value} == BARE_WORDS`
 *   compareClause := operand comparisonOp operand
 *   inClause      := operand 'in' operand
 *   cell        := clause ('||' clause)*                // compound OR *within* one table cell
 *   comparisonOp := '==' | '!=' | '<' | '<=' | '>' | '>='
 *   operand     := '{value}' | '{QUESTION_CODE}' | STRING | NUMBER | 'undefined' | LIST
 *   LIST        := '[' operand (',' operand)* ']'
 *
 * Note the OR produced by `||` inside a single cell (`OrExpr`) is a distinct
 * concept from the `Or-group` *column*, which ORs whole separate rule ROWS
 * together (see `DependencyRule.orGroupNo` in `standard/schema/types.ts` and
 * `dependency-engine/visibility/resolveVisibility.ts`). Both ultimately mean
 * "OR these booleans", but they are never conflated in this AST: an `OrExpr`
 * only ever comes from `||` tokens actually present in one cell's source text.
 */

/** A reference to the answer of the rule's own principal question: `{value}`. */
export interface ValueRefOperand {
  kind: 'value';
}

/**
 * A reference to another (or, in a handful of self-referential rules, the
 * same) question by its business `Code`, e.g. `{Q_070}`. Resolved to a
 * numeric question id at evaluation time via the standard's `codeAliases`
 * map — codes are kept here (not pre-resolved to ids) so the AST is a pure,
 * serializable description of the source text.
 */
export interface QuestionRefOperand {
  kind: 'question';
  code: string;
}

/** A quoted or bare string literal, e.g. `'YES'` or the bare word `YES`. */
export interface StringLiteralOperand {
  kind: 'literal';
  value: string;
}

/** A bare numeric literal, e.g. `1999`, `125`, `3`. */
export interface NumberLiteralOperand {
  kind: 'number';
  value: number;
}

/**
 * The bare keyword `undefined` as it appears in `{value}!=undefined`. Kept
 * distinct from a string literal `"undefined"` (which never occurs in the
 * data) so evaluation can treat it as "no answer given" rather than a value
 * to compare against.
 */
export interface UndefinedOperand {
  kind: 'undefined';
}

/** A bracketed list literal, e.g. `['SEMI_INT','INT','SPR_INT']`. */
export interface ListLiteralOperand {
  kind: 'list';
  values: string[];
}

export type Operand =
  | ValueRefOperand
  | QuestionRefOperand
  | StringLiteralOperand
  | NumberLiteralOperand
  | UndefinedOperand
  | ListLiteralOperand;

export type ComparisonOp = '==' | '!=' | '<' | '<=' | '>' | '>=';

/** `left <op> right`, e.g. `{Q_070} <= 250` or the implicit `{value} == 'YES'`. */
export interface CompareExpr {
  kind: 'compare';
  op: ComparisonOp;
  left: Operand;
  right: Operand;
}

/**
 * `a in b`. Deliberately does NOT commit to which side is the "needle" vs
 * the "haystack" at parse time: the real data uses `in` in both directions
 * (`{value} in ['A','B']` — scalar tested against a literal list — and
 * `'LITERAL' in {value}` — a literal tested against a multi-select's
 * array-valued answer). The evaluator resolves this at evaluation time by
 * checking which resolved runtime value is actually array-shaped.
 */
export interface InExpr {
  kind: 'in';
  a: Operand;
  b: Operand;
}

/** `clauses[0] || clauses[1] || ...` — an OR compounded *within one cell*. */
export interface OrExpr {
  kind: 'or';
  clauses: BoolExpr[];
}

export type BoolExpr = CompareExpr | InExpr | OrExpr;
