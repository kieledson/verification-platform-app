/**
 * Line-based state-machine parser for
 * `SFW-IVP-01-Questionnaire-Specification-v2.4.md` (Document 1) — the ONLY
 * authoritative source for all 298 questions, 450 answer options, 879
 * dependency rules and 43 alerts.
 *
 * Deliberately NOT a general markdown parser: the source's structure is
 * narrow and completely regular (confirmed by reading the file in full), so
 * a small hand-written scanner over an array of lines is both simpler and
 * easier to audit against the source than pulling in a markdown AST
 * library.
 *
 * The 12 top-level section headings and 15 sub-section headings are
 * corrupted at the source (they render as the literal string
 * `[object Object],[object Object]` — a localized-text-array-to-string bug
 * upstream of this document). Names are NOT read from those headings; the
 * 12 section names + question counts are hardcoded from Document 1 §10
 * (its own group-id/count index, which is reliable), and the 15
 * sub-section names come from `parseSubsectionNames.ts` (read from the
 * companion xlsx workbook), passed in by the caller.
 */
import type {
  AnswerOption,
  ControlType,
  LocalizedText,
  Notification,
  Question,
  Section,
} from '../schema/types';
import type { BoolExpr } from '../../dependency-engine/expression/ast';
import { parseExpression } from '../../dependency-engine/expression/parse';
import { normalizeCharacterisation, normalizeLevel, normalizeQuotes } from './normalize';

/**
 * The 12 top-level sections in true `SortOrder` (Document 1 §10 — its own
 * group-id/count index table, confirmed reliable). This order is
 * authoritative and must NOT be reordered to match the group-id column or
 * any other document.
 */
export const SECTION_DEFS: ReadonlyArray<{ name: string; questionCount: number }> = [
  { name: 'Assessment information', questionCount: 5 },
  { name: 'Farm profile', questionCount: 39 },
  { name: 'Effluent', questionCount: 52 },
  { name: 'Habitat', questionCount: 30 },
  { name: 'Source of stock', questionCount: 15 },
  { name: 'Feed', questionCount: 19 },
  { name: 'Biosecurity and disease', questionCount: 37 },
  { name: 'Chemical use', questionCount: 33 },
  { name: 'Escapes', questionCount: 43 },
  { name: 'Wildlife mortalities', questionCount: 14 },
  { name: 'Harvest traceability', questionCount: 7 },
  { name: 'Assessment finalization', questionCount: 4 },
];

/** 1-based section number -> ordered sub-section names, for the 6 sections that have them. */
export type SubsectionNamesBySection = Record<number, string[]>;

export interface ParsedQuestionnaire {
  sections: Section[];
  questions: Question[];
}

const CONTROL_TYPES: ReadonlySet<string> = new Set<ControlType>([
  'SINGLE_SELECT',
  'IMAGE',
  'TEXT_MULTILINE',
  'NUMBER',
  'TEXT',
  'MULTI_SELECT',
  'SINGLE_SELECT_MODAL',
  'MULTI_SELECT_MODAL',
  'SIGNATURE',
  'SITE_DETAILS',
  'DATE_TIME',
]);

// --- line-matching regexes -------------------------------------------------

