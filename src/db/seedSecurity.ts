import { db, type RoleRecord, type RolePermissionRecord, type UserRecord, type InvitationRecord } from '@/db/schema'
import { PERMISSION_MATRIX } from '@/security/permissionMatrix'

/** Synthetic demo data only (see `seed.ts`). Roles match Document 2 §7.1's
 * three roles; permissions are seeded verbatim from the transcribed matrix. */
const ROLES: RoleRecord[] = [
  { id: 'role-admin', name: 'Admin', description: 'Full access to every area of the platform.' },
  { id: 'role-assessor', name: 'Assessor', description: 'Runs field assessments; scoped to assigned projects/groups/sites.' },
  { id: 'role-manager', name: 'Manager', description: 'Oversees a country’s projects, groups and reporting.' },
]

const DAY = 24 * 60 * 60 * 1000

const USERS: Array<Omit<UserRecord, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'user-linh-pham',
    email: 'linh.pham@mba-seafoodwatch.org',
    displayName: 'Linh Pham',
    roleIds: ['role-assessor', 'role-manager'],
    assessorType: 'Company',
    organisationName: 'Minh Phu Delta Programme',
    organisationType: 'Industry',
    country: 'Vietnam',
    status: 'Active',
  },
  {
    id: 'user-tran-van-hai',
    email: 'tran.van.hai@independent-assessors.org',
    displayName: 'Trần Văn Hải',
    roleIds: ['role-assessor'],
    assessorType: 'Collaborator',
    organisationName: 'Mekong Delta Farmer Cooperative',
    organisationType: 'NGO',
    country: 'Vietnam',
    status: 'Active',
  },
  {
    id: 'user-priya-raman',
    email: 'priya.raman@sgs.com',
    displayName: 'Priya Raman',
    roleIds: ['role-assessor'],
    assessorType: 'SGS',
    organisationName: 'SGS',
    organisationType: 'Industry',
    country: 'India',
    status: 'Active',
  },
  {
    id: 'user-divya-nair',
    email: 'divya.nair@andhra-shrimp.org',
    displayName: 'Divya Nair',
    roleIds: ['role-manager'],
    assessorType: 'Company',
    organisationName: 'Andhra Pradesh Shrimp Programme',
    organisationType: 'Industry',
    country: 'India',
    status: 'Active',
  },
  {
    id: 'user-ravi-kumar',
    email: 'ravi.kumar@independent-assessors.org',
    displayName: 'Ravi Kumar',
    roleIds: ['role-assessor'],
    assessorType: 'Collaborator',
    organisationName: 'Coastal Aquaculture Collective',
    organisationType: 'NGO',
    country: 'India',
    status: 'Deactivated',
  },
  {
    id: 'user-sari-wulandari',
    email: 'sari.wulandari@java-coastal.org',
    displayName: 'Sari Wulandari',
    roleIds: ['role-manager'],
    assessorType: 'Company',
    organisationName: 'Java Coastal Aquaculture Programme',
    organisationType: 'Industry',
    country: 'Indonesia',
    status: 'Active',
  },
  {
    id: 'user-somchai-boonmee',
    email: 'somchai.boonmee@gulf-thailand.org',
    displayName: 'Somchai Boonmee',
    roleIds: ['role-manager'],
    assessorType: 'Company',
    organisationName: 'Gulf of Thailand Shrimp Programme',
    organisationType: 'Industry',
    country: 'Thailand',
    status: 'Active',
  },
  {
    id: 'user-alex-tanaka',
    email: 'alex.tanaka@seafoodwatch.org',
    displayName: 'Alex Tanaka',
    roleIds: ['role-admin'],
    assessorType: 'None',
    organisationName: 'Monterey Bay Aquarium',
    organisationType: 'NGO',
    country: 'United States',
    status: 'Active',
  },
  {
    id: 'user-sam-whitfield',
    email: 'sam.whitfield@seafoodwatch.org',
    displayName: 'Sam Whitfield',
    roleIds: ['role-admin'],
    assessorType: 'None',
    organisationName: 'Monterey Bay Aquarium',
    organisationType: 'NGO',
    country: 'United States',
    status: 'Active',
  },
]

const INVITATIONS: Array<Omit<InvitationRecord, 'date'> & { daysAgo: number }> = [
  { id: 'inv-1', displayName: 'Nguyễn Thị Mai', email: 'nguyen.thi.mai@example.com', status: 'Expired', invitedBy: 'Linh Pham', daysAgo: 42 },
  { id: 'inv-2', displayName: 'Arjun Patel', email: 'arjun.patel@example.com', status: 'Expired', invitedBy: 'Sam Whitfield', daysAgo: 35 },
  { id: 'inv-3', displayName: 'Rekha Devi', email: 'rekha.devi@example.com', status: 'Expired', invitedBy: 'Divya Nair', daysAgo: 51 },
  { id: 'inv-4', displayName: 'Made Wirawan', email: 'made.wirawan@example.com', status: 'Pending', invitedBy: 'Sari Wulandari', daysAgo: 3 },
  { id: 'inv-5', displayName: 'Kannika Suksri', email: 'kannika.suksri@example.com', status: 'Pending', invitedBy: 'Somchai Boonmee', daysAgo: 1 },
]

let seedPromise: Promise<void> | null = null

export function seedSecurityIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.roles.count()
      if (count > 0) return

      const now = Date.now()
      await db.roles.bulkAdd(ROLES)

      const permissionRows: RolePermissionRecord[] = []
      for (const perm of PERMISSION_MATRIX) {
        permissionRows.push(
          { roleId: 'role-admin', claimCode: perm.claimCode, scope: perm.admin },
          { roleId: 'role-assessor', claimCode: perm.claimCode, scope: perm.assessor },
          { roleId: 'role-manager', claimCode: perm.claimCode, scope: perm.manager },
        )
      }
      await db.rolePermissions.bulkAdd(permissionRows)

      await db.users.bulkAdd(USERS.map((u) => ({ ...u, createdAt: now, updatedAt: now })))

      await db.invitations.bulkAdd(
        INVITATIONS.map(({ daysAgo, ...inv }) => ({ ...inv, date: now - daysAgo * DAY })),
      )
    })()
  }
  return seedPromise
}
