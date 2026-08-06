import type { AssessmentRecord, ExportTemplateRecord, SiteRecord } from '@/db/schema'

/** Projects a template's chosen fields against real local data instead of
 * fabricating preview rows — genuinely useful for `ActivityExt`/`SiteExt`
 * templates since both map cleanly onto what's already in Dexie.
 * `ActivityCheckExt` (per-question detail) isn't modeled here — it needs a
 * specific assessment's answers, not a template-level preview — so callers
 * should show an honest empty state for that entity instead of calling this. */
export function buildActivityPreviewRows(
  template: ExportTemplateRecord,
  assessments: AssessmentRecord[],
  sitesById: Map<string, SiteRecord>,
  limit = 8,
): Record<string, string>[] {
  return assessments.slice(0, limit).map((a) => {
    const site = sitesById.get(a.farmSiteId)
    const row: Record<string, string> = {}
    for (const field of template.fields) {
      row[field.header || field.fieldKey] = activityFieldValue(field.fieldKey, a, site)
    }
    return row
  })
}

function activityFieldValue(fieldKey: string, a: AssessmentRecord, site: SiteRecord | undefined): string {
  switch (fieldKey) {
    case 'SiteName':
      return site?.farmName ?? '—'
    case 'GroupName':
      return site?.groupName ?? '—'
    case 'ProjectName':
      return site?.projectName ?? '—'
    case 'AssessorType':
      return a.assessorType
    case 'AssessmentDate':
      return new Date(a.updatedAt).toLocaleDateString()
    case 'Outcome':
      return a.outcome ?? '—'
    case 'StandardVersion':
      return a.standardVersion
    default:
      return '—'
  }
}

export function buildSitePreviewRows(
  template: ExportTemplateRecord,
  sites: SiteRecord[],
  limit = 8,
): Record<string, string>[] {
  return sites.slice(0, limit).map((site) => {
    const row: Record<string, string> = {}
    for (const field of template.fields) {
      row[field.header || field.fieldKey] = siteFieldValue(field.fieldKey, site)
    }
    return row
  })
}

function siteFieldValue(fieldKey: string, site: SiteRecord): string {
  switch (fieldKey) {
    case 'SiteReferenceCode':
      return site.referenceCode
    case 'SiteName':
      return site.farmName
    case 'Country':
      return site.country
    case 'Region':
      return site.region
    case 'Latitude':
      return site.gps ? String(site.gps.lat) : '—'
    case 'Longitude':
      return site.gps ? String(site.gps.lng) : '—'
    default:
      return '—'
  }
}