const SECTION_HEADING_RE = /^## Section (\d+) — /;
const SUBSECTION_HEADING_RE = /^### (\d+)\.(\d+) .*\((\d+) questions\)$/;
const FLAT_QUESTIONS_HEADING_RE = /^### Questions \((\d+)\)$/;
const GROUP_META_RE = /^\*group id `(\d+)`(?: · parent `(\d+)`)? · sort order (\d+)\*$/;
const QUESTION_HEADING_RE = /^#### (.+?) — (.+)$/;
const METADATA_LINE_RE = /^\*id `(\d+)` · (.+)\*$/;
const GUIDANCE_LINE_RE = /^> \*\*Guidance\/tooltip:\*\* (.*)$/;
const OPTIONS_HEADER_RE = /^\| Option value \| English label \| Level \| Characterisation \|$/;
const TABLE_SEPARATOR_RE = /^\|(?:-+\|)+$/;
const OPTION_ROW_RE = /^\| `([^`]*)` \| (.*) \| (.*) \| (.*) \|$/;
const RULES_HEADING_RE = /^\*\*Visibility \/ link rules \((\d+)\):\*\*$/;
const RULES_HEADER_RE = /^\| Depends on \| Expression \| Or-group \| Visibility \| Link \|$/;
const RULE_ROW_RE = /^\| `(.+?)` \| `(.+?)` \| (\d+|null) \| (yes|no) \| (yes|no) \|$/;
const ALERT_HEADING_RE = /^\*\*Notification \(Alert\):\*\* triggers when `(.+)`$/;
const BLOCKQUOTE_RE = /^> (.*)$/;

function toLocalizedText(text: string): LocalizedText {
  return [{ LocaleCode: 'en', AutoText: text, ManualText: null, Text: text }];
}

function isBlank(line: string | undefined): boolean {
  return line === undefined || line.trim().length === 0;
}

class LineCursor {
  constructor(
    private readonly lines: string[],
    public i: number = 0,
  ) {}

  peek(): string | undefined {
    return this.lines[this.i];
  }

  skipBlank(): void {
    while (this.i < this.lines.length && isBlank(this.lines[this.i])) this.i++;
  }

  next(): string {
    if (this.i >= this.lines.length) {
      throw new Error('Unexpected end of file while parsing questionnaire markdown');
    }
    return this.lines[this.i++];
  }

  errorAt(message: string): Error {
    return new Error(`${message} (near line ${this.i + 1}: ${JSON.stringify(this.lines[this.i])})`);
  }
}

interface QuestionMetadata {
  id: number;
  controlType: ControlType;
  sortOrder: number;
  isMandatory: boolean;
  isActivitySite: boolean;
  args: string[];
}

function parseMetadataLine(line: string): QuestionMetadata {
  const m = METADATA_LINE_RE.exec(line);
  if (!m) throw new Error(`Malformed question metadata line: ${JSON.stringify(line)}`);
  const id = Number(m[1]);
  const segments = m[2].split(' · ');

  let controlType: ControlType | undefined;
  let sortOrder: number | undefined;
  let isMandatory: boolean | undefined;
  let isActivitySite = false;
  const args: string[] = [];

  for (const seg of segments) {
    let sm: RegExpExecArray | null;
    if ((sm = /^control `([^`]*)`$/.exec(seg))) {
      if (!CONTROL_TYPES.has(sm[1])) {
        throw new Error(`Unknown control type ${JSON.stringify(sm[1])} in metadata line: ${JSON.stringify(line)}`);
      }
      controlType = sm[1] as ControlType;
    } else if ((sm = /^sort (\d+)$/.exec(seg))) {
      sortOrder = Number(sm[1]);
    } else if (seg === 'mandatory') {
      isMandatory = true;
    } else if (seg === 'optional') {
      isMandatory = false;
    } else if (seg === 'activity-site scoped') {
      isActivitySite = true;
    } else if ((sm = /^characterisation `([^`]*)`$/.exec(seg))) {
      // Item-level Characterisation: empty on all but 2 of 298 questions and,
      // per Document 1 §7.3, "really an option-level concept" — intentionally
      // not stored on Question (see standard/schema/types.ts).
    } else if ((sm = /^args `([^`]*)`$/.exec(seg))) {
      if (sm[1].length > 0) args.push(...sm[1].split(','));
    } else {
      throw new Error(`Unrecognized metadata segment ${JSON.stringify(seg)} in line: ${JSON.stringify(line)}`);
    }
  }

  if (controlType === undefined || sortOrder === undefined || isMandatory === undefined) {
    throw new Error(`Incomplete question metadata line: ${JSON.stringify(line)}`);
  }

  return { id, controlType, sortOrder, isMandatory, isActivitySite, args };
}

