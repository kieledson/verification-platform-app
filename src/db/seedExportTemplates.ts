import { db, type ExportTemplateRecord } from '@/db/schema'

/**
 * Synthetic demo data only (see `seed.ts`). Document 4 §8.1 found the real
 * system's 25 templates roughly half test scaffolding ("Tyler Test",
 * "Kelvin test - ...") with no owner/archive concept to separate them from
 * the genuinely operational ones — and recommended exactly that fix
 * (§8.1's closing line). This seed only includes the operational shape,
 * each with a real owner and `archived: false`, rather than reproducing
 * the test-scaffolding clutter.
 */
const TEMPLATES: Array<Omit<ExportTemplateRecord, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'tpl-assessment-summary',
    name: 'Project Assessment Summary',
    format: 'xlsx',
    headerRow: true,
    entity: 'ActivityExt',
    owner: 'Programme Team',
    archived: false,
    fields: [
      { order: 1, fieldKey: 'ProjectName', format: 'B', header: 'Project' },
      { order: 2, fieldKey: 'GroupName', format: 'B', header: 'Group' },
      { order: 3, fieldKey: 'SiteName', format: 'B', header: 'Site' },
      { order: 4, fieldKey: 'AssessorType', format: 'B', header: 'Assessor Type' },
      { order: 5, fieldKey: 'AssessmentDate', format: 'D', header: 'Assessment Date' },
      { order: 6, fieldKey: 'Outcome', format: 'B', header: 'Outcome' },
    ],
    filters: [
      { andOr: 'AND', criteria: 'ProjectId', operator: 'Is equal to', value: '', mandatory: true, editable: true },
      { andOr: 'AND', criteria: 'AssessmentDate', operator: 'Is not null', value: '', mandatory: false, editable: true },
    ],
  },
  {
    id: 'tpl-assessment-details',
    name: 'Project Assessment Details',
    format: 'csv',
    headerRow: true,
    entity: 'ActivityCheckExt',
    owner: 'Programme Team',
    archived: false,
    fields: [
      { order: 1, fieldKey: 'QuestionCode', format: 'B', header: 'Question Code' },
      { order: 2, fieldKey: 'QuestionText', format: 'B', header: 'Question' },
      { order: 3, fieldKey: 'AnswerValue', format: 'B', header: 'Answer' },
      { order: 4, fieldKey: 'Level', format: 'N', header: 'Level' },
      { order: 5, fieldKey: 'Characterisation', format: 'B', header: 'Characterisation' },
    ],
    filters: [
      { andOr: 'AND', criteria: 'ActivityId', operator: 'Is equal to', value: '', mandatory: true, editable: true },
    ],
  },
  {
    id: 'tpl-minh-phu-summary',
    name: 'Minh Phu Assessment Summary',
    format: 'xlsx',
    headerRow: true,
    entity: 'ActivityExt',
    owner: 'Linh Pham',
    archived: false,
    fields: [
      { order: 1, fieldKey: 'SiteName', format: 'B', header: 'Site' },
      { order: 2, fieldKey: 'GroupName', format: 'B', header: 'Group' },
      { order: 3, fieldKey: 'AssessorType', format: 'B', header: 'Assessor Type' },
      { order: 4, fieldKey: 'Outcome', format: 'B', header: 'Outcome' },
      { order: 5, fieldKey: 'StandardVersion', format: 'B', header: 'Standard Version' },
    ],
    filters: [
      { andOr: 'AND', criteria: 'ProjectId', operator: 'Is equal to', value: 'project-minh-phu-delta', mandatory: true, editable: false },
    ],
  },
  {
    id: 'tpl-minh-phu-sites',
    name: 'Minh Phu Assessment Sites',
    format: 'csv',
    headerRow: true,
    entity: 'SiteExt',
    owner: 'Linh Pham',
    archived: false,
    fields: [
      { order: 1, fieldKey: 'SiteReferenceCode', format: 'B', header: 'Site ID' },
      { order: 2, fieldKey: 'SiteName', format: 'B', header: 'Site Name' },
      { order: 3, fieldKey: 'Country', format: 'B', header: 'Country' },
      { order: 4, fieldKey: 'Region', format: 'B', header: 'Region' },
      { order: 5, fieldKey: 'Latitude', format: 'N', header: 'Latitude' },
      { order: 6, fieldKey: 'Longitude', format: 'N', header: 'Longitude' },
    ],
    filters: [
      { andOr: 'AND', criteria: 'ProjectId', operator: 'Is equal to', value: 'project-minh-phu-delta', mandatory: true, editable: false },
    ],
  },
  {
    id: 'tpl-india-shrimp-pam',
    name: 'India Shrimp PAM Assessment Summary',
    format: 'xlsx',
    headerRow: true,
    entity: 'ActivityExt',
    owner: 'Divya Nair',
    archived: false,
    fields: [
      { order: 1, fieldKey: 'SiteName', format: 'B', header: 'Site' },
      { order: 2, fieldKey: 'GroupName', format: 'B', header: 'Group' },
      { order: 3, fieldKey: 'AssessorType', format: 'B', header: 'Assessor Type' },
      { order: 4, fieldKey: 'Outcome', format: 'B', header: 'Outcome' },
    ],
    filters: [
      { andOr: 'AND', criteria: 'ProjectId', operator: 'Is equal to', value: 'project-andhra-pradesh', mandatory: true, editable: false },
    ],
  },
  {
    id: 'tpl-cases-sites',
    name: 'CASES Assessment Sites',
    format: 'txt',
    headerRow: false,
    entity: 'SiteExt',
    owner: 'Programme Team',
    archived: false,
    fields: [
      { order: 1, fieldKey: 'SiteReferenceCode', format: 'B', header: 'Site ID' },
      { order: 2, fieldKey: 'SiteName', format: 'B', header: 'Site Name' },
      { order: 3, fieldKey: 'Country', format: 'B', header: 'Country' },
    ],
    filters: [],
  },
]

let seedPromise: Promise<void> | null = null

export function seedExportTemplatesIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.exportTemplates.count()
      if (count > 0) return
      const now = Date.now()
      await db.exportTemplates.bulkAdd(TEMPLATES.map((t) => ({ ...t, createdAt: now, updatedAt: now })))
    })()
  }
  return seedPromise
}
