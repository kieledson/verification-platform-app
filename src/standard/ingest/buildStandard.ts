/**
 * One-time ingestion entrypoint: parses the authoritative questionnaire
 * markdown spec + the companion xlsx workbook, normalizes and validates the
 * result, and writes the generated `standard/data/standard.v2_4.json`.
 *
 * Run via `npx tsx src/standard/ingest/buildStandard.ts` from the project
 * root (see the `standard:build` package.json script).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCodeAliases } from '../schema/aliases';
import type { Characterisation, DependencyRule, KnownIssue, Question, Section, Standard } from '../schema/types';
import { parseQuestionnaireMd, type RawQuestion } from './parseQuestionnaireMd';
import { extractSubsectionNames } from './parseSubsectionNames';
import { KNOWN_ISSUES } from './normalize';
import { validateExpressions } from './validateExpressions';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const SOURCE_SPECS_DIR =
  process.env.SOURCE_SPECS_DIR ??
  join(SCRIPT_DIR, '../../../../design_handoff_verification_platform/source_specs');

const MARKDOWN_PATH = join(SOURCE_SPECS_DIR, 'SFW-IVP-01-Questionnaire-Specification-v2.4.md');
const XLSX_PATH = join(SOURCE_SPECS_DIR, 'Verification Platform Questionnaire_2025.xlsx');
const OUTPUT_PATH = join(SCRIPT_DIR, '../data/standard.v2_4.json');

function resolveDependsOn(raw: RawQuestion['dependsOn'], codeAliases: Record<string, number>, questionCode: string): DependencyRule[] {
  return raw.map((r) => {
    const principalId = codeAliases[r.principalCode];
    if (principalId === undefined) {
      throw new Error(
        `Question ${questionCode} has a dependency rule on unknown code ${JSON.stringify(r.principalCode)}`,
      );
    }
    return {
      principalId,
      expression: r.expression,
      orGroupNo: r.orGroupNo,
      isVisibleDependency: r.isVisibleDependency,
      isLinkDependency: r.isLinkDependency,
    };
  });
}

/** JSON.stringify replacer: serializes `Set<Characterisation>` as a sorted array of tags. */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Set) {
    return [...(value as Set<Characterisation>)].sort();
  }
  return value;
}

function main(): void {
  const markdown = readFileSync(MARKDOWN_PATH, 'utf8');
  const subsectionNames = extractSubsectionNames(XLSX_PATH);
  const { sections: parsedSections, rawQuestions } = parseQuestionnaireMd(markdown, subsectionNames);

  const codeAliases = buildCodeAliases(rawQuestions);

  const questions: Question[] = rawQuestions.map((rq) => ({
    id: rq.id,
    code: rq.code,
    text: rq.text,
    tooltip: rq.tooltip,
    controlType: rq.controlType,
    sortOrder: rq.sortOrder,
    isMandatory: rq.isMandatory,
    isActivitySite: rq.isActivitySite,
    args: rq.args,
    notification: rq.notification,
    dependsOn: resolveDependsOn(rq.dependsOn, codeAliases, rq.code),
    options: rq.options,
  }));

  const sections: Section[] = parsedSections;

  const knownIssues: KnownIssue[] = KNOWN_ISSUES.map(({ code, field, description }) => {
    const questionId = codeAliases[code];
    if (questionId === undefined) {
      throw new Error(`KNOWN_ISSUES references unknown question code ${JSON.stringify(code)}`);
    }
    return { questionId, field, description };
  });

  const standard: Standard = {
    version: '2.4',
    sections,
    questions,
    codeAliases,
    knownIssues,
  };

  const { confirmedKnownIssueCodes } = validateExpressions(standard);

  // --- summary counts + sanity checks against Document 1's headline numbers ---
  const optionCount = questions.reduce((sum, q) => sum + q.options.length, 0);
  const ruleCount = questions.reduce((sum, q) => sum + q.dependsOn.length, 0);
  const alertCount = questions.filter((q) => q.notification !== null).length;

  const expected = { questions: 298, options: 450, rules: 879, alerts: 43 };
  const actual = { questions: questions.length, options: optionCount, rules: ruleCount, alerts: alertCount };
  const mismatches = (Object.keys(expected) as Array<keyof typeof expected>).filter(
    (k) => expected[k] !== actual[k],
  );
  if (mismatches.length > 0) {
    throw new Error(
      `Parsed counts do not match Document 1's headline numbers: ` +
        mismatches.map((k) => `${k} expected ${expected[k]} got ${actual[k]}`).join('; '),
    );
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(standard, jsonReplacer, 2), 'utf8');

  console.log('Standard build complete.');
  console.log(`  questions:     ${actual.questions}`);
  console.log(`  options:       ${actual.options}`);
  console.log(`  rules:         ${actual.rules}`);
  console.log(`  alerts:        ${actual.alerts}`);
  console.log(`  knownIssues:   ${knownIssues.length} (confirmed: ${[...confirmedKnownIssueCodes].join(', ')})`);
  console.log(`  sections:      ${sections.length}`);
  console.log(`  output:        ${OUTPUT_PATH}`);
}

main();
