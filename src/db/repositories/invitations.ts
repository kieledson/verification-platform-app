import { db, type InvitationRecord } from '@/db/schema'

export function listInvitations(): Promise<InvitationRecord[]> {
  return db.invitations.orderBy('date').reverse().toArray()
}

export async function createInvitation(record: InvitationRecord): Promise<InvitationRecord> {
  await db.invitations.add(record)
  return record
}

export async function resendInvitation(id: string): Promise<void> {
  await db.invitations.update(id, { date: Date.now(), status: 'Pending' })
}

export async function deleteInvitation(id: string): Promise<void> {
  await db.invitations.delete(id)
}
