/**
 * Tokenizer for the DependsOn / Level / Characterisation expression language.
 *
 * This is a small, purpose-built line scanner — NOT a general expression
 * tokenizer — because the source grammar is narrow and known (see ast.ts).
 * It is used only at ingestion time (and by `validateExpressions.ts`, which
 * re-parses option Level/Characterisation strings to check them without
 * storing their ASTs). The runtime engine never calls this.
 */

export type TokenKind =
  | 'REF' // {...}  raw content, never split on whitespace
  | 'STRING' // 'quoted' or "quoted"
  | 'LIST' // [ ... ] — raw inner text, comma-split by the parser
  | 'OP' // == != <= >= < >
  | 'IN' // the bare word `in`
  | 'NUMBER' // bare numeric word
  | 'WORD'; // any other bare word/word-run (incl. `undefined`, or a whole
  //          multi-word bare literal like `BOTH ACTIVE AND PASSIVE`)

export interface Token {
  kind: TokenKind;
  text: string;
}

const NUMBER_RE = /^-?\d+(\.\d+)?$/;

/**
 * Normalizes curly quotes to straight quotes. The source data mixes
 * straight (`'`) and curly (`‘` `’`) quotes across otherwise-identical rule
 * patterns (e.g. the fertilizer `||` compound cell appears with both). Do
 * this BEFORE tokenizing so the tokenizer only ever has to handle one quote
 * style.
 */
export function normalizeQuotes(input: string): string {
  return input.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

/**
 * Splits a full cell expression on top-level `||` compound-OR separators.
 * This must run before per-clause tokenization: `||` never appears nested
 * inside a `{...}`, `'...'`, or `[...]` span in the real data, so a plain
 * regex split is sufficient and keeps this function trivial to audit.
 */
export function splitCompoundOr(expression: string): string[] {
  return normalizeQuotes(expression)
    .split(/\|\|/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * True when a (single, already-`||`-split) clause has no structural
 * punctuation at all — i.e. it is a bare literal like `YES`, `OTHER`, or
 * the multi-word `BOTH ACTIVE AND PASSIVE` — meaning "the principal's
 * answer equals this literal" (implicit `{value} == <literal>`).
 *
 * This must be checked before running the general tokenizer, because a
 * bare literal may itself contain internal whitespace that would otherwise
 * be mis-split into multiple WORD tokens.
 */
export function isBareLiteralClause(clause: string): boolean {
  if (/[{}[\]'"]/.test(clause)) return false;
  if (/(==|!=|<=|>=|<|>)/.test(clause)) return false;
  if (/\bin\b/.test(clause)) return false;
  return clause.trim().length > 0;
}

/**
 * Tokenizes a single clause (already split on `||`, already confirmed NOT
 * to be a bare literal via `isBareLiteralClause`). Scans left to right;
 * `{...}` refs capture everything up to the next `}` verbatim (some
 * question codes contain a literal space, e.g. `NQ 9` — never split on
 * whitespace inside a ref).
 */
export function tokenizeClause(clause: string): Token[] {
  const src = normalizeQuotes(clause);
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '{') {
      const close = src.indexOf('}', i + 1);
      if (close === -1) {
        throw new Error(`Unterminated '{' in expression: ${clause}`);
      }
      tokens.push({ kind: 'REF', text: src.slice(i + 1, close).trim() });
      i = close + 1;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      const close = src.indexOf(quote, i + 1);
      if (close === -1) {
        throw new Error(`Unterminated string literal in expression: ${clause}`);
      }
      tokens.push({ kind: 'STRING', text: src.slice(i + 1, close) });
      i = close + 1;
      continue;
    }

    if (ch === '[') {
      const close = src.indexOf(']', i + 1);
      if (close === -1) {
        throw new Error(`Unterminated '[' in expression: ${clause}`);
      }
      tokens.push({ kind: 'LIST', text: src.slice(i + 1, close) });
      i = close + 1;
      continue;
    }

    // Two-character operators first.
    const two = src.slice(i, i + 2);
    if (two === '==' || two === '!=' || two === '<=' || two === '>=') {
      tokens.push({ kind: 'OP', text: two });
      i += 2;
      continue;
    }

    if (ch === '<' || ch === '>') {
      tokens.push({ kind: 'OP', text: ch });
      i += 1;
      continue;
    }

    // Bare word run: alnum, underscore, dot, minus, plus (covers things
    // like `4plus`, `-28.48`, `SEMI-INT`-style value codes if they ever
    // appear bare, and `undefined`).
    const start = i;
    while (i < n && /[^\s{}[\]'"<>=!]/.test(src[i])) {
      i++;
    }
    const word = src.slice(start, i);
    if (word.length === 0) {
      // Shouldn't happen given the checks above, but avoid an infinite loop
      // on any unexpected character rather than hanging the ingestion run.
      throw new Error(`Unexpected character '${ch}' in expression: ${clause}`);
    }
    if (word === 'in') {
      tokens.push({ kind: 'IN', text: word });
    } else if (NUMBER_RE.test(word)) {
      tokens.push({ kind: 'NUMBER', text: word });
    } else {
      tokens.push({ kind: 'WORD', text: word });
    }
  }

  return tokens;
}

/**
 * Parses the raw inner text of a `[...]` list literal into its member
 * strings. Tolerant of the real data's inconsistencies: mixed quoting
 * (`'SEMI_INT','INT'`), an unquoted member (`4pM` in `['1pM','2pM','3pM',4pM]`),
 * and a stray doubled trailing quote (`'2MO''`). Every member is stripped of
 * any leading/trailing quote characters after curly-quote normalization.
 */
export function parseListLiteral(innerText: string): string[] {
  return innerText
    .split(',')
    .map((raw) => raw.trim().replace(/^['"]+/, '').replace(/['"]+$/, ''))
    .filter((s) => s.length > 0);
}
