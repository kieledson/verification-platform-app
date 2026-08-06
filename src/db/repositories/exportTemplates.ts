import { db, type ExportTemplateRecord } from '@/db/schema'

export async function createExportTemplate(
  input: Omit<ExportTemplateRecord, 'createdAt' | 'updatedAt'>,
): Promise<ExportTemplateRecord> {
  const now = Date.now()
  const record: ExportTemplateRecord = { ...input, createdAt: now, updatedAt: now }
  await db.exportTemplates.add(record)
  return record
}

export function listExportTemplates(): Promise<ExportTemplateRecord[]> {
  return db.exportTemplates.toArray()
}

export function getExportTemplate(id: string): Promise<ExportTemplateRecord | undefined> {
  return db.exportTemplates.get(id)
}

export async function updateExportTemplate(
  id: string,
  patch: Partial<Omit<ExportTemplateRecord, 'id'>>,
): Promise<void> {
  await db.exportTemplates.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteExportTemplate(id: string): Promise<void> {
  await db.exportTemplates.delete(id)
}
