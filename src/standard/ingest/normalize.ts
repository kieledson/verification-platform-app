import type { Characterisation, CharacterisationValue, KnownIssue, Level } from '../schema/types';
import { normalizeQuotes } from '../../dependency-engine/expression/tokenize';

export { normalizeQuotes };

const CHARACTERISATION_MAP: Record<string, Characterisation> = {
  practice: 'PRACTICE',
  governance: 'GOVERNANCE',
  documentation: 'DOCUMENTATION',
};

/**
 * The 4 known-and-flagged data-quality defects in the v2.4 source (Document
 * 1 §7). These are reported, not fixed: the rebuild preserves the exact
 * dead expression/literal text, but records it here so nothing downstream
 * mistakes "never fires" for a bug in the rebuild itself.
 *
 * Do not add to this list to silence a validator failure — if
 * `validateExpressions.ts` finds a mismatch not listed here, that is a real
 * bug (in the parser or in the source) and must be investigated, not
 * papered over.
 */
export const KNOWN_ISSUES: ReadonlyArray<Omit<KnownIssue, 'questionId'> & { code: string }> = [
  {
    code: 'NQ 9',
    field: 'options.NO.level,characterisation',
    description:
      "Option 'NO' Level and Characterisation are runtime expressions testing Q_01_009 against the invalid literals " +
      "'INTENSIVE'/'SEMI_INTENSIVE'/'SUPER_INTENSIVE'. Q_01_009's real values are SILVO, EXT, INT, SEMI_INT, RICE-SHR, " +
      "SPR_INT, so the `in` test can never be true and both expressions always fall through to `undefined` (dead code, " +
      'preserved verbatim).',
  },
  {
    code: 'Q_02_002',
    field: 'options.NO.level,characterisation',
    description:
      "Option 'NO' Level and Characterisation are runtime expressions testing Q_01_009 against the invalid literals " +
      "'SUPER_INTENSIVE'/'INTENSIVE'/'SEMI-INTENSIVE'. Same dead-code shape as NQ 9's NO option; the sibling question " +
      'Q_02_032 uses the correct short codes.',
  },
  {
    code: 'Q_02_003',
    field: 'options.NO.level,characterisation',
    description:
      "Option 'NO' Level and Characterisation are runtime expressions testing Q_01_009 against the invalid literals " +
      "'SUPER_INTENSIVE'/'INTENSIVE'/'SEMI-INTENSIVE'. Same dead-code shape as NQ 9's NO option; the sibling question " +
      'Q_05_053 uses the correct short codes.',
  },
  {
    code: 'Q_05_025',
    field: 'dependsOn[Q_059].expression',
    description:
      "One visibility rule depends on Q_059 testing for the literal 'OTHER', but Q_059's real option values are DIR, " +
      "OWNCAN_WB, SHCAN_WB, SP, OTH, CON_WET, OWNCAN_SP, SHCAN_SP — the correct token is 'OTH'. That branch of the " +
      '`in` list can never match (dead literal, preserved verbatim).',
  },
];

/**
 * Parses a Level table cell. Handles the plain numeric/`N/A` cases and the
 * ternary-expression cases (kept as a raw string — see `Level` in
 * `standard/schema/types.ts` for why these are never evaluated here).
 * Returns `undefined` for an empty ("—") cell, meaning the option
 * contributes no score at all.
 */
export function normalizeLevel(raw: string): Level {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null;
  if (trimmed === 'N/A') return 'N/A';
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  // Anything else is a runtime ternary expression string, e.g.
  // `{Q_070} <= 125 ? 2 : 1`.
  return { expression: normalizeQuotes(trimmed) };
}

/**
 * Parses a Characterisation table cell into a normalized enum Set, or an
 * `{expression}` for the (rare) runtime-computed cases. Tolerant of the
 * source's inconsistent renderings: comma-joined (`"Practice, Governance"`),
 * differing order (`"Governance, Practice"`), and the empty-cell dash.
 */
export function normalizeCharacterisation(raw: string): CharacterisationValue | undefined {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return undefined;

  // A runtime expression looks like `{Q_05_006} in [...] ? 'Practice,Governance' : undefined`.
  if (trimmed.includes('{')) {
    return { expression: normalizeQuotes(trimmed) };
  }

  const tags = trimmed
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const set = new Set<Characterisation>();
  for (const tag of tags) {
    const mapped = CHARACTERISATION_MAP[tag];
    if (!mapped) {
      throw new Error(`Unrecognized characterisation tag: ${JSON.stringify(tag)} (from ${JSON.stringify(raw)})`);
    }
    set.add(mapped);
  }
  return set;
}
