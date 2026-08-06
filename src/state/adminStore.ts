import { create } from 'zustand'
import type { ExportTemplateRecord } from '@/db/schema'
import * as exportTemplatesRepo from '@/db/repositories/exportTemplates'

interface AdminState {
  exportTemplates: ExportTemplateRecord[]
  loaded: boolean
  loadAll: () => Promise<void>
  createExportTemplate: (input: Omit<ExportTemplateRecord, 'createdAt' | 'updatedAt'>) => Promise<void>
  updateExportTemplate: (id: string, patch: Partial<Omit<ExportTemplateRecord, 'id'>>) => Promise<void>
  deleteExportTemplate: (id: string) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  exportTemplates: [],
  loaded: false,

  loadAll: async () => {
    const exportTemplates = await exportTemplatesRepo.listExportTemplates()
    set({ exportTemplates, loaded: true })
  },

  createExportTemplate: async (input) => {
    await exportTemplatesRepo.createExportTemplate(input)
    await get().loadAll()
  },
  updateExportTemplate: async (id, patch) => {
    await exportTemplatesRepo.updateExportTemplate(id, patch)
    await get().loadAll()
  },
  deleteExportTemplate: async (id) => {
    await exportTemplatesRepo.deleteExportTemplate(id)
    await get().loadAll()
  },
}))
