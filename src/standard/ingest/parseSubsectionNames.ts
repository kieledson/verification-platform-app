/**
 * One-time(-ish) extractor for the 15 sub-section names, read from the
 * companion workbook `Verification Platform Questionnaire_2025.xlsx`.
 *
 * WHY this file exists at all: the 12 section and 15 sub-section headings
 * inside the markdown questionnaire spec are corrupted at the source (they
 * render as the literal string `[object Object],[object Object]`). The
 * xlsx workbook has the real names, as plain bold(-ish) header rows in
 * column A of each per-section sheet, immediately preceding a run of
 * question rows.
 *
 * This is a small, deliberately ad hoc, self-contained ZIP + XML reader
 * (no `unzip`/`adm-zip`/`xlsx` dependency): an .xlsx file is just a ZIP of
 * XML parts, so `readZipEntry` implements just enough of the ZIP central
 * directory format (plus `zlib.inflateRawSync` for the usual deflated
 * entries) to pull out `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`,
 * `xl/styles.xml`, `xl/sharedStrings.xml` and the 6 relevant
 * `xl/worksheets/sheetN.xml` parts. It only ever runs once against this one
 * fixed workbook, so it intentionally does not try to be a general xlsx
 * reader.
 *
 * How a sub-section header row is identified: empirically, every
 * sub-section header cell (confirmed against all 6 sheets that have them —
 * Effluent, Habitat, Feed, Biosecurity and Disease, Chemical Use, Escapes)
 * uses the SAME cell fill as the sheet's own title row (fill id 2 in this
 * workbook's styles.xml) but a NON-bold font, whereas the title row itself,
 * the "Main question" sub-table header, and every question-text row all use
 * a bold font. That combination (shared header fill + not-bold) uniquely
 * picks out the 15 sub-section header cells with no hardcoded style-index
 * numbers, which would be fragile to any workbook re-save. The result is
 * cross-checked against the expected sub-section counts derived from
 * Document 1's own group index before being returned.
 */
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

// --- minimal ZIP reader -----------------------------------------------------

interface CentralDirEntry {
  localHeaderOffset: number;
  compressedSize: number;
}

function findEndOfCentralDirectory(buf: Buffer): number {
  const sig = 0x06054b50;
  // The EOCD record is at most 22 bytes + a (usually empty) comment; scan
  // backwards from the end.
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === sig) return i;
  }
  throw new Error('Not a valid zip file (no End Of Central Directory record found)');
}

