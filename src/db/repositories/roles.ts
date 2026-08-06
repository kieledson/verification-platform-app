import { db, type RoleRecord, type RolePermissionRecord, type PermissionScope } from '@/db/schema'

export function listRoles(): Promise<RoleRecord[]> {
  return db.roles.toArray()
}

export function getRole(id: string): Promise<RoleRecord | undefined> {
  return db.roles.get(id)
}

export async function createRole(record: RoleRecord): Promise<RoleRecord> {
  await db.roles.add(record)
  return record
}

export async function updateRole(id: string, patch: Partial<Omit<RoleRecord, 'id'>>): Promise<void> {
  await db.roles.update(id, patch)
}

export async function deleteRole(id: string): Promise<void> {
  await db.roles.delete(id)
  await db.rolePermissions.where('roleId').equals(id).delete()
}

export function listPermissionsForRole(roleId: string): Promise<RolePermissionRecord[]> {
  return db.rolePermissions.where('roleId').equals(roleId).toArray()
}

export async function setPermissionScope(
  roleId: string,
  claimCode: string,
  scope: PermissionScope,
): Promise<void> {
  await db.rolePermissions.put({ roleId, claimCode, scope })
}
