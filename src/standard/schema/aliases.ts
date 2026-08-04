import type { Standard } from './types';

/**
 * Looks up a question's stable numeric id by its business `Code`
 * (`Q_02_014`, the space-containing `NQ 9`, etc). Throws rather than
 * returning `undefined` so a bad/renamed code fails loudly wherever it is
 * used, instead of silently resolving to "no question".
 */
export function resolveCodeToId(standard: Pick<Standard, 'codeAliases'>, code: string): number {
  const id = standard.codeAliases[code];
  if (id === undefined) {
    throw new Error(`Unknown question code: ${JSON.stringify(code)}`);
  }
  return id;
}

/** Builds the `Code -> id` alias table from a fully-populated question list. */
export function buildCodeAliases(questions: ReadonlyArray<{ id: number; code: string }>): Record<string, number> {
  const aliases: Record<string, number> = {};
  for (const q of questions) {
    if (Object.prototype.hasOwnProperty.call(aliases, q.code)) {
      throw new Error(`Duplicate question code: ${JSON.stringify(q.code)}`);
    }
    aliases[q.code] = q.id;
  }
  return aliases;
}
