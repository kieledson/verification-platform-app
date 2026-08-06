import { db, type ProjectRecord, type SiteGroupRecord } from '@/db/schema'

/**
 * Synthetic demo data only (see `seed.ts`'s comment on the same rule).
 * Projects/groups match Document 2 §8's Project → Group → Site hierarchy.
 * The first three groups (`group-ms-g01-2026`, `group-ms-g21-2025`,
 * `group-in-g04-2026`) reuse the exact ids `seed.ts`'s existing sites and
 * `demoAssessments.ts`'s existing assessments already reference, so those
 * records gain a real Project/Group parent instead of only a denormalized
 * name string. The rest extend coverage to two more countries so Project
 * Preparation and Reports have more than one project to browse.
 */
const PROJECTS: Array<Omit<ProjectRecord, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'project-minh-phu-delta',
    name: 'Minh Phu Delta Programme',
    description: 'Mekong Delta shrimp farmer groups working toward Seafood Watch Green/Yellow ratings.',
    parentProjectId: null,
    totalEstimatedAnnualProduction: 42000,
    totalEstimatedSites: 140,
  },
  {
    id: 'project-andhra-pradesh',
    name: 'Andhra Pradesh Shrimp Programme',
    description: 'Coastal Andhra Pradesh shrimp aquaculture improvement programme.',
    parentProjectId: null,
    totalEstimatedAnnualProduction: 28000,
    totalEstimatedSites: 95,
  },
  {
    id: 'project-java-coastal',
    name: 'Java Coastal Aquaculture Programme',
    description: 'North Java coastal pond clusters entering the verification pipeline.',
    parentProjectId: null,
    totalEstimatedAnnualProduction: 18500,
    totalEstimatedSites: 60,
  },
  {
    id: 'project-gulf-thailand',
    name: 'Gulf of Thailand Shrimp Programme',
    description: 'Eastern Gulf of Thailand farmer cooperatives, pilot phase.',
    parentProjectId: null,
    totalEstimatedAnnualProduction: 12000,
    totalEstimatedSites: 40,
  },
]

const SITE_GROUPS: Array<Omit<SiteGroupRecord, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'group-ms-g01-2026',
    projectId: 'project-minh-phu-delta',
    name: 'MS G01-2026',
    description: 'Minh Sáng cohort, 2026 assessment round.',
    personResponsible: 'Linh Pham',
    totalEstimatedAnnualProduction: 6200,
    groupGoal: 'Green',
    groupPhase: 'Live',
    sampleSizes: { Company: 8, Collaborator: 2, SGS: 2 },
  },
  {
    id: 'group-ms-g21-2025',
    projectId: 'project-minh-phu-delta',
    name: 'MS G21-2025',
    description: 'Bến Tre cohort, 2025 pilot round.',
    personResponsible: 'Linh Pham',
    totalEstimatedAnnualProduction: 4100,
    groupGoal: 'Green',
    groupPhase: 'Pilot - Round 1',
    sampleSizes: { Company: 6, Collaborator: 1, SGS: 1 },
  },
  {
    id: 'group-ms-g02-2026',
    projectId: 'project-minh-phu-delta',
    name: 'MS G02-2026',
    description: 'Second Minh Phu cohort added for the 2026 round.',
    personResponsible: 'Trần Văn Hải',
    totalEstimatedAnnualProduction: 5300,
    groupGoal: 'Green',
    groupPhase: 'Live',
    sampleSizes: { Company: 6, Collaborator: 2, SGS: 1 },
  },
  {
    id: 'group-in-g04-2026',
    projectId: 'project-andhra-pradesh',
    name: 'IN G04-2026',
    description: 'Krishna district cohort, 2026 assessment round.',
    personResponsible: 'Priya Raman',
    totalEstimatedAnnualProduction: 3800,
    groupGoal: 'Yellow',
    groupPhase: 'Live',
    sampleSizes: { Company: 5, Collaborator: 1, SGS: 2 },
  },
  {
    id: 'group-ap-g02-2025',
    projectId: 'project-andhra-pradesh',
    name: 'AP G02-2025',
    description: 'West Godavari cohort, not yet started.',
    personResponsible: 'Priya Raman',
    totalEstimatedAnnualProduction: 2600,
    groupGoal: 'Yellow',
    groupPhase: 'N/A',
    sampleSizes: { Company: 4, Collaborator: 1, SGS: 1 },
  },
  {
    id: 'group-jv-g01-2026',
    projectId: 'project-java-coastal',
    name: 'JV G01-2026',
    description: 'North Java pond cluster, first assessment round.',
    personResponsible: 'Sari Wulandari',
    totalEstimatedAnnualProduction: 3100,
    groupGoal: 'Green',
    groupPhase: 'Live',
    sampleSizes: { Company: 5, Collaborator: 2, SGS: 1 },
  },
  {
    id: 'group-th-g01-2026',
    projectId: 'project-gulf-thailand',
    name: 'TH G01-2026',
    description: 'Chanthaburi cooperative, pilot phase.',
    personResponsible: 'Somchai Boonmee',
    totalEstimatedAnnualProduction: 2200,
    groupGoal: 'Yellow',
    groupPhase: 'Pilot - Round 1',
    sampleSizes: { Company: 4, Collaborator: 2, SGS: 1 },
  },
]

let seedPromise: Promise<void> | null = null

export function seedProjectsAndGroupsIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.projects.count()
      if (count > 0) return
      const now = Date.now()
      await db.projects.bulkAdd(PROJECTS.map((p) => ({ ...p, createdAt: now, updatedAt: now })))
      await db.siteGroups.bulkAdd(SITE_GROUPS.map((g) => ({ ...g, createdAt: now, updatedAt: now })))
    })()
  }
  return seedPromise
}
