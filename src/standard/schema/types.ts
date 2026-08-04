import type { BoolExpr } from '../../dependency-engine/expression/ast';

/**
 * The platform stores every question/option/tooltip/alert as a localised
 * text array (`en`, `vi`, `id`, `te`). Per Document 1 §0 the rebuild is
 * English-only for now, but the shape is kept so the other locales can be
 * re-attached later without a migration. Ingestion only ever populates the
 * single `en` entry; `ManualText` is always `null` and `AutoText`/`Text`
 * are both set to the source markdown's English string.
 */
export interface LocalizedTextEntry {
  LocaleCode: string;
  AutoText: string;
  ManualText: string | null;
  Text: string;
}

export type LocalizedText = LocalizedTextEntry[];

export type Characterisation = 'PRACTICE' | 'GOVERNANCE' | 'DOCUMENTATION';

/**
 * An option's scoring Level. Almost always a plain number or the literal
 * `'N/A'` (explicitly excluded from the roll-up rather than scored zero).
 * Ten options across the standard compute their Level at runtime from
 * another question's answer via a ternary expression string (see Document 1
 * §6.2) — the raw expression text is kept verbatim rather than parsed,
 * because the scoring roll-up itself is out of scope for this engine (it is
 * server-side and not exposed by any client API); nothing in this codebase
 * evaluates it.
 */
/**
 * `null` means the option carries no Level at all (informational option,
 * contributes nothing to the score — 196 of the 450 options in v2.4). This
 * is a deliberate extension beyond the literal `number | 'N/A' |
 * {expression}` union: the source genuinely distinguishes "no score" from
 * both a real `0` (non-conforming) and `'N/A'` (explicitly excluded from
 * the roll-up), so collapsing "no score" into either would misrepresent
 * real data.
 */
export type Level = number | 'N/A' | { expression: string } | null;

/**
 * An option's Characterisation tag set. Normalized from the source's
 * inconsistent free-text rendering (`["Practice","Governance"]` as two
 * array entries vs `["Practice, Governance"]` as one comma-joined entry vs
 * `["Governance","Practice"]`) into a proper enum Set.
 *
 * Five options compute their Characterisation at runtime the same way ten
 * options compute their Level at runtime (see `Level` above) — kept as a raw
 * expression string for the same reason. This is a deliberate, documented
 * extension beyond a plain `Set<Characterisation>`: collapsing an
 * expression-driven characterisation into a static Set would either silently
 * drop the runtime-conditional cases or fabricate a value never present in
 * the source.
 */
export type CharacterisationValue = Set<Characterisation> | { expression: string };

export interface AnswerOption {
  /** The persisted, byte-identical contract string every expression references. */
  value: string;
  label: LocalizedText;
  level: Level;
  characterisation: CharacterisationValue;
}

export interface DependencyRule {
  /** The question being watched (the "Depends on" column), by stable numeric id. */
  principalId: number;
  expression: BoolExpr;
  /**
   * `null` (in practice never observed in v2.4 — every row carries a small
   * integer) means this rule is ANDed with everything else for its
   * dependent question. A repeated number among a dependent question's own
   * rules means those specific rules are ORed together, and that OR result
   * is then ANDed with the rest. A number that appears only once behaves
   * exactly like `null` (there is nothing else to OR it with).
   */
  orGroupNo: number | null;
  /** Controls show/hide. Always `true` on every rule in v2.4. */
  isVisibleDependency: boolean;
  /**
   * Controls value propagation/linkage rather than visibility. Confirmed
   * empirically to be `false` on all 879 rows in v2.4 — kept for schema
   * fidelity, but nothing in this codebase should be built to depend on it
   * ever firing.
   */
  isLinkDependency: boolean;
}

export type ControlType =
  | 'SINGLE_SELECT'
  | 'IMAGE'
  | 'TEXT_MULTILINE'
  | 'NUMBER'
  | 'TEXT'
  | 'MULTI_SELECT'
  | 'SINGLE_SELECT_MODAL'
  | 'MULTI_SELECT_MODAL'
  | 'SIGNATURE'
  | 'SITE_DETAILS'
  | 'DATE_TIME';

export interface Notification {
  expression: BoolExpr;
  text: LocalizedText;
}

export interface Question {
  /** Stable numeric database id. All cross-references are keyed on this, never on `code`. */
  id: number;
  /** Business key as printed in the source (`Q_02_014`, `NQ 9`, `DS_FERT_WB_NODATA_FRQ_C`, ...). */
  code: string;
  text: LocalizedText;
  tooltip: LocalizedText | null;
  controlType: ControlType;
  sortOrder: number;
  isMandatory: boolean;
  /**
   * `true` only for `Q_00_001` ("Select the farm site") in v2.4 — the one
   * question flagged `activity-site scoped` in the source metadata line.
   * Not part of the type list given in the build brief, but dropping it
   * would silently lose real, load-bearing metadata present on every
   * question line; added for fidelity.
   */
  isActivitySite: boolean;
  args: string[];
  notification: Notification | null;
  dependsOn: DependencyRule[];
  options: AnswerOption[];
}

export interface Subsection {
  name: string;
  questionIds: number[];
}

export interface Section {
  /** The CheckItemGroup id from the source (`group id`), e.g. `2440`. */
  id: number;
  name: string;
  sortOrder: number;
  /** `null` for the 6 sections that are flat; otherwise 2-3 named children. */
  subsections: Subsection[] | null;
  /** All question ids in this section, in sort order (flattened across subsections, if any). */
  questionIds: number[];
}

export interface KnownIssue {
  questionId: number;
  field: string;
  description: string;
}

export interface Standard {
  version: string;
  sections: Section[];
  questions: Question[];
  /** Maps every `Question.code` (including the space-containing legacy ones) to its stable numeric id. */
  codeAliases: Record<string, number>;
  knownIssues: KnownIssue[];
}
