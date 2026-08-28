import { create } from 'zustand'
import type { StandardRecord } from '@/db/schema'
import * as standardsRepo from '@/db/repositories/standards'

interface StandardsState {
  standards: StandardRecord[]
  loaded: boolean
  loadAll: () => Promise<void>
  createStandard: (input: Omit<StandardRecord, 'createdAt' | 'updatedAt'>) => Promise<void>
  updateStandard: (id: string, patch: Partial<Omit<StandardRecord, 'id'>>) => Promise<void>
  deleteStandard: (id: string) => Promise<void>
  cloneStandard: (sourceId: string, name: string, version: string) => Promise<StandardRecord>
  publishStandard: (id: string) => Promise<void>
}

export const useStandardsStore = create<StandardsState>((set, get) => ({
  standards: [],
  loaded: false,

  loadAll: async () => {
    const standards = await standardsRepo.listStandards()
    set({ standards, loaded: true })
  },

  createStandard: async (input) => {
    await standardsRepo.createStandard(input)
    await get().loadAll()
  },
  updateStandard: async (id, patch) => {
    await standardsRepo.updateStandard(id, patch)
    await get().loadAll()
  },
  deleteStandard: async (id) => {
    await standardsRepo.deleteStandard(id)
    await get().loadAll()
  },
  cloneStandard: async (sourceId, name, version) => {
    const clone = await standardsRepo.cloneStandard(sourceId, name, version)
    await get().loadAll()
    return clone
  },
  publishStandard: async (id) => {
    await standardsRepo.publishStandard(id)
    await get().loadAll()
  },
}))