function readCentralDirectory(buf: Buffer): Map<string, CentralDirEntry> {
  const eocd = findEndOfCentralDirectory(buf);
  const centralDirOffset = buf.readUInt32LE(eocd + 16);
  const entryCount = buf.readUInt16LE(eocd + 10);

  const entries = new Map<string, CentralDirEntry>();
  let p = centralDirOffset;
  const CENTRAL_SIG = 0x02014b50;
  for (let i = 0; i < entryCount; i++) {
    if (buf.readUInt32LE(p) !== CENTRAL_SIG) {
      throw new Error(`Malformed central directory entry at offset ${p}`);
    }
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localHeaderOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries.set(name, { localHeaderOffset, compressedSize });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readZipEntry(buf: Buffer, centralDir: Map<string, CentralDirEntry>, path: string): Buffer {
  const entry = centralDir.get(path);
  if (!entry) throw new Error(`Zip entry not found: ${path}`);
  const LOCAL_SIG = 0x04034b50;
  const p = entry.localHeaderOffset;
  if (buf.readUInt32LE(p) !== LOCAL_SIG) {
    throw new Error(`Malformed local file header for ${path} at offset ${p}`);
  }
  const method = buf.readUInt16LE(p + 8);
  const nameLen = buf.readUInt16LE(p + 26);
  const extraLen = buf.readUInt16LE(p + 28);
  const dataStart = p + 30 + nameLen + extraLen;
  // The local header's own size fields are unreliable when the "data
  // descriptor" general-purpose bit is set (as it is in this workbook, per
  // Google Sheets' zip writer) — always trust the central directory's size.
  const compressed = buf.subarray(dataStart, dataStart + entry.compressedSize);
  if (method === 0) return Buffer.from(compressed);
  if (method === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported zip compression method ${method} for ${path}`);
}

// --- minimal XML helpers ----------------------------------------------------

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&');
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml))) {
    const texts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXmlEntities(x[1]));
    strings.push(texts.join(''));
  }
  return strings;
}

interface XfInfo {
  fontId: number;
  fillId: number;
}

function parseXfs(xml: string): XfInfo[] {
  const cellXfsMatch = xml.match(/<cellXfs count="(\d+)"[^>]*>([\s\S]*?)<\/cellXfs>/);
  if (!cellXfsMatch) throw new Error('Could not find <cellXfs> in styles.xml');
  const xfRe = /<xf\b[^/>]*(?:\/>|>[\s\S]*?<\/xf>)/g;
  const xfs = cellXfsMatch[2].match(xfRe) ?? [];
  return xfs.map((x) => ({
    fontId: Number(x.match(/fontId="(\d+)"/)?.[1] ?? '0'),
    fillId: Number(x.match(/fillId="(\d+)"/)?.[1] ?? '0'),
  }));
}

function parseBoldFontIds(xml: string): Set<number> {
  const fontsMatch = xml.match(/<fonts[^>]*>([\s\S]*?)<\/fonts>/);
  if (!fontsMatch) throw new Error('Could not find <fonts> in styles.xml');
  const fontEntries = fontsMatch[1].match(/<font>[\s\S]*?<\/font>/g) ?? [];
  const bold = new Set<number>();
  fontEntries.forEach((f, i) => {
    if (/<b\s*\/>/.test(f)) bold.add(i);
  });
  return bold;
}

/** Column-A cells (`r="A<row>"`) from one worksheet XML, with resolved text values and style index. */
function parseColumnACells(sheetXml: string, sharedStrings: string[]): Array<{ row: number; style: number; text: string }> {
  const cellRe = /<c\s+r="A(\d+)"\s+s="(\d+)"(?:\s+t="(\w+)")?(?:\/>|>([\s\S]*?)<\/c>)/g;
  const cells: Array<{ row: number; style: number; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(sheetXml))) {
    const [, rowStr, styleStr, type, inner] = m;
    const vMatch = (inner ?? '').match(/<v>([\s\S]*?)<\/v>/);
    let text = vMatch ? vMatch[1] : '';
    if (type === 's' && text !== '') text = sharedStrings[Number(text)] ?? '';
    cells.push({ row: Number(rowStr), style: Number(styleStr), text: decodeXmlEntities(text) });
  }
  return cells;
}

/** 1-based questionnaire section number -> the sheet number that covers it, for sheets with sub-sections. */
const SUBSECTIONED_SHEETS: ReadonlyArray<{ sheet: number; sectionNo: number; expectedCount: number }> = [
  { sheet: 2, sectionNo: 3, expectedCount: 2 }, // Effluent
  { sheet: 3, sectionNo: 4, expectedCount: 2 }, // Habitat
  { sheet: 6, sectionNo: 6, expectedCount: 3 }, // Feed
  { sheet: 7, sectionNo: 7, expectedCount: 2 }, // Biosecurity and Disease
  { sheet: 8, sectionNo: 8, expectedCount: 3 }, // Chemical Use
  { sheet: 9, sectionNo: 9, expectedCount: 3 }, // Escapes
];

/**
 * The cell fill id shared by every sheet's title row AND every sub-section
 * header row in this specific workbook (confirmed by inspection: title rows
 * use this fill with a bold font, sub-section headers use the same fill
 * with a plain, non-bold font). Used together with the dynamically-derived
 * bold-font set below to identify sub-section headers without hardcoding
 * any particular style index.
 */
const HEADER_FILL_ID = 2;

export type SubsectionNamesBySection = Record<number, string[]>;

export function extractSubsectionNames(xlsxPath: string): SubsectionNamesBySection {
  const buf = readFileSync(xlsxPath);
  const centralDir = readCentralDirectory(buf);

  const stylesXml = readZipEntry(buf, centralDir, 'xl/styles.xml').toString('utf8');
  const sharedStringsXml = readZipEntry(buf, centralDir, 'xl/sharedStrings.xml').toString('utf8');
  const sharedStrings = parseSharedStrings(sharedStringsXml);
  const xfs = parseXfs(stylesXml);
  const boldFontIds = parseBoldFontIds(stylesXml);

  const isHeaderStyle = (styleIndex: number): boolean => {
    const xf = xfs[styleIndex];
    if (!xf) return false;
    return xf.fillId === HEADER_FILL_ID && !boldFontIds.has(xf.fontId);
  };

  const result: SubsectionNamesBySection = {};

  for (const { sheet, sectionNo, expectedCount } of SUBSECTIONED_SHEETS) {
    const sheetXml = readZipEntry(buf, centralDir, `xl/worksheets/sheet${sheet}.xml`).toString('utf8');
    const cells = parseColumnACells(sheetXml, sharedStrings);
    const headers = cells
      .filter((c) => isHeaderStyle(c.style) && c.text.trim().length > 0)
      .sort((a, b) => a.row - b.row)
      .map((c) => c.text.trim());

    if (headers.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} sub-section header(s) on sheet${sheet} (section ${sectionNo}) but found ` +
          `${headers.length}: ${JSON.stringify(headers)}`,
      );
    }
    result[sectionNo] = headers;
  }

  return result;
}