function parseOptionsTable(cursor: LineCursor): AnswerOption[] {
  cursor.next(); // header
  const separator = cursor.next();
  if (!TABLE_SEPARATOR_RE.test(separator)) {
    throw cursor.errorAt(`Expected a markdown table separator row, got: ${JSON.stringify(separator)}`);
  }
  const options: AnswerOption[] = [];
  while (!isBlank(cursor.peek())) {
    const line = cursor.next();
    const m = OPTION_ROW_RE.exec(line);
    if (!m) throw cursor.errorAt(`Malformed answer-option row: ${JSON.stringify(line)}`);
    const [, value, label, levelRaw, characterisationRaw] = m;
    options.push({
      value,
      label: toLocalizedText(normalizeQuotes(label).trim()),
      level: normalizeLevel(levelRaw),
      characterisation: normalizeCharacterisation(characterisationRaw) ?? new Set(),
    });
  }
  return options;
}

interface RawDependencyRule {
  principalCode: string;
  expression: BoolExpr;
  orGroupNo: number | null;
  isVisibleDependency: boolean;
  isLinkDependency: boolean;
}

function parseRulesTable(cursor: LineCursor, expectedCount: number): RawDependencyRule[] {
  cursor.next(); // header
  const separator = cursor.next();
  if (!TABLE_SEPARATOR_RE.test(separator)) {
    throw cursor.errorAt(`Expected a markdown table separator row, got: ${JSON.stringify(separator)}`);
  }
  const rules: RawDependencyRule[] = [];
  while (!isBlank(cursor.peek())) {
    const line = cursor.next();
    const m = RULE_ROW_RE.exec(line);
    if (!m) throw cursor.errorAt(`Malformed dependency-rule row: ${JSON.stringify(line)}`);
    const [, principalCode, exprEscaped, orGroupRaw, visibilityRaw, linkRaw] = m;
    const exprRaw = normalizeQuotes(exprEscaped.replace(/\\\|/g, '|'));
    rules.push({
      principalCode,
      expression: parseExpression(exprRaw),
      orGroupNo: orGroupRaw === 'null' ? null : Number(orGroupRaw),
      isVisibleDependency: visibilityRaw === 'yes',
      isLinkDependency: linkRaw === 'yes',
    });
  }
  if (rules.length !== expectedCount) {
    throw cursor.errorAt(
      `Expected ${expectedCount} dependency rule row(s) but parsed ${rules.length}`,
    );
  }
  return rules;
}

/** A `Question` shape with dependency rules still keyed by principal *code*, not id. */
type RawQuestion = Omit<Question, 'dependsOn'> & { dependsOn: RawDependencyRule[] };

function parseQuestionBlock(cursor: LineCursor): RawQuestion {
  const headingLine = cursor.next();
  const hm = QUESTION_HEADING_RE.exec(headingLine);
  if (!hm) throw cursor.errorAt(`Expected a question heading, got: ${JSON.stringify(headingLine)}`);
  const [, code, text] = hm;

  cursor.skipBlank();
  const meta = parseMetadataLine(cursor.next());

  let tooltip: LocalizedText | null = null;
  cursor.skipBlank();
  const gm = GUIDANCE_LINE_RE.exec(cursor.peek() ?? '');
  if (gm) {
    cursor.next();
    tooltip = toLocalizedText(normalizeQuotes(gm[1]).trim());
  }

  let options: AnswerOption[] = [];
  cursor.skipBlank();
  if (OPTIONS_HEADER_RE.test(cursor.peek() ?? '')) {
    options = parseOptionsTable(cursor);
  }

  let dependsOn: RawDependencyRule[] = [];
  cursor.skipBlank();
  const rm = RULES_HEADING_RE.exec(cursor.peek() ?? '');
  if (rm) {
    cursor.next();
    const expectedCount = Number(rm[1]);
    cursor.skipBlank();
    if (!RULES_HEADER_RE.test(cursor.peek() ?? '')) {
      throw cursor.errorAt('Expected dependency-rule table header after "Visibility / link rules" heading');
    }
    dependsOn = parseRulesTable(cursor, expectedCount);
  }

  let notification: Notification | null = null;
  cursor.skipBlank();
  const am = ALERT_HEADING_RE.exec(cursor.peek() ?? '');
  if (am) {
    cursor.next();
    const triggerExpr = parseExpression(normalizeQuotes(am[1]));
    cursor.skipBlank();
    const bq = BLOCKQUOTE_RE.exec(cursor.next());
    if (!bq) throw cursor.errorAt('Expected alert text blockquote after Notification (Alert) heading');
    notification = { expression: triggerExpr, text: toLocalizedText(normalizeQuotes(bq[1]).trim()) };
  }

  return {
    id: meta.id,
    code,
    text: toLocalizedText(normalizeQuotes(text).trim()),
    tooltip,
    controlType: meta.controlType,
    sortOrder: meta.sortOrder,
    isMandatory: meta.isMandatory,
    isActivitySite: meta.isActivitySite,
    args: meta.args,
    notification,
    dependsOn,
    options,
  };
}

