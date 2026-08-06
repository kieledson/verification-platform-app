import { create } from 'zustand'
import type { UserRecord, RoleRecord, InvitationRecord } from '@/db/schema'
import * as usersRepo from '@/db/repositories/users'
import * as rolesRepo from '@/db/repositories/roles'
import * as invitationsRepo from '@/db/repositories/invitations'

interface SecurityState {
  users: UserRecord[]
  roles: RoleRecord[]
  invitations: InvitationRecord[]
  loaded: boolean
  loadAll: () => Promise<void>
  createUser: (input: Omit<UserRecord, 'createdAt' | 'updatedAt'>) => Promise<void>
  updateUser: (id: string, patch: Partial<Omit<UserRecord, 'id'>>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  createInvitation: (record: InvitationRecord) => Promise<void>
  resendInvitation: (id: string) => Promise<void>
  deleteInvitation: (id: string) => Promise<void>
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  users: [],
  roles: [],
  invitations: [],
  loaded: false,

  loadAll: async () => {
    const [users, roles, invitations] = await Promise.all([
      usersRepo.listUsers(),
      rolesRepo.listRoles(),
      invitationsRepo.listInvitations(),
    ])
    set({ users, roles, invitations, loaded: true })
  },

  createUser: async (input) => {
    await usersRepo.createUser(input)
    await get().loadAll()
  },

  updateUser: async (id, patch) => {
    await usersRepo.updateUser(id, patch)
    await get().loadAll()
  },

  deleteUser: async (id) => {
    await usersRepo.deleteUser(id)
    await get().loadAll()
  },

  createInvitation: async (record) => {
    await invitationsRepo.createInvitation(record)
    await get().loadAll()
  },

  resendInvitation: async (id) => {
    await invitationsRepo.resendInvitation(id)
    await get().loadAll()
  },

  deleteInvitation: async (id) => {
    await invitationsRepo.deleteInvitation(id)
    await get().loadAll()
  },
}))