/**
 * Parses the full questionnaire markdown into sections + questions.
 * Dependency rule `principalId`s are resolved from `principalCode` in a
 * second pass by the caller (`buildStandard.ts`), once every question's
 * code -> id mapping is known (rules may reference a question declared
 * later in the file, though none observed in v2.4 do).
 */
export function parseQuestionnaireMd(
  markdown: string,
  subsectionNamesBySection: SubsectionNamesBySection,
): { sections: Section[]; rawQuestions: RawQuestion[] } {
  const lines = markdown.split(/\r?\n/);
  const cursor = new LineCursor(lines);

  const sections: Section[] = [];
  const rawQuestions: RawQuestion[] = [];

  let currentSection: Section | null = null;
  let currentSectionNo = 0;
  let currentSubsectionQuestionIds: number[] | null = null;

  while (cursor.i < lines.length) {
    const line = cursor.peek();
    if (line === undefined) break;

    const sm = SECTION_HEADING_RE.exec(line);
    if (sm) {
      cursor.next();
      const sectionNo = Number(sm[1]);
      const def = SECTION_DEFS[sectionNo - 1];
      if (!def) throw cursor.errorAt(`Unexpected section number ${sectionNo}`);
      cursor.skipBlank();
      const gm = GROUP_META_RE.exec(cursor.next());
      if (!gm) throw cursor.errorAt('Expected section group-id metadata line');
      currentSection = {
        id: Number(gm[1]),
        name: def.name,
        sortOrder: Number(gm[3]),
        subsections: subsectionNamesBySection[sectionNo] ? [] : null,
        questionIds: [],
      };
      currentSectionNo = sectionNo;
      sections.push(currentSection);
      currentSubsectionQuestionIds = null;
      continue;
    }

    const subm = SUBSECTION_HEADING_RE.exec(line);
    if (subm) {
      cursor.next();
      if (!currentSection || !currentSection.subsections) {
        throw cursor.errorAt('Sub-section heading encountered outside of a section that expects sub-sections');
      }
      const [, , subNoStr] = subm;
      const subNo = Number(subNoStr);
      const names = subsectionNamesBySection[currentSectionNo];
      const name = names?.[subNo - 1];
      if (!name) throw cursor.errorAt(`No sub-section name available for sub-section ${subNoStr}`);
      cursor.skipBlank();
      const gm = GROUP_META_RE.exec(cursor.next());
      if (!gm) throw cursor.errorAt('Expected sub-section group-id metadata line');
      const questionIds: number[] = [];
      currentSection.subsections.push({ name, questionIds });
      currentSubsectionQuestionIds = questionIds;
      continue;
    }

    if (FLAT_QUESTIONS_HEADING_RE.test(line)) {
      cursor.next();
      continue;
    }

    if (QUESTION_HEADING_RE.test(line)) {
      const q = parseQuestionBlock(cursor);
      rawQuestions.push(q);
      if (!currentSection) throw cursor.errorAt('Question encountered before any section heading');
      currentSection.questionIds.push(q.id);
      if (currentSubsectionQuestionIds) currentSubsectionQuestionIds.push(q.id);
      continue;
    }

    // Blank lines, `---` separators, and anything else between blocks.
    cursor.next();
  }

  return { sections, rawQuestions };
}

export type { RawQuestion };
